/** @odoo-module **/

debugger;
import {registry} from "@web/core/registry";
import { FloatField } from "@web/views/fields/float/float_field";

// import {RemoteMeasureOwl} from "@web_widget_remote_measure/remote_measure/remote_measure";
const RemoteMeasureOwl = registry.category("fields").get("remote_measure");


class RemoteMeasureFormOwl extends RemoteMeasureOwl {
    setup() {
        debugger;
        super.setup();
    }
}
RemoteMeasureFormOwl.template = "stock_weighing_remote_measure.RemoteMeasureFormOwl";
RemoteMeasureFormOwl.props = {
    ...RemoteMeasureOwl.props,
    tares: { type: Object, optional: true },
};
RemoteMeasureFormOwl.extractProps = ({ attrs }) => {
    return {
        remote_device_field: attrs.options.remote_device_field,
        uom_field: attrs.options.uom_field,
        tares: attrs.options.tares,
    };
};
debugger;
registry.category("fields").add("remote_measure_form", RemoteMeasureFormOwl);