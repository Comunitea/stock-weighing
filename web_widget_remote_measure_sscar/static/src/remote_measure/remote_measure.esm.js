/** @odoo-module **/
import {RemoteMeasureOwl} from "@web_widget_remote_measure/remote_measure/remote_measure.esm";
import {patch} from "@web/core/utils/patch";

patch(RemoteMeasureOwl.prototype, "RemoteMeasureOwl_add_SSCAR", {
    setup() {
        this._super(...arguments);
    },
    /**
     * SSCAR Protocol response parser: +0020940\r or 01: +0020940\r
     * [ID:][status/sign][weight]
     * - ID: 2 characters (optional)
     * - status/sign: 1 character + | -
     * - weight: 7 digits with 1 decimal
     * @param {String} msg ASCII string
     * @returns {Object} with the ID (if present), status/sign, and weight
    */
    _proccess_msg_sscar(msg) {
        console.log("**** _proccess_msg_sscar() ****", msg);
        debugger;
        const noIDPattern = /^([+-])\s*(\d+(\.\d{1,3})?)\r$/;
        const withIDPattern = /^(\d{2}):\s*([+-])\s*(\d+(\.\d{1,3})?)\r$/;

        let result = {};

        // Check for message without ID
        let match = noIDPattern.exec(msg);
        if (match) {
            const sign = match[1];
            const weight = match[2];
            result = {
                stable: sign !== '-',
                value: parseFloat(weight)
            };
        } else {
            // Check for message with ID
            match = withIDPattern.exec(msg);
            if (match) {
                const id = match[1];
                const sign = match[2];
                const weight = match[3];
                result = {
                    id: id,
                    stable: sign !== '-',
                    value: parseFloat(weight)
                };
            }
        }

        return result;
    },

    // TODO: Put this in form widget. Load orderd of assets is not controlled
    _onClickButtonSscar(ev){
        console.log("**** PATCHEEED BUTTONS() ****");
        ev.preventDefault();
        const button_name = ev.currentTarget.dataset.name;
        if (button_name) {
            this.sendSscarCommand(button_name);
        }
    },
    sendSscarCommand(button_name) {
        debugger;
        console.log("**** patched sendSscarCommand() ****", button_name);
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