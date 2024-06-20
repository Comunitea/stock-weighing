/** @odoo-module **/
import { KanbanRenderer } from '@web/views/kanban/kanban_renderer';

export class WeightRecordingKanbanRenderer extends KanbanRenderer {
    showWeighingPrintButton(group) {
        return group.records.some((move) => {
            return move.data.show_weighing_print_button;
        });
    }
    groupPrintLabels(group) {
        const moves = group.list.records.filter((move) => {
            return move.data.show_weighing_print_button;
        });
        return group.model.orm.call(
            "stock.move", 
            "action_print_weight_record_label", 
            [moves.map((r) => r.resId)]);

    }
}
WeightRecordingKanbanRenderer.template = "stock_weighing.WeightRecordingKanbanRenderer";

