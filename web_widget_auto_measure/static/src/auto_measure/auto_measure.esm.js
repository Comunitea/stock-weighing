/** @odoo-module **/
import {registry} from "@web/core/registry";
const { useState } = owl;
import {useService} from "@web/core/utils/hooks";

import {RemoteMeasureOwl} from "@web_widget_remote_measure/remote_measure/remote_measure.esm";
console.log('DEBERIA SER EL 2-2')


export class AutoMeasureWidget extends RemoteMeasureOwl {
    setup() {
        super.setup();
        this.value = 0;
        this.rpc = this.env.services.rpc;
        this.orm = useService("orm");
    }

    get circleColor() {
        // Si el valor es mayor que 0, rojo; si es 0 o menor, verde.
        return this.value > 0 ? 'red' : 'green';
    }

    async loadRemoteDeviceData() {
        // Llamamos al método original para cargar los datos del dispositivo remoto
        await super.loadRemoteDeviceData();
        console.log("**** loadRemoteDeviceData() ****");
        this._connect_to_websockets2();  // Conectamos automáticamente el socket al cargar los datos
    }

    _connect_to_websockets2() {
        console.log("**** _connect_to_websockets2() ****");
        try {
            this.socket = new WebSocket(this.host);  // Conectamos al host
        } catch (error) {
            if (error.code === 18) {
                return;  // Error de permisos en algunos navegadores
            }
            throw error;
        }

        var stream_success_counter = 10;  // Contador de estabilidad

        this.socket.onmessage = async (msg) => {
            console.log("**** onmessage() (desde _connect_to_websockets2) ****");
            console.log("stream_success_counter: ", stream_success_counter);
            const data = await msg.data.text();

            // Procesar el mensaje según el protocolo definido (por ejemplo: _proccess_msg_f501)
            const processedData = this[`_proccess_msg_${this.protocol}`](data);
            console.log("processedData: ", processedData);

            if (!processedData.stable) {
                stream_success_counter = 5;  // Reinicia el contador si no es estable
            }

            // Si los datos son estables y el contador es cero, llamamos a _stableMeasure
            if (processedData.stable && !stream_success_counter) {
                this._stableMeasure();  // Almacenamos el valor estable, pero no cerramos el socket
                this._awaitingMeasure();  // Ponemos el widget en modo "espera"
                this._recordMeasure(processedData.value);  // Registramos la medida
                console.log("**** Datos estables procesados, pero el socket sigue abierto ****");
                return;
            }

            // Si los datos no son estables, llamamos a _unstableMeasure
            this._unstableMeasure();

            // Decrementamos el contador
            if (stream_success_counter) {
                --stream_success_counter;
            }

            // Actualizamos el icono y la medida
            this.state.icon = this._nextStateIcon(this.state.icon);
            this.amount = processedData.value;
            this._setMeasure();  // Establecemos la nueva medida
            this._recordMeasure(processedData.value);  // Registramos la medida actual
        };

        this.socket.onerror = () => {
            // Manejo del error del socket
            this._awaitingMeasure();
            console.error('WebSocket error');
            this.notification.add(
                this.env._t("Could not connect to WebSocket"),
                {
                    type: "danger",
                }
            );
        };
    }

    async _stableMeasure() {
        super._stableMeasure();  // Llamamos a la lógica base para manejar la estabilidad
        
        // Comprobamos si el valor estable actual es mayor que 0 y el valor anterior era 0
        if (this.state.isStable) {
            let oldValue = this.value;
            this.value = this.amount;  // Actualizamos el valor

            if (oldValue === 0 && this.amount > 0){

                
                // Llamamos a doAction para abrir la vista del wizard
                const action = {
                    type: 'ir.actions.act_window',
                    res_model: 'weighing.wizard',  // Nombre del modelo del wizard
                    views: [[false, 'form']],  // Vista de formulario
                    target: 'new',  // Abrir en una nueva ventana modal
                    context: {
                        active_id: 10,  // Pasamos el ID 10 al wizard como active_id
                    }
                };
                
                // Llamada a doAction, capturando el resultado
                await this.env.services.action.doAction(action);
                debugger;
                
            }

        // Procesamos el resultado de la acción
        // if (result && result.res_model === 'weighing.wizard') {
        //     console.log("Wizard cerrado, procesamos el resultado:", result);
        // }



        // this.orm.call(
        //     "weighing.wizard",
        //     "record_weight",
        //     [1],  // Le pasamos el ID o los argumentos necesarios
        //     {context: this.context}
        // );

        }
    
        // Actualizamos el valor del campo independientemente del valor
        this.props.update(this.amount);
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
// AutoMeasureWidget.additionalClasses = ["weight_wizard"];
// AutoMeasureWidget.components = { Dialog };

registry.category("fields").add("auto_measure", AutoMeasureWidget);