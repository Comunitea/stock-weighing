/** @odoo-module **/
import {RemoteMeasureOwl} from "@web_widget_remote_measure/remote_measure/remote_measure.esm";
import {MeasureReader} from "@web_widget_remote_measure/remote_measure/remote_measure_service.esm";
import {patch} from "@web/core/utils/patch";


// pATCHING MeasureReader Service to add a method thar process sscar protocol.
patch(MeasureReader.prototype,"MeasureReader_add_SSCAR", {
    constructor(env, notification) {
        this._super(env, notification);
        this.last_weight = 0;
    },
    _proccess_msg_sscar(msg) {
        /** 
         * Considero estable si lee dos iguales aeguidas.
         * Si lo pongo estable con el signo +, funciona mal el widget auto
         * 
         * En la doc aparece que se permite el peso negativo y este aparecerá incicado por el símbolo '-' precediendo el valor.
         * Luego también se indica que "Si el peso no supera el mínimo permitido o es negativo y OIML se devolvera '      '"
         * Ninguna de las dos premisas anteriores se cumple, en aso de negativo se devuelve '______'.
         * En caso de no poder procesarse el valor devuelto se devolverá un diccionario vacío.
         */
        
        const noIDPattern = /^([+-])\s*(\d+(\.\d{1,3})?)\r$/;
        const withIDPattern = /^(\d{2}):\s*([+-])\s*(\d+(\.\d{1,3})?)\r$/;

        let result = {
            stable:true,
            value: -9.999,
        };

        // Check for message without ID
        let match = noIDPattern.exec(msg);
        if (match) {
            const sign = match[1];
            const weight = match[2];
            const read_weight = parseFloat(weight);
            result = {
                // stable: sign !== '-',
                stable: this.last_weight === read_weight,
                value: read_weight
            };
            this.last_weight = read_weight;
        } else {
            // Check for message with ID
            match = withIDPattern.exec(msg);
            if (match) {
                const id = match[1];
                const sign = match[2];
                const weight = match[3];
                result = {
                    id: id,
                    // stable: sign !== '-',
                    stable: this.last_weight === read_weight,
                    value: parseFloat(weight)
                };
            }
        }

        return result;
    },
    // Método para enviar comandos SSCAR a través del WebSocket existente
    sendCommand(command) {
        if (!this.isConnected()) {
            console.error("WebSocket is not connected.");
            return;
        }

        try {
            // Enviar el comando al WebSocket
            this.socket.send(`${command}\r`);
            console.log(`Sent command: ${command}`);
        } catch (error) {
            console.error("Failed to send command via WebSocket:", error);
        }
    }
})