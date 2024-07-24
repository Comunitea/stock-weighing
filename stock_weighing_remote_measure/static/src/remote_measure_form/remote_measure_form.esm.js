/** @odoo-module **/
import {registry} from "@web/core/registry";
import { FloatField } from "@web/views/fields/float/float_field";

// import {RemoteMeasureOwl} from "@web_widget_remote_measure/remote_measure/remote_measure";
const RemoteMeasureOwl = registry.category("fields").get("remote_measure");


class RemoteMeasureFormOwl extends RemoteMeasureOwl {
    setup() {
        super.setup();
        this.tares = this.props.tares;
        this.tare = 0;
        this.widget_amout = 69;
        this.number_format_options = {
            minimumFractionDigits: 3,
            useGrouping: false,
        };
    }
    get remoteMeasureProps() {
        const {tares, inputType, ...result} = this.props;
        return result;
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
RemoteMeasureFormOwl.additionalClasses = ["weight_wizard"];
RemoteMeasureFormOwl.components = { RemoteMeasureOwl };

registry.category("fields").add("remote_measure_form", RemoteMeasureFormOwl);