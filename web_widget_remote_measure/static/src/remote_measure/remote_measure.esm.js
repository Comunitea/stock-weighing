/** @odoo-module **/
import { FloatField } from "@web/views/fields/float/float_field";
import { registry } from "@web/core/registry";

import { useService } from '@web/core/utils/hooks';
import { session } from "@web/session";
import { _t } from 'web.core';
const {onWillStart, onMounted, onWillUnmount, useState } = owl;

console.log('DEBERIA SER EL 1')

const nextState = {
    "fa-thermometer-empty": "fa-thermometer-quarter",
    "fa-thermometer-quarter": "fa-thermometer-half",
    "fa-thermometer-half": "fa-thermometer-three-quarters",
    "fa-thermometer-three-quarters": "fa-thermometer-full",
    "fa-thermometer-full": "fa-thermometer-empty",
};

// TODO: Bug when manual save while measuring
export class RemoteMeasureOwl extends FloatField {
    setup() {
        this.orm = useService("orm");
        this.measureService = useService("measureReader");
        this.notification = useService("notification");
        super.setup();
        this.state = useState({
            // amount: 0,
            icon: "fa-thermometer-empty",
            isStable: false,
            isMeasuring: false,
            buttonClass: "btn-primary",
        });

        this.locale_code = _t.database.parameters.code.replace("_", "-");
        this.decimal_separator = _t.database.parameters.decimal_point;
        this.thousands_sep = _t.database.parameters.thousands_sep;
        this.remote_device_field = this.props.remote_device_field;
        this.default_user_device = this.props.default_user_device;
        if (this.props.remote_device_field === "id") {
            this.remote_device_data = this.props.record.data;
        } else if (this.remote_device_field) {
            // ! in v15 is an object {id: 1, display_name: "device"}. It will be overwritten in loadRemoteDeviceData()
            this.remote_device_data = this.props.record.data[this.remote_device_field];
        }
        // ! in v15 is an object {id: 1, display_name: "device"}. It will be overwritten in loadRemoteDeviceData()
        this.uom = this.props.record.data[this.props.uom_field];
        this.allow_additive_measure = this.props.allow_additive_measure;
        // Add to your view options so you can log requests and responses

        onWillStart(async () => {
            await this.loadRemoteDeviceData();
            if(!this.measureService.isConnected()) {
                this.measureService.connect(this.host,this.connection_mode, this.protocol);
            }
        });

        onMounted(() => {
            if (this.remote_device_data && this.remote_device_data.instant_read) {
                this.measure();
            }
        });

        onWillUnmount(() => {
            // todo revisar
            // this._closeSocket();
            this.removeListeners();
        });
    }


    setRemoteDeviceData(deviceData){
        this.remote_device_data = deviceData;
        this.device_uom_category = this.remote_device_data.uom_category_id[0];
        this.device_uom = this.remote_device_data.uom_id[0];
        this.host = this.remote_device_data && this.remote_device_data.host;
        this.protocol = this.remote_device_data && this.remote_device_data.protocol;
        this.connection_mode =
            this.remote_device_data && this.remote_device_data.connection_mode;
    }

    async loadRemoteDeviceData() {
        console.log("**** loadRemoteDeviceData() ****");
        const [userData] = await this.orm.read(
            "res.users", [session.uid], ["remote_measure_device_id"]);
        this.remote_device_data = userData;
        if (!userData.remote_measure_device_id) {
            return;
        }
    
        const deviceId = userData.remote_measure_device_id[0];
    
        const [deviceData] = await this.orm.read("remote.measure.device", [deviceId], []);   
        const [uomData] = await this.orm.read("uom.uom", [deviceData.uom_id[0]], []);
        
        this.setRemoteDeviceData(deviceData);
        
        this.uom = uomData;
        this.uom_category = this.uom.category_id[0];
        console.log("@@@@@@@@@@@@@@@@@@@this@@@@@@@@@@@@@@@@@@@");
        console.log(this);
    }

    setListeners(){
        this.measureService.bus.on("stableMeasure", this, this.onStableMeasure);
        this.measureService.bus.on("unstableMeasure", this, this.onUnstableMeasure);
        
    }
    removeListeners(){
        this.measureService.bus.off("stableMeasure", this, this.onStableMeasure);
        this.measureService.bus.off("unstableMeasure", this, this.onUnstableMeasure);
    }

    onStableMeasure(value){
        console.log("*** RECIBIDA MEDICION ESTABLE ***");
        
        this._stableMeasure();
        // this._closeSocket();
        this.removeListeners();
        this._awaitingMeasure();
        this._recordMeasure(value);
    }

    onUnstableMeasure(value){
        console.log("*** RECIBIDA MEDICION INESTABLE ***");
        this._unstableMeasure();

        this.state.icon = this._nextStateIcon(this.state.icon);
        this.amount = value;
        this._setMeasure();
        this._recordMeasure(value);
    }


    _connect_to_websockets() {
        console.log("**** _connect_to_websockets() ****");
        try {
            this.socket = new WebSocket(this.host);
        } catch (error) {
            if (error.code === 18) {
                return;
            }
            throw error;
        }
        var stream_success_counter = 10;
        this.socket.onmessage = async (msg) => {
            console.log("**** onmessage() ****");
            console.log("stream_success_counter: ", stream_success_counter);
            const data = await msg.data.text();

            // process data from variable protocol
            const processedData = this[`_proccess_msg_${this.protocol}`](data);
            console.log("processedData: ", processedData);
            if (!processedData.stable) {
                stream_success_counter = 5;
            }

            if (processedData.stable && !stream_success_counter) {
                this._stableMeasure();
                this._closeSocket();
                this._awaitingMeasure();
                this._recordMeasure(processedData.value);
                console.log("**** SALGO DE ONMESSAGE ****");
                return;
            }

            this._unstableMeasure();

            if (stream_success_counter) {
                --stream_success_counter;
            }

            this.state.icon = this._nextStateIcon(this.state.icon);
            this.amount = processedData.value;
            this._setMeasure();
            this._recordMeasure(processedData.value);
        };

        this.socket.onerror = () => {
            // New Notification service alert
            this._awaitingMeasure();
            console.error('WebSocket error');
            this.notification.add(
                this.env._t("Could not conect to wenSocket"), 
                {
                    type: "danger",
                });
        };
    }

    /**
     * Convert the measured units to the units expecte by the record if different
     * @param {Number} amount
     * @returns {Number} converted amount
     */
    _compute_quantity(amount) {
        if (this.uom.id === this.device_uom.id) {
            return amount;
        }
        let converted_amount = amount / this.remote_device_data.uom_factor;
        converted_amount *= this.uom.factor;
        return converted_amount;
    }
    /**
     * Set value
     */
    async _setMeasure() {

        if (isNaN(this.amount)) {
            return;
        }
        // this.amount = this._compute_quantity(amount);
        if (this.start_add) {
            this.amount += this.props.val;
        }
        // this.$input.val(this.amount.toLocaleString(this.locale_code));

        // this._setValue(this.$input.val());
        this.props.update(this.amount);
    }

    /**
     * While the widget isn't querying it will be purple as a signal that we can start
     */
    _awaitingMeasure() {
        // this.$start_measure.removeClass("btn-success btn-danger");
        // this.$start_measure.addClass("btn-primary");
        // this.$stop_measure.addClass("d-none");
        // this.$start_measure.removeClass("d-none");
        // if (this.$start_measure_add) {
        //     this.$start_measure_add.removeClass("d-none");
        // }
        this.state.buttonClass = "btn-primary";
    }

    /**
     * Once we consider the measure is stable render the button as green
     */
    _stableMeasure() {
        console.log("**** _stableMeasure() ****");
        this.state.isStable = true;
        this.state.buttonClass = 'btn-success';

    }

    _unstableMeasure() {
        console.log("**** _unstableMeasure() ****");
        this.state.isStable = false;
        this.state.buttonClass = 'btn-danger';
    }

    _proccess_msg_f501(msg) {
        console.log("**** _proccess_msg_f501() ****");
        return {
            stable: msg[1] === "\x20",
            value: parseFloat(msg.slice(2, 10)),
        };
    }

    _nextStateIcon(currentIcon) {
        console.log("**** _nextStateIcon(currentIcon) ****", currentIcon);
        return nextState[currentIcon];
    }

    _recordMeasure(value) {
        console.log("**** _recordMeasure(value) ****", value);
        this.start_add = false;
        this.state.amount = value;
        this.props.update(this.state.amount);
        this.start_add = false;
    }

    _closeSocket() {
        console.log("**** _closeSocket() ****");
        if (this.socket) {
            this.socket.close();
            this.state.isMeasuring = false;
            this.socket = null; // Asegurarse de que la referencia al socket se elimine
        }
    }

    // New functio. Same button for start and stop measuring
    // Calling _on functions to simulate v15
    toggleMeasurement() {
        console.log("**** toggleMeasurement() ****");
        if (this.state.isMeasuring) {
            this._onValidateMeasure();
        } else {
            this._onMeasure();
        }
    }

    /**
     *
     */
    _recordMeasure() {
        this.start_add = false;
        this.input_val = this.amount;
        this.start_add = false;
    }



    measure(){
        console.log("**** measure() ****");
        if (this.props.readonly) {
            return;
        }
        this.state.isMeasuring = true;
        this.state.buttonClass = "btn-secondary";
        this.setListeners();
        // this[`_connect_to_${this.connection_mode}`]();

    }

    measure_stop() {
        console.log("**** measure_stop() ****");
        // this._closeSocket();
        this.removeListeners()
        this.stop = true;
        this._awaitingMeasure();
        this.state.isMeasuring = false;
        // this.state.buttonClass = "btn-primary";
    }

    // Dummy function to simulate v15. ev.preventDefault is on the template
    // using an owl shortcut (t-on-click.prevent="_onMeasure")
    _onMeasure() {
        console.log("**** _onMeasure() ****");
        this.measure();
    }
    _onMeasureAdd() {
        this.start_add = true;
        // this.$start_measure.addClass("d-none");
        // this.$start_measure_add.addClass("d-none");
        // this.$stop_measure.removeClass("d-none");
        // this.$icon = this.$stop_measure.find("i");
        
         this[`_connect_to_${this.connection_mode}`]();
    }
    
    // Dummy function to simulate v15. ev.preventDefault is on the template
    // using an owl shortcut (t-on-click.prevent="_onMeasure")
    _onValidateMeasure() {
        console.log("**** _onValidateMeasure() ****");
        this.measure_stop()
        
        
    }
}

RemoteMeasureOwl.template = "owl_measure_device_status";

// Define solo las nuevas propiedades necesarias
RemoteMeasureOwl.props = {
    ...FloatField.props,
    remote_device_field: { type: String, optional: true },
    default_user_device: { type: Boolean, optional: true },
    uom_field: { type: String, optional: true },
    allow_additive_measure: { type: Boolean, optional: true },
};
RemoteMeasureOwl.supportedTypes = ["float"];

const superExtractProps = FloatField.extractProps;
RemoteMeasureOwl.extractProps = ({ attrs, field }) => {
    return {
        ...superExtractProps({attrs, field}),  // Geting Digits Precission
        remote_device_field: attrs.options.remote_device_field,
        default_user_device: attrs.options.default_user_device,
        uom_field: attrs.options.uom_field,
        allow_additive_measure: attrs.options.allow_additive_measure,
    };
};
// Equivalent to old widget classname
RemoteMeasureOwl.additionalClasses = ["o_field_remote_device"];

registry.category("fields").add("remote_measure", RemoteMeasureOwl);
