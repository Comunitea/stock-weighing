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
        this.streamSuccessCounter = 10;

        // Extraer las propiedades adicionales
        this.remoteDeviceField = this.props.remote_device_field;
        this.measureDeviceId = this.props.measure_device_id;
        this.uomField = this.props.uom_field;

        onMounted(() => {
            this._connect_to_websockets();
        });

        onWillUnmount(() => {
            this._closeSocket();
        });
    }

    _connect_to_websockets() {
        // debugger;
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

        this.socket.onmessage = async (msg) => {
            // debugger;
            const data = await msg.data.text();
            const processedData = this._proccess_msg_f501(data);

            // Manejar la estabilidad de la medida
            if (!processedData.stable) {
                this.streamSuccessCounter = 5;
            }

            if (processedData.stable && this.streamSuccessCounter <= 0) {
                this.state.isStable = true;
                this._setMeasure(processedData.value);
                this._closeSocket();
                return;
            } else {
                this.state.isStable = false;
            }

            if (this.streamSuccessCounter > 0) {
                this.streamSuccessCounter--;
            }

            this.state.icon = this._nextStateIcon(this.state.icon);
        };

        this.socket.onerror = () => {
            console.error('WebSocket error');
        };
    }

    _proccess_msg_f501(msg) {
        debugger;
        // Implementar el procesamiento del mensaje según el protocolo
        // Aquí se asume un simple parseo del valor como ejemplo
        return {
            stable: msg[1] === "\x20",  // Ejemplo de verificación de estabilidad
            value: parseFloat(msg.slice(2, 10)),
        };
    }

    _nextStateIcon(currentIcon) {
        return nextState[currentIcon];
    }

    _setMeasure(value) {
        this.state.amount = value;
        this.props.update(this.state.amount);
    }

    _closeSocket() {
        if (this.socket) {
            this.socket.close();
        }
    }
    _onMeasure() {
        this.state.isMeasuring = true;
        this._connect_to_websockets();
    }

    _onValidateMeasure() {
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
