/** @odoo-module **/
import {RemoteMeasureOwl} from "@web_widget_remote_measure/remote_measure/remote_measure.esm";
import {patch} from "@web/core/utils/patch";
import {registry} from "@web/core/registry";
console.log('DEBERIA SER EL 3 (1)')


patch(RemoteMeasureOwl.prototype, "RemoteMeasureOwl_add_SSCAR", {
    setup() {
        this._super(...arguments);
        this.last_weight = 0;
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
});