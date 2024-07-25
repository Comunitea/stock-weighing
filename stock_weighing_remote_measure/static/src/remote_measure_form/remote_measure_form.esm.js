/** @odoo-module **/
import {registry} from "@web/core/registry";
import { FloatField } from "@web/views/fields/float/float_field";
const {useState } = owl;


// import {RemoteMeasureOwl} from "@web_widget_remote_measure/remote_measure/remote_measure";
const RemoteMeasureOwl = registry.category("fields").get("remote_measure");


class RemoteMeasureFormOwl extends RemoteMeasureOwl {
    setup() {
        super.setup();
        this.tares = this.props.tares;
        this.tare = 0;
        // this.amount = 0;
        this.number_format_options = {
            minimumFractionDigits: 3,
            useGrouping: false,
        };
        this.state = useState({
            ...this.state,
            tare: 0,
            real_amount: 0,
            manual_tare: 0
        });
    }
    // get remoteMeasureProps() {
    //     const {tares, inputType, ...result} = this.props;
    //     return result;
    // }

    /**
     * Number formatting helper
     * @param {Number} weight
     * @returns {String}
     */
    format_weight(weight) {
        return weight.toLocaleString(this.locale_code, this.number_format_options);
    }

    /**
     * Add the tare to the real weighted measure
     * @override
     */
    //  async _setMeasure() {
    //     debugger;
    //     await this._super(...arguments);
    //     // let total = this.widget_amount;
    //     // this.$input.val(this.format_weight(total));
    //     // if (this.tare) {
    //     //     total = this.widget_amount - this.tare;
    //     //     this.$real_amount.text(this.widget_amount);
    //     //     this.$input.val(this.format_weight(total));
    //     //     this._setValue(this.$input.val());
    //     // }
    // }

    // updateField(val) {
    //     return Promise.resolve(this.props.update(val));
    // }

    /**
     * Add the tare to the real weighted measure
     * @override
     */
    async _setMeasure(amount) {
        if (isNaN(amount)) {
            return;
        }
        this.state.real_amount = this.format_weight(amount);
        let total = amount;
        if (this.tare) {
            total = amount - this.tare;
            // this.$real_amount.text(this.amount);
            // this.$input.val(this.format_weight(total));
            // this._setValue(this.$input.val());
        }
        this.amount = this._compute_quantity(total);
        // this.amount = this.format_weight(total)
        // if (this.start_add) {
        //     this.amount += this.props.val;
        // }
        // this.$input.val(this.amount.toLocaleString(this.locale_code));

        // this._setValue(this.$input.val());
        // this.props.update(this.amount);
        debugger;
        this.props.update(this.amount);
    }


    /* TARE METHODS */

    _updateTare(tare) {
        // this.$tare_amount.text(this.format_weight(this.tare));
        // this.$real_amount.text(this.format_weight(this.amount));
        debugger;
        this.tare += tare
        this.state.tare = this.format_weight(this.tare);
        // this._setMeasure(this.amount);
        this._setMeasure(this.props.value);
    }

    /**
     * Add the tare to the total weight
     * @param {Event} ev
     */
    _onClickTare(ev) {
        ev.preventDefault();
        const tare = parseFloat(ev.currentTarget.dataset.tare);
        this._updateTare(tare);
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
// RemoteMeasureFormOwl.components = { RemoteMeasureOwl };

registry.category("fields").add("remote_measure_form", RemoteMeasureFormOwl);