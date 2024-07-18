/** @odoo-module **/
import Widget from "web.Widget";
import widgetRegistry from "web.widget_registry";

const RemoteMeasureDeviceStatusWidget = Widget.extend({
    template: "web_widget_remote_measure.measure_device_status",
    xmlDependencies: [
        "/web_widget_remote_measure/static/src/xml/measure_device_status.xml",
    ],
    init(_parent, _data, options) {
        this._super(...arguments);
        this.className = "text-muted";
        this.title = "Requesting status...";
        this.host = options.attrs.host;
    },
    async willStart() {
        await this._super(...arguments);
        const socket = new WebSocket(this.host);
        socket.onerror = async () => {
            this.className = "text-danger";
            this.title = "Device is down";
            this.renderElement();
        };
        socket.onmessage = async () => {
            socket.close();
            this.className = "text-success";
            this.title = "Device ready";
            this.renderElement();
        };
    },
});

widgetRegistry.add("remote_measure_device_status", RemoteMeasureDeviceStatusWidget);

// import { Component, useState, onWillStart } from "@odoo/owl";
// import { registry } from "@web/core/registry";

// class RemoteMeasureDeviceStatusWidget extends Component {
//     setup() {
//         this.state = useState({
//             className: "text-muted",
//             title: "Requesting status...",
//         });
//         this.host = this.props.host;

//         onWillStart(async () => {
//             const socket = new WebSocket(this.host);
//             socket.onerror = () => {
//                 this.state.className = "text-danger";
//                 this.state.title = "Device is down";
//             };
//             socket.onmessage = () => {
//                 socket.close();
//                 this.state.className = "text-success";
//                 this.state.title = "Device ready";
//             };
//         });
//     }

//     static template = "web_widget_remote_measure.measure_device_status";
// }

// registry.category("view_widgets").add("remote_measure_device_status", RemoteMeasureDeviceStatusWidget);