/** @odoo-module **/
import {RemoteMeasureOwl} from "@web_widget_remote_measure/remote_measure/remote_measure.esm";
import {MeasureReader} from "@web_widget_remote_measure/remote_measure/remote_measure_service.esm";
import {patch} from "@web/core/utils/patch";


// pATCHING MeasureReader Service to add a method thar process sscar protocol.
patch(MeasureReader.prototype,"MeasureReader_add_SSCAR", {
    _proccess_msg_sscar(msg) {
        const noIDPattern = /^([+-])\s*(\d+(\.\d{1,3})?)\r$/;
        const withIDPattern = /^(\d{2}):\s*([+-])\s*(\d+(\.\d{1,3})?)\r$/;

        let result = {};

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
                    stable: sign !== '-',
                    value: parseFloat(weight)
                };
            }
        }

        return result;
    },
    // Método para enviar comandos SSCAR a través del WebSocket existente
    sendCommand(command) {
        debugger;
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