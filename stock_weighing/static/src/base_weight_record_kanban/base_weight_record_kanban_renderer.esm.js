/** @odoo-module **/
import { KanbanRenderer } from '@web/views/kanban/kanban_renderer';

// export const WeightRecordingKanbanRenderer = KanbanRenderer.extend({
//     config: _.extend({}, KanbanRenderer.prototype.config, {
//         KanbanColumn: WeightRecordingKanbanColumn,
//     }),
// });
export class WeightRecordingKanbanRenderer extends KanbanRenderer {
    setup() {
        super.setup();
        debugger;
    }
    groupPrintLabels(group) {
        debugger;
    }
}
WeightRecordingKanbanRenderer.template = "stock_weighing.WeightRecordingKanbanRenderer";

