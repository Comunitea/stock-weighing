/** @odoo-module **/
import {registry} from "@web/core/registry";
import { FloatField } from "@web/views/fields/float/float_field";
const { useState } = owl;
import { Dialog } from "@web/core/dialog/dialog";

debugger;
// import {RemoteMeasureOwl} from "@web_widget_remote_measure/remote_measure/remote_measure.esm";
const RemoteMeasureOwl = registry.category("fields").get("remote_measure");


export class RemoteMeasureFormOwl extends RemoteMeasureOwl {
    setup() {
        super.setup();
        this.tares = this.props.tares;
        this.tare = 0;
        this.amount = this.props.value;
        this.remote_devices = [];
        this.number_format_options = {
            minimumFractionDigits: 3,
            useGrouping: false,
        };
        this.state = useState({
            ...this.state,
            tare: 0,
            real_amount: 0,
            manual_tare: 0,
            show_dialog: false,
            remote_device_name: "" 
        });
    }
    // get remoteMeasureProps() {
    //     const {tares, inputType, ...result} = this.props;
    //     return result;
    // }

    setRemoteDeviceData(deviceData){
        super.setRemoteDeviceData(deviceData)
        this.state.remote_device_name = this.remote_device_data.name;
    }

    async readDevices() {
        console.log("**** loadRemoteDeviceData() ****");
        // const [userData] = await this.orm.read(
        //     "res.users", [session.uid], ["remote_measure_device_id"]);
        const result = await this.orm.searchRead(
                "remote.measure.device",
                [],
                ["id", "name"],
                {}
        );
        console.log("**** loadRemoteDeviceData() ****", result);
        this.remote_devices = result;
    }

    async _onDeviceSelector(ev) {
        ev.preventDefault();
        await this.readDevices();
        this.state.show_dialog = true;
    }

    async _onSelectDevice(ev) {
        ev.preventDefault();
        const deviceId = parseInt(ev.currentTarget.dataset.device_id);
        const [newdDeviceData] = await this.orm.read("remote.measure.device", [deviceId], []);   
        this.setRemoteDeviceData(newdDeviceData);
        this.state.show_dialog = false
    }


    /**
     * Number formatting helper
     * @param {Number} weight
     * @returns {String}
     */
    format_weight(weight) {
        return weight.toLocaleString(this.locale_code, this.number_format_options);
    }

    /**
     * Add the tare to the real weighted measure
     * @override
     */
    async _setMeasure() {
        let total = this.amount;
        this.state.real_amount = this.format_weight(this.amount);
        if (this.tare) {
            total = this.amount - this.tare;
        }
        // this.amount = this._compute_quantity(total);
        // this.amount = this.format_weight(total)
        // if (this.start_add) {
        //     this.amount += this.props.val;
        // }
        // this.$input.val(this.amount.toLocaleString(this.locale_code));

        // this._setValue(this.$input.val());
        // this.props.update(this.amount);
        this.props.update(total);
    }


    /* TARE METHODS */

    _updateTare() {
        // this.$tare_amount.text(this.format_weight(this.tare));
        // this.$real_amount.text(this.format_weight(this.amount));
        this.state.tare = this.format_weight(this.tare);
        // this._setMeasure(this.amount);
        this._setMeasure(this.props.value);
    }

    /**
     * Auto select
     * @param {Event} ev
     */
    _onFocusInputTare(ev) {
        ev.currentTarget.select();
    }
    /**
     * Add the tare to the total weight
     * @param {Event} ev
     */
    _onClickTare(ev) {
        ev.preventDefault();
        const tare = parseFloat(ev.currentTarget.dataset.tare);
        this.tare += tare
        this._updateTare();
    }

    _changeTare(tare) {
        this.tare = tare;
        this._updateTare();
    }
    /**
     * Update the tare manually
     * @param {Event} ev
     */
    _onChangeInputTare(ev) {
        this._changeTare(parseFloat(ev.currentTarget.value));
    }
    /**
     * Step up/down the manual tare value
     * @param {Event} ev
     */
    _onStepTare(ev) {
        const step_button = ev.currentTarget;
        const input = step_button
            .closest("[name='manual_tare']")
            .querySelector("input");
        if (step_button.dataset.mode === "plus") {
            input.stepUp();
        } else {
            input.stepDown();
        }
        this._changeTare(parseFloat(input.value));
    }
}
RemoteMeasureFormOwl.template = "stock_weighing_remote_measure.RemoteMeasureFormOwl";
RemoteMeasureFormOwl.props = {
    ...RemoteMeasureOwl.props,
    tares: { type: Object, optional: true },
};

const superExtractProps = RemoteMeasureOwl.extractProps;
RemoteMeasureFormOwl.extractProps = ({ attrs, field }) => {
    return {
        ...superExtractProps({attrs, field}),  // Geting Digits Precission
        remote_device_field: attrs.options.remote_device_field,
        uom_field: attrs.options.uom_field,
        tares: attrs.options.tares,
    };
};
RemoteMeasureFormOwl.additionalClasses = ["weight_wizard"];
RemoteMeasureFormOwl.components = { Dialog };

debugger;
registry.category("fields").add("remote_measure_form", RemoteMeasureFormOwl);