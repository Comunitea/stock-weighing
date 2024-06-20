/** @odoo-module **/
import { kanbanView } from '@web/views/kanban/kanban_view';
import { WeightRecordingKanbanRenderer } from './base_weight_record_kanban_renderer.esm.js';
import { registry } from '@web/core/registry';


export const WeightRecordingKanbanView = {
    ...kanbanView,
    Renderer: WeightRecordingKanbanRenderer,
}

registry.category("views").add(
    "base_weight_record_kanban", WeightRecordingKanbanView);
