/** @odoo-module **/
import {patch} from "@web/core/utils/patch";
import {registry} from "@web/core/registry";
import {RemoteMeasureFormOwl} from "@stock_weighing_remote_measure/remote_measure_form/remote_measure_form.esm";
console.log('DEBERIA SER EL 3')


patch(RemoteMeasureFormOwl.prototype, "RemoteMeasureFormOwl_BUTTONS", {
    setup(){
        this._super();
        this.pendingCommand = null;
    },
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
        this.pendingCommand = button_command;
        if (!this.measureService.isConnected()) {
            this.measureService.connect(this.host,this.connection_mode, this.protocol);
            this.measureService.bus.on("conected", this, this._onConnected);
        }
    },
    _onConnected(){
        if (this.pendingCommand) {
            this.measureService.sendCommand(this.pendingCommand);  // Enviar el comando pendiente
            this.pendingCommand = null;  // Limpiar la variable del comando pendiente
            this.measureService.bus.off("conected", this, this._onConnected); 
            this.measureService.disconnect() // Desuscribirse del evento
        }
    },
});
