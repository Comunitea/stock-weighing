/** @odoo-module **/
import { registry } from "@web/core/registry";
const {onWillStart, onMounted, onWillUnmount, onWillDestroy, useState } = owl;
import { useService } from "@web/core/utils/hooks";
import { RemoteMeasureOwl } from "@web_widget_remote_measure/remote_measure/remote_measure.esm";

export class AutoMeasureWidget extends RemoteMeasureOwl {
    setup() {
        console.log("### 2 setup() ###");
        super.setup();
        this.measureService = useService("measureReader");
        this.view = useService("view");
        this.isprocessing = false;
        // this.value = 0;  // this.amount es reactivo (esta comentado en el useState, pero no debería, se mete luego en el onmessage y el _recordMeasure())
        this.value = this.props.value;
        this.showWidget = this.env.config.viewType === "kanban" ? false : true;

        
        this.reconnectionDelay = 1000;  // Inicialmente 5 segundos
        this.maxReconnectionDelay = 60000;  // Límite de 1 minuto para el backoff exponencial
        this.keepAliveInterval = 30000;  // Ping cada 30 segundos

        this.last_weight = 0;

        // Hooks can not be overwrited, so we use the original methods in super class
        // if we declare the hooks in the subclass, they will be executed after the superclass

        // onWillStart(async () => {
        //     debugger;
        //     console.log("### 2 onWillStart() ###");
        // });

        // onMounted(() => {
        //     this.measureService.connect(this.props.host, this.props.protocol);
        //     this.measureService.bus.on("stableMeasure", this, this.onStableMeasure);
        //     this.measureService.bus.on("unstableMeasure", this, this.onUnstableMeasure);
        // });
        onWillUnmount(() => {
            console.log("### 2 onWillUnmount() ###");
            debugger;
            this.measureService.disconnect();
        });
        // onWillDestroy(() => {
        //     console.log("### 2 onWillDestroy() ###");
        //     this._closeSocket();
        // });
    }

    get circleColor() {
        // Si el valor es mayor que 0, rojo; si es 0 o menor, verde.
        return this.amount > 0 ? 'red' : 'green';
    }

    async loadRemoteDeviceData() {
        // Llamamos al método original para cargar los datos del dispositivo remoto
        await super.loadRemoteDeviceData();
        console.log("### loadRemoteDeviceData() ###");
        if (this.showWidget) {
            // this._connect_to_websockets2();  // Conectar al iniciar el componente
            
            //NEW IMPLEMENTATION
            this.measureService.connect(this.host, this.connection_mode, this.protocol);
            this.measureService.bus.on("stableMeasure", this, this.onStableMeasure);
            this.measureService.bus.on("unstableMeasure", this, this.onUnstableMeasure);
        }
    }

    async onStableMeasure(value) {
        // if (this.isprocessing){
        //     return
        // }
        // this.isprocessing = true;
        console.log("### onStableMeasure() ###");
        console.log("Value: ", value);
        let oldValue = this.value;
        this.value = this.amount;

        if (oldValue === 0 && this.amount > 0 && this.amount != this.last_weight) {
            this.last_weight = this.amount;
            let move_id = this.props.record.data.id
            console.log("Creo operación")
            debugger;
            await this.orm.call("stock.move", "set_auto_weight", [move_id, this.value]);
            // await this.env.model.actionService.switchView('form')
            await this.env.model.actionService.doAction({
                        type: 'ir.actions.client',
                        tag: 'reload',
            });
            
        }

        this.props.update(this.amount);
        // this.isprocessing = false;
        
        // this._stableMeasure();
    }
    onUnstableMeasure(value) {
        console.log("### onUnstableMeasure() ###");
        console.log("Value: ", value);
        this._unstableMeasure();
        this.amount = value;
        this._setMeasure();
        this._recordMeasure(this.amount);
    }

    // _connect_to_websockets2() {
    //     console.log("### _connect_to_websockets2() ###");
    //     try {
    //         // if (this.socket) {  //
    //         //     this.socket.close();  // Cerrar la conexión existente
    //         // }
    //         if ( !this.socket) {
    //             this.socket = new WebSocket(this.host);
    //             console.log("-----------WEBSOCKET CREATED----------");
    //             this._setupWebSocketEvents();  // Configuramos los eventos del WebSocket
    //         }
    //         else {
    //             console.log("WebSocket ya existe, ignorando...");
    //         }
    //     } catch (error) {
    //         if (error.code === 18) {
    //             return;  // Error de permisos en algunos navegadores
    //         }
    //         throw error;
    //     }
    // }

    // _setupWebSocketEvents() {
    //     var stream_success_counter = 10;

    //     this.socket.onopen = () => {
    //         console.log("WebSocket connection established");
    //         // this._startKeepAlive();  // Iniciar pings de keep-alive
    //         // this.reconnectionDelay = 1000;  // Resetear el tiempo de reconexión al abrir la conexión
    //     };

    //     this.socket.onmessage = async (msg) => {
    //         console.log("### onmessage() (desde _connect_to_websockets2) ###");
    //         const data = await msg.data.text();
    //         console.log("Data received: ", data);
    //         const processedData = this[`_proccess_msg_${this.protocol}`](data);

    //         if (!processedData.stable) {
    //             stream_success_counter = 5;  // Reinicia el contador si no es estable
    //         }
            
    //         // STABLE MEASURE
    //         if (processedData.stable && !stream_success_counter) {
    //             // Set the readed value to reactive amount field and use update promise to save in the record
    //             this._stableMeasure();
    //             // this._awaitingMeasure();
    //             // this._recordMeasure(processedData.value);
    //             return;
    //         }
    //         // UNSTABLE MEASURE
    //         // Update the reactive field amount without saving to record
    //         // Setting reactive fiels isStable to false
    //         this._unstableMeasure();
    //         if (stream_success_counter) --stream_success_counter;

    //         this.amount = processedData.value;
    //         // Set the readed value to reactive amount field and use update promise to save in the record
    //         this._setMeasure();

    //         // Todo quitar?
    //         this._recordMeasure(processedData.value);
    //     };

    //     this.socket.onerror = () => {
    //         console.error('WebSocket error');
    //     };

    //     // this.socket.onclose = () => {
    //     //     console.log("WebSocket connection closed");
    //     //     // console.log("WebSocket connection closed. Trying to reconnect...");
    //     //     // this._stopKeepAlive();
    //     //     // this._reconnectWebSocket();  // Intentar reconectar
    //     // };
    //     this.socket.onclose = (event) => {
    //         console.log(`WebSocket connection closed with code: ${event.code}, reason: ${event.reason}`);
    //     };
    // }

    // _startKeepAlive() {
    //     this.keepAliveTimer = setInterval(() => {
    //         if (this.socket.readyState === WebSocket.OPEN) {
    //             this.socket.send("ping");
    //             console.log("Keep-alive ping sent");
    //         }
    //     }, this.keepAliveInterval);
    // }

    // _stopKeepAlive() {
    //     clearInterval(this.keepAliveTimer);
    // }

    // _reconnectWebSocket() {
    //     setTimeout(() => {
    //         console.log(`Reconnecting WebSocket after ${this.reconnectionDelay / 1000} seconds...`);
    //         this._connect_to_websockets2();
    //         this.reconnectionDelay = Math.min(this.reconnectionDelay * 2, this.maxReconnectionDelay);  // Backoff exponencial
    //     }, this.reconnectionDelay);
    // }

    // async _stableMeasure() {
    //     super._stableMeasure();
    //     if (this.state.isStable) {
    //         let oldValue = this.value;
    //         this.value = this.amount;
            
    //         if (oldValue === 0 && this.amount > 0) {
    //             let move_id = this.props.record.data.id
    //             console.log("Creo operación")
    //             debugger;
    //             await this.orm.call("stock.move", "set_auto_weight", [move_id, this.value]);
    //             await this.env.model.actionService.switchView('form')
    //             // await this.env.model.actionService.doAction({
    //             //         type: 'ir.actions.client',
    //             //         tag: 'reload',
    //             //     });
    //             // await this.env.model.actionService.switchView('form')
                
    //             // const action = {
    //             //     type: 'ir.actions.act_window',
    //             //     res_model: 'weighing.wizard',
    //             //     views: [[false, 'form']],
    //             //     target: 'new',
    //             //     context: { active_id: move_id }
    //             // };
    //             //  await this.env.services.action.doAction(action)
    //             // const viewAction = this.env.model.actionService.currentController.action;
    //             // this.env.model.actionService.loadAction(viewAction.id, {});
    //             // await this.env.model.actionService.doAction({
    //             //     type: 'ir.actions.client',
    //             //     tag: 'reload',
    //             // });
    //             // this.env.model.actionService.restore()
    //             // this.env.model.actionService.doAction(viewAction, {});
    //             // this.trigger_up('reload');  // Esto recarga la vista en la que está montado el componente
    //         }
    //     }
    //     this.props.update(this.amount);
    //     // this.props.update(this.value);
    // }
    
}
AutoMeasureWidget.template = "web_widget_auto_measure.AutoMeasureWidget";
AutoMeasureWidget.props = {
    ...RemoteMeasureOwl.props,
};

const superExtractProps = RemoteMeasureOwl.extractProps;
AutoMeasureWidget.extractProps = ({ attrs, field }) => {
    return {
        ...superExtractProps({attrs, field}),  // Geting Digits Precission
    };
};

registry.category("fields").add("auto_measure", AutoMeasureWidget);