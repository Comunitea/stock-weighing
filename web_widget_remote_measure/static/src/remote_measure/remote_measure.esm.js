/** @odoo-module **/
import {FloatField} from "@web/views/fields/float/float_field";
import {registry} from "@web/core/registry";
import {standardFieldProps} from "@web/views/fields/standard_field_props";
const {onMounted, onWillUnmount, useState, } = owl;

const nextState = {
    "fa-thermometer-empty": "fa-thermometer-quarter",
    "fa-thermometer-quarter": "fa-thermometer-half",
    "fa-thermometer-half": "fa-thermometer-three-quarters",
    "fa-thermometer-three-quarters": "fa-thermometer-full",
    "fa-thermometer-full": "fa-thermometer-empty",
};


export class RemoteMeasureOwl extends FloatField {
    setup() {
        debugger;
        super.setup();
        this.state = useState({
            amount: 0,
            icon: "fa-thermometer-empty",
            isStable: false,
            isMeasurig: false,
        });
        // this.streamSuccessCounter = 10;

        // Extraer las propiedades adicionales
        this.remoteDeviceField = this.props.remote_device_field;
        this.measureDeviceId = this.props.measure_device_id;
        this.uomField = this.props.uom_field;

        onMounted(() => {
            debugger;
            if (false){

                this._connect_to_websockets();
            }
        });

        onWillUnmount(() => {
            debugger;
            this._closeSocket();
        });
    }

    _connect_to_websockets() {
        console.log("**** _connect_to_websockets() ****");
        const host = "ws://localhost:8765";
        try {
            this.socket = new WebSocket(host);
        } catch (error) {
            // Avoid websockets security error. Local devices won't have wss normally
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
            const processedData = this._proccess_msg_f501(data);

            // Manejar la estabilidad de la medida
            if (!processedData.stable) {
                // this.streamSuccessCounter = 5;
                stream_success_counter = 5
            }

            // if (processedData.stable && this.streamSuccessCounter <= 0) {
            if (processedData.stable && !stream_success_counter) {
                this.state.isStable = true;
                this._setMeasure(processedData.value);
                this._closeSocket();
                console.log("**** SALGO DE ONMESSAGE) ****");
                return;
            } else {
                
            }

            this._unstableMeasure();

            if (stream_success_counter) {
                --stream_success_counter;
            }
            // icon = this._nextStateIcon(icon);
            this.state.icon = this._nextStateIcon(this.state.icon);
            // this.amount = processed_data.value;
            this._setMeasure(processedData.value);

        };

        this.socket.onerror = () => {
            console.error('WebSocket error');
        };
    }

    _unstableMeasure() {
        console.log("**** _unstableMeasure() ****");
        this.state.isStable = false;
    }

    _proccess_msg_f501(msg) {
        // Implementar el procesamiento del mensaje según el protocolo
        // Aquí se asume un simple parseo del valor como ejemplo
        return {
            stable: msg[1] === "\x20",  // Ejemplo de verificación de estabilidad
            value: parseFloat(msg.slice(2, 10)),
        };
    }

    _nextStateIcon(currentIcon) {
        console.log("**** _nextStateIcon(currentIcon) ****" + currentIcon);
        return nextState[currentIcon];
    }

    _setMeasure(value) {
        console.log("**** _setMeasure(value) ****" + value);
        this.state.amount = value;
        this.props.update(this.state.amount);
    }

    _closeSocket() {
        console.log("**** _closeSocket() ****");
        if (this.socket) {
            this.socket.close();
        }
    }
    _onMeasure() {
        console.log("**** _onMeasure() ****");
        this.state.isMeasuring = true;
        this._connect_to_websockets();
    }

    _onValidateMeasure() {
        console.log("**** _onValidateMeasure() ****");
        this.state.isMeasuring = false;
        this._closeSocket();
    }
}

RemoteMeasureOwl.template = "owl_measure_device_status";

// Define solo las nuevas propiedades necesarias
RemoteMeasureOwl.props = {
    ...standardFieldProps,
    remote_device_field: { type: String, optional: true },
    measure_device_id: { type: String, optional: true },
    uom_field: { type: String, optional: true },
};

RemoteMeasureOwl.extractProps = ({ attrs }) => {
    return {
        remote_device_field: attrs.options.remote_device_field,
        measure_device_id: attrs.options.measure_device_id,
        uom_field: attrs.options.uom_field,
    };
};

registry.category("fields").add("remote_measure", RemoteMeasureOwl);
