/** @odoo-module **/
import {patch} from "@web/core/utils/patch";
import {registry} from "@web/core/registry";
import {RemoteMeasureFormOwl} from "@stock_weighing_remote_measure/remote_measure_form/remote_measure_form.esm";
console.log('DEBERIA SER EL 3')


patch(RemoteMeasureFormOwl.prototype, "RemoteMeasureFormOwl_BUTTONS", {
     // TODO: Put this in form widget. Load orderd of assets is not controlled
     _onClickButtonSscar(ev){
        console.log("**** uu PATCHEEED BUTTONS() ****");
        ev.preventDefault();
        const button_name = ev.currentTarget.dataset.name;
        if (button_name) {
            this.sendSscarCommand(button_name);
        }
    },
    sendSscarCommand(button_name) {
        console.log("**** uu patched sendSscarCommand() ****", button_name);
        let button_command = '';
        if (button_name === 'X') {
            button_command = 'D';
        } else if (button_name === 'T') {
            button_command = 'T';
        } else if (button_name === 'Z') {
            button_command = 'C';
        }
        try {
            // Inicializa la conexión WebSocket
            this.socket = new WebSocket(this.host);
    
            // Define qué hacer cuando la conexión WebSocket se abra
            this.socket.onopen = () => {
                console.log('WebSocket connection opened.');
    
                // Formatea el comando con el texto del botón y un retorno de carro
                const command = `${button_command}\r`;
    
                // Envía el comando al WebSocket
                this.socket.send(command);
                console.log(`Sent command: ${command}`);
            };
    
            // Manejo de mensajes recibidos desde el WebSocket (opcional)
            this.socket.onmessage = (event) => {
                console.log('Message received from server:', event.data);
            };
    
            // Manejo del cierre de la conexión WebSocket (opcional)
            this.socket.onclose = (event) => {
                console.log('WebSocket connection closed:', event);
            };
    
            // Manejo de errores en la conexión WebSocket (opcional)
            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
    
        } catch (error) {
            // Manejo de errores en la conexión WebSocket
            if (error.code === 18) {
                return;
            }
            throw error;
        }
    }
});
