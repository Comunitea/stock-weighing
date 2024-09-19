/** @odoo-module **/
import { registry } from "@web/core/registry";
const { EventBus } = owl;


export class MeasureReader {
    constructor(env, notification) {
        this.name = "soylaclase"
        this.bus = new EventBus();
        this.socket = null;
        this.host = null;
        this.connection_mode = null;
        this.protocol = null;
        // Using Service dependencies:
        this.notificationService = notification;
        this.env = env;
    }

    connect(host, connection_mode, protocol) {
        this.host = host;
        this.connection_mode = connection_mode;
        this.protocol = protocol;
        this[`_connect_to_${connection_mode}`]();
    }

    disconnect() {
        if (!this.isConnected()) {
            console.warn("ignoring disconnect request, not connected");
            return;
        }

        this.socket.close();
        this.socket = null;
        // this.host = null;
        // this.connection_mode = null;
        // this.protocol = null;
    }

    isConnected() {
        if (!this.socket) {
            return false;
        }
        // return this.socket && this.socket.readyState === WebSocket.OPEN;
        return true;
    }

    _connect_to_websockets() {
        try {
            if (this.isConnected()) {
                console.warn("ignoring connect request, already connected");
                return;
            }
            this.socket = new WebSocket(this.host);
        } catch (error) {
            if (error.code === 18) { // Invalid access error
                return;
            }
            throw error;
        }

        var streamSuccessCounter = 10;

        this.socket.onmessage = async (msg) => {
            const data = await msg.data.text();
            if (!this.protocol){
                console.error("Protocol not set");
                return;
            }
            if (!this.socket){
                console.error("socket not set");
                return;
            }

            const processedData = this[`_proccess_msg_${this.protocol}`](data);
            if (!processedData.stable) {
                streamSuccessCounter = 5;
            }

            if (processedData.stable && !streamSuccessCounter) {
                this.bus.trigger("stableMeasure", processedData.value);
                return;
            }

            this.bus.trigger("unstableMeasure", processedData.value);

            if (streamSuccessCounter) {
                --streamSuccessCounter;
            }
        };

        this.socket.onerror = () => {
            this.bus.trigger("error", { message: "Could not connect to WebSocket" });
            this.notificationService.add(
                this.env._t("Could not conect to wenSocket"), 
                {
                    type: "danger",
                });
        };
    }

    _proccess_msg_f501(msg) {
        return {
            stable: msg[1] === "\x20",
            value: parseFloat(msg.slice(2, 10)),
        };
    }

    // _proccess_msg_sscar(msg) {
    //     const noIDPattern = /^([+-])\s*(\d+(\.\d{1,3})?)\r$/;
    //     const withIDPattern = /^(\d{2}):\s*([+-])\s*(\d+(\.\d{1,3})?)\r$/;

    //     let result = {};

    //     // Check for message without ID
    //     let match = noIDPattern.exec(msg);
    //     if (match) {
    //         const sign = match[1];
    //         const weight = match[2];
    //         const read_weight = parseFloat(weight);
    //         result = {
    //             // stable: sign !== '-',
    //             stable: this.last_weight === read_weight,
    //             value: read_weight
    //         };
    //         this.last_weight = read_weight;
    //     } else {
    //         // Check for message with ID
    //         match = withIDPattern.exec(msg);
    //         if (match) {
    //             const id = match[1];
    //             const sign = match[2];
    //             const weight = match[3];
    //             result = {
    //                 id: id,
    //                 stable: sign !== '-',
    //                 value: parseFloat(weight)
    //             };
    //         }
    //     }

    //     return result;
    // }


}

export const MeasureReaderService = {
    dependencies: ["notification"],
    start(env, { notification }) {
        console.warn("[[[[[[[[[[[[Starting MeasureReaderService]]]]]]]]]]]]]]");
        return new MeasureReader(env, notification);
    }
};

registry.category("services").add("measureReader", MeasureReaderService);
