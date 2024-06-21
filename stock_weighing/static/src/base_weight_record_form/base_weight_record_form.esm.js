/** @odoo-module **/
/* Copyright 2024 Tecnativa - David Vidal
 * License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl). */
import {ControlPanel} from "@web/search/control_panel/control_panel";
import {formView} from "@web/views/form/form_view";
import {registry} from "@web/core/registry";

export class WeightRecordingFormControlPanel extends ControlPanel {}
WeightRecordingFormControlPanel.template = "WeightRecording.DetailControlPanel";
WeightRecordingFormControlPanel.components = {...ControlPanel.components};


export const WeightRecordingFormView = {
    ...formView,
    ControlPanel: WeightRecordingFormControlPanel,
};

registry.category("views").add("base_weight_record_form", WeightRecordingFormView);

