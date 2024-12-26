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
        this.streamSuccessCounter = 50;
    }

    async testConnectionWebSocket(host) {
        try {
            const socket = new WebSocket(this.host);
            const result = await Promise.race([
                new Promise((resolve, reject) => {
                    socket.onopen = () => {
                        socket.close();
                        resolve(true);
                    };
                    socket.onerror = (error) => {
                        socket.close();
                        reject(error);
                    };
                }),
                new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Connection timeout')), 1000);
                })
            ]);
            return result;
        } catch (error) {
            return false;
        }
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

        this.streamSuccessCounter = 50;

        // Emitir evento cuando la conexión esté abierta
        this.socket.onopen = () => {
            console.info("WebSocket connection established");
            // Emitimos el evento "connection_opened" en el bus
            this.bus.trigger("conected");
        };

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
                this.streamSuccessCounter = 50;
            }
            if (processedData.stable && !this.streamSuccessCounter) {
                this.bus.trigger("stableMeasure", processedData.value);
                return;
            }
            
            this.bus.trigger("unstableMeasure", processedData.value);
            


            if (this.streamSuccessCounter) {
                this.streamSuccessCounter = this.streamSuccessCounter - 1
            }
        };
        this.socket.onclose = () => {
            this.bus.trigger("disconnected");
            this.socket = null;
        }
        this.socket.onerror = () => {
            this.bus.trigger("error", { message: "Could not connect to WebSocket" });
            this.notificationService.add(
                this.env._t("Could not conect to webSocket"), 
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
}

export const MeasureReaderService = {
    dependencies: ["notification"],
    start(env, { notification }) {
        console.warn("[[[[[[[[[[[[Starting MeasureReaderService]]]]]]]]]]]]]]");
        return new MeasureReader(env, notification);
    }
};

registry.category("services").add("measureReader", MeasureReaderService);
