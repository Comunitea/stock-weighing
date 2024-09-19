/** @odoo-module **/

import {ControlPanel} from "@web/search/control_panel/control_panel";
import {formView} from "@web/views/form/form_view";
import { useService } from "@web/core/utils/hooks";
import {registry} from "@web/core/registry";
import { session } from "@web/session";

const {
    onWillStart,
    onWillRender,
    onRendered,
    onWillUpdateProps,
    onWillPatch,
    onError,
    onMounted, onWillUnmount, onWillDestroy, useState } = owl;




export class AutoMeasureFormControlPanel extends ControlPanel {
    setup(){
        console.log("---------SEtup---------------")
        super.setup();
        this.actionService = useService("action");
        this.measureService = useService("measureReader");
        this.orm = useService("orm");
        const { active_id } = this.env.searchModel.globalContext;
        this.moveId = active_id;
        this.remote_device_data = {}
        this.listen = false;
        this.oldValue = 0.00;
        this.uom_display_name = "--"
        this.isMeasureStable = false;
        this.initializing = true;
        this.weighing_statuses = {
            initializing : 'Initializing',
            free:"Free",
            stable : "Weighed",
            unstable: "Weighing",
            disconnected: "Disconnected",
        };
        this.state = useState({
            measure_amount: 0,  
            weighing_status: this.weighing_statuses.initializing,
        });
        
        onWillStart(async () => {
            console.log("onWillStart");
            await this.loadRemoteDeviceData();
        })
        onWillRender(() => {
            console.log("onWillRender");
        });
        onRendered(() => {
            console.log("onRendered");
        })
        onMounted(() => {
            this.enableMeasureListeners();
        })
        onWillUpdateProps(() => {
            console.log("onwillUpdateProps");
        })
        onWillPatch(() => {
            console.log("onWillPAtch");
        })
        onWillUnmount(() => {
            console.log("onWillUnmount");
            this.disableMeasureListeners();
        })
        onWillDestroy(() => {

            console.log("onWillDestroy");
        })
        onError(() => {
            console.log("onError");
        })

    }
    get circleColor() {
        // Si el valor es mayor que 0, rojo; si es 0 o menor, verde.
        return this.state.measure_amount > 0 ? 'red' : 'green';
    }

    enableMeasureListeners(){
        if (!this.measureService.isConnected()) {
            
            console.info("Conectando........................")
            this.measureService.connect(this.host, this.connection_mode, this.protocol);
            console.log("Is connected: ", this.measureService.isConnected());    
        }
        if (this.measureService.isConnected() && !this.listen) {
            this.measureService.bus.on("stableMeasure", this, this.onStableMeasure);
            this.measureService.bus.on("unstableMeasure", this, this.onUnstableMeasure);
            this.listen = true;
        }
    }

    disableMeasureListeners(){
        this.measureService.bus.off("stableMeasure", this, this.onStableMeasure);
        this.measureService.bus.off("unstableMeasure", this, this.onUnstableMeasure);
        this.measureService.disconnect();
        this.listen = false;
    }

    async reloadView() {
        // Reload the view, but it will enter on sillstart and last willUnmount
        // this.actionService.doAction({
        //     type: 'ir.actions.client',
        //     tag: 'soft_reload',
        // });
            
        // Better update of the view without reloading this component
        const pagerProps = this.pagerProps;
        const {limit, offset} = pagerProps;
        await pagerProps.onUpdate({offset, limit});
    }

    async loadRemoteDeviceData(){
        console.log("loadRemoteDeviceData");
        const [userData] = await this.orm.read(
            "res.users", [session.uid], ["remote_measure_device_id"]);
        this.remote_device_data = userData;
        const deviceId = userData.remote_measure_device_id[0];
        const [deviceData] = await this.orm.read("remote.measure.device", [deviceId], []);   
        const [uomData] = await this.orm.read("uom.uom", [deviceData.uom_id[0]], []);
        this.remote_device_data = deviceData;
        this.host = this.remote_device_data && this.remote_device_data.host;
        this.protocol = this.remote_device_data && this.remote_device_data.protocol;
        this.connection_mode =
        this.remote_device_data && this.remote_device_data.connection_mode;
        this.uom_display_name = uomData.display_name
    }

    onStableMeasure(value) {
        console.log("-------- onStableMeasure() ------------, Value: ", value);
        this.state.measure_amount = value;
        this.state.weighing_status = this.weighing_statuses.stable;
        let oldValue = this.oldValue;

        console.log("oldValue: ", oldValue , "value: ", value);



        if (!this.initializing && value == 0) {
            this.state.weighing_status = this.weighing_statuses.free;
        }

        if (!this.initializing && oldValue === 0 && value > 0) {
            this.doAutoOperation();
            
        }

        if (this.initializing) {
            // this.state.weighing_status = this.weighing_statuses.initializing;
            this.initializing = false;
        }

        this.oldValue = value;
    }
    onUnstableMeasure(value) {
        console.log("### onUnstableMeasure() ###: ", value);
        this.state.weighing_status = this.weighing_statuses.unstable;
        this.state.measure_amount = value;

    }
    async doAutoOperation() {
        let move_id = this.moveId
        console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!Creo operación!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        await this.orm.call("stock.move", "set_auto_weight", [move_id, this.state.measure_amount]);
        await this.reloadView();
    }
}
AutoMeasureFormControlPanel.template = "AutoMeasure.DetailControlPanel";
AutoMeasureFormControlPanel.components = {...ControlPanel.components};


export const AutoMeasureFormView = {
    ...formView,
    ControlPanel: AutoMeasureFormControlPanel,
};

registry.category("views").add("auto_measure_form", AutoMeasureFormView);

