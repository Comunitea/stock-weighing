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
    // _process_msg_sscar(msg) {
    //     // Regex patterns for parsing
    //     const noIDPattern = /^([+-])(\d{7}\.\d{1})\r$/;
    //     const withIDPattern = /^(\d{2}): ([+-])(\d{7}\.\d{1})\r$/;

    //     let result = {};
        
    //     try {
    //         // Check for message without ID
    //         let match = noIDPattern.exec(msg);
    //         if (match) {
    //             result = {
    //                 stable: match[1] !== '-',
    //                 value: match[2]
    //             };
    //         } else {
    //             // Check for message with ID
    //             match = withIDPattern.exec(msg);
    //             if (match) {
    //                 result = {
    //                     id: match[1],
    //                     stable: match[2] !== '-',
    //                     value: match[3]
    //                 };
    //             } else {
    //                 // If neither pattern matches, return empty object
    //                 return {};
    //             }
    //         }
    //     } catch {
    //         // Handle any errors by returning an empty object
    //         return {};
    //     }
        
    //     return result;
    // },

    // /**
    //  * Sends a tare command message.
    //  * @param {String} id - Optional ID of the display device.
    //  * @returns {String} Command message to be sent
    //  */
    // sendTareCommand(id) {
    //     // Ensure command message format with or without ID
    //     if (id) {
    //         return `S ${id} T\r`;  // For addressable displays with ID
    //     } else {
    //         return `S T\r`;       // For non-addressable displays without ID
    //     }
    // },

    _proccess_msg_sscar(msg) {
        console.log("****FAKING FSR53: _proccess_msg_SSCAR() ****");
        return {
            stable: msg[1] === "\x20",
            value: parseFloat(msg.slice(2, 10)),
        };
    }
});
