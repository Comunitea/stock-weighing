/** @odoo-module **/
import { registry } from "@web/core/registry";
const { useState } = owl;
import { useService } from "@web/core/utils/hooks";
import { RemoteMeasureOwl } from "@web_widget_remote_measure/remote_measure/remote_measure.esm";

export class AutoMeasureWidget extends RemoteMeasureOwl {
    setup() {
        debugger;
        super.setup();
        this.value = 0;
        this.rpc = this.env.services.rpc;
        this.orm = useService("orm");
        this.reconnectionDelay = 1000;  // Inicialmente 5 segundos
        this.maxReconnectionDelay = 60000;  // Límite de 1 minuto para el backoff exponencial
        this.keepAliveInterval = 30000;  // Ping cada 30 segundos
        this._connect_to_websockets2();  // Conectar al iniciar el componente
    }

    get circleColor() {
        // Si el valor es mayor que 0, rojo; si es 0 o menor, verde.
        return this.value > 0 ? 'red' : 'green';
    }

    // async loadRemoteDeviceData() {
    //     // Llamamos al método original para cargar los datos del dispositivo remoto
    //     await super.loadRemoteDeviceData();
    //     console.log("**** loadRemoteDeviceData() ****");
    //     this._connect_to_websockets2();  // Conectamos automáticamente el socket al cargar los datos
    // }

    _connect_to_websockets2() {
        console.log("**** _connect_to_websockets2() ****");
        try {
            // if (this.socket) {  //
            //     this.socket.close();  // Cerrar la conexión existente
            // }
            this.socket = new WebSocket(this.host);
            this._setupWebSocketEvents();  // Configuramos los eventos del WebSocket
        } catch (error) {
            if (error.code === 18) {
                return;  // Error de permisos en algunos navegadores
            }
            throw error;
        }
    }

    _setupWebSocketEvents() {
        var stream_success_counter = 10;

        this.socket.onopen = () => {
            console.log("WebSocket connection established");
            this._startKeepAlive();  // Iniciar pings de keep-alive
            this.reconnectionDelay = 1000;  // Resetear el tiempo de reconexión al abrir la conexión
        };

        this.socket.onmessage = async (msg) => {
            console.log("**** onmessage() (desde _connect_to_websockets2) ****");
            const data = await msg.data.text();
            const processedData = this[`_proccess_msg_${this.protocol}`](data);

            if (!processedData.stable) {
                stream_success_counter = 5;  // Reinicia el contador si no es estable
            }

            if (processedData.stable && !stream_success_counter) {
                this._stableMeasure();
                this._awaitingMeasure();
                this._recordMeasure(processedData.value);
                return;
            }

            this._unstableMeasure();
            if (stream_success_counter) --stream_success_counter;
            this.amount = processedData.value;
            this._setMeasure();
            this._recordMeasure(processedData.value);
        };

        this.socket.onerror = () => {
            console.error('WebSocket error');
            this._awaitingMeasure();
        };

        this.socket.onclose = () => {
            console.log("WebSocket connection closed. Trying to reconnect...");
            this._stopKeepAlive();
            this._reconnectWebSocket();  // Intentar reconectar
        };
    }

    _startKeepAlive() {
        this.keepAliveTimer = setInterval(() => {
            if (this.socket.readyState === WebSocket.OPEN) {
                this.socket.send("ping");
                console.log("Keep-alive ping sent");
            }
        }, this.keepAliveInterval);
    }

    _stopKeepAlive() {
        clearInterval(this.keepAliveTimer);
    }

    _reconnectWebSocket() {
        setTimeout(() => {
            console.log(`Reconnecting WebSocket after ${this.reconnectionDelay / 1000} seconds...`);
            this._connect_to_websockets2();
            this.reconnectionDelay = Math.min(this.reconnectionDelay * 2, this.maxReconnectionDelay);  // Backoff exponencial
        }, this.reconnectionDelay);
    }

    async _stableMeasure() {
        debugger;
        super._stableMeasure();
        if (this.state.isStable) {
            let oldValue = this.value;
            this.value = this.amount;

            if (oldValue === 0 && this.amount > 0) {
                let move_id = this.props.record.data.id
                const action = {
                    type: 'ir.actions.act_window',
                    res_model: 'weighing.wizard',
                    views: [[false, 'form']],
                    target: 'new',
                    context: { active_id: move_id }
                };
                /const wizardResult = await this.env.services.action.doAction(action
                console.log("Creo operación")
                // await this.orm.call("stock.move", "set_auto_weight", [move_id, this.value]);
                // debugger;
                // const viewAction = this.env.model.actionService.currentController.action;
                // this.env.model.actionService.restore()
                // this.env.model.actionService.doAction(viewAction, {});
                // this.trigger_up('reload');  // Esto recarga la vista en la que está montado el componente
            }
        }
        this.props.update(this.amount);
    }
}
AutoMeasureWidget.template = "web_widget_auto_measure.AutoMeasureWidget";
AutoMeasureWidget.props = {
    ...RemoteMeasureOwl.props,
};

registry.category("fields").add("auto_measure", AutoMeasureWidget);
