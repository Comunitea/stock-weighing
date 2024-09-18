/** @odoo-module **/
import { registry } from "@web/core/registry";
const {onWillStart, onMounted, onWillUnmount, onWillDestroy, useState } = owl;
import { useService } from "@web/core/utils/hooks";
import { RemoteMeasureOwl } from "@web_widget_remote_measure/remote_measure/remote_measure.esm";

// TODO: REMOVE
// Este widget pensado para tomar automaticamente valores de la báscula y detectar
// el cambio de cero a algun tipo de peso para crear un stock.move.line directamente
// Esto es un problema ya que al refrescar la vista el componente se desftrutye
// Usamos mejor el auto_measure_form


export class AutoMeasureWidget extends RemoteMeasureOwl {
    setup() {
        console.log("### 2 setup() ###");
        super.setup();
        this.measureService = useService("measureReader");
        this.view = useService("view");
        this.isprocessing = false;
        this.value = this.props.value;
        this.amount = this.props.value;
        this.showWidget = this.env.config.viewType === "kanban" ? false : true;
        this.listen = false;
    
        onWillUnmount(() => {
            console.log("### 2 onWillUnmount() ###");
            
            this.measureService.bus.off("stableMeasure", this, this.onStableMeasure);
            this.measureService.bus.off("unstableMeasure", this, this.onUnstableMeasure);
            this.listen = false;
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
            
            //NEW IMPLEMENTATION
            console.warn("Intento conectar------------------")
            this.measureService.connect(this.host, this.connection_mode, this.protocol);
            console.log("Is connected: ", this.measureService.isConnected());    
        }
        if (this.measureService.isConnected() && !this.listen) {
            this.measureService.bus.on("stableMeasure", this, this.onStableMeasure);
            this.measureService.bus.on("unstableMeasure", this, this.onUnstableMeasure);
            this.listen = true;
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
    }

    async doAutoOperation() {
        this.last_weight = this.amount;
        let move_id = this.props.record.data.id
        console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!Creo operación!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        this.measureService.bus.off("stableMeasure", this, this.onStableMeasure);
        this.measureService.bus.off("unstableMeasure", this, this.onUnstableMeasure);
        this.measureService.disconnect();  // Disconnect the websocket, if not error
        await this.orm.call("stock.move", "set_auto_weight", [move_id, this.value]);
        
        // !THIS WILL RELOAD THE VIEW AND DESTROY THE COMPONENT WHERE THESE ACTIONS ARE CALLED
        // this.env.model.actionService.doAction("reload_context");
        // await this.env.model.actionService.switchView('form')
        this.env.model.actionService.doAction({
            type: 'ir.actions.client',
            tag: 'soft_reload',
        });
    }
    
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