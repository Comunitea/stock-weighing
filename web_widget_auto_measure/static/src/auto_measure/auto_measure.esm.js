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
        // this.amount = this.props.value;
        this.showWidget = this.env.config.viewType === "kanban" ? false : true;

        
        // this.reconnectionDelay = 1000;  // Inicialmente 5 segundos
        // this.maxReconnectionDelay = 60000;  // Límite de 1 minuto para el backoff exponencial
        // this.keepAliveInterval = 30000;  // Ping cada 30 segundos


        // Hooks can not be overwrited, so we use the original methods in super class
        // if we declare the hooks in the subclass, they will be executed after the superclass

        onWillUnmount(() => {
            console.log("### 2 onWillUnmount() ###");
            
            this.measureService.bus.off("stableMeasure", this, this.onStableMeasure);
            this.measureService.bus.off("unstableMeasure", this, this.onUnstableMeasure);
            // !! El disconect provoca que no se vuelva a montar
            // if (this.measureService.isConnected()) {
            //     this.measureService.disconnect();
            // }
            // this.measureService.disconnect();
        });

    }

    get circleColor() {
        // Si el valor es mayor que 0, rojo; si es 0 o menor, verde.
        return this.amount > 0 ? 'red' : 'green';
    }

    async loadRemoteDeviceData() {
        // Llamamos al método original para cargar los datos del dispositivo remoto
        await super.loadRemoteDeviceData();
        console.log("### loadRemoteDeviceData() ###");
        if (this.showWidget && !this.measureService.isConnected()) {
            // this._connect_to_websockets2();  // Conectar al iniciar el componente
            
            //NEW IMPLEMENTATION
            console.warn("Intento conectar------------------")
            this.measureService.connect(this.host, this.connection_mode, this.protocol);
            console.log("Is connected: ", this.measureService.isConnected());
            this.measureService.bus.off("stableMeasure", this, this.onStableMeasure);
            this.measureService.bus.off("unstableMeasure", this, this.onUnstableMeasure);
            this.measureService.bus.on("stableMeasure", this, this.onStableMeasure);
            this.measureService.bus.on("unstableMeasure", this, this.onUnstableMeasure);
        }
    }

    onStableMeasure(value) {
        
        console.log("-------- onStableMeasure() ------------, Value: ", value);
        let oldValue = this.value;
        this.value = this.amount;
        // this.amount = value;

        console.log("oldValue: ", oldValue , "this.amount: ", this.amount);
        if (oldValue === 0 && this.amount > 0) {
            this.doAutoOperation();
            
        }

        this.props.update(this.amount);
    }
    onUnstableMeasure(value) {
        console.log("### onUnstableMeasure() ###: ", value);
        this.amount = value;  // Important to no launch error
        this._setMeasure();
        // this._recordMeasure(this.amount);
    }

    async doAutoOperation() {
        this.last_weight = this.amount;
        let move_id = this.props.record.data.id
        console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!Creo operación!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        debugger;
        await this.orm.call("stock.move", "set_auto_weight", [move_id, this.value]);
        debugger;
        this.measureService.bus.off("stableMeasure", this, this.onStableMeasure);
        this.measureService.bus.off("unstableMeasure", this, this.onUnstableMeasure);
        this.measureService.disconnect();
        // this.env.model.actionService.doAction("reload_context");
        // await this.env.model.actionService.switchView('form')
        await this.env.model.actionService.doAction({
            type: 'ir.actions.client',
            tag: 'soft_reload',
        });
        // this.measureService.connect(this.host, this.connection_mode, this.protocol);
        // this.measureService.bus.off("stableMeasure", this, this.onStableMeasure);
        // this.measureService.bus.off("unstableMeasure", this, this.onUnstableMeasure);
        // console.log("~~~~~~~~~~~~~~~~~~~REloades~~~~~~~~~~~~~~~~~~~~~~~")
        // console.log(this.measureService.stocket)
        // await this.env.model.root.load();
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