/** @odoo-module **/
// import {RemoteMeasureFormOwl} from "@stock_weighing_remote_measure/remote_measure_form/remote_measure_form.esm";
import {patch} from "@web/core/utils/patch";
import {registry} from "@web/core/registry";


debugger;
// TODO: Imposible to me to control de load order of assets.
// const RemoteMeasureFormOwl = registry.category("fields").get("remote_measure_form");


// patch(RemoteMeasureFormOwl.prototype, "RemoteMeasureFormOwl_BUTTONS", {
//      _onClickButtonSscar(ev){
//         console.log("**** POR FIN JODER PATCHEEED BUTTONS() ****");
//         ev.preventDefault();
//         const button_name = parseFloat(ev.currentTarget.dataset.button);
//         if (button_name == 'x') {
//             this.sendSscarCommand(button_name);
//         }
//     },
//     sendSscarCommand(button_name) {
//         console.log("**** por fin joder patched sendSscarCommand() ****", button_name);
//     }
// });
