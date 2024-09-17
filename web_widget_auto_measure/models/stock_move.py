# Copyright 2023 Tecnativa - David Vidal
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
from odoo import fields, models, api, _
from odoo.tools.misc import clean_context
import ast

class StockMove(models.Model):
    _inherit = "stock.move"

    mode_auto_weighing = fields.Boolean('Auto weighing mode', default=False)
    auto_weight = fields.Float('Auto weight')

    @api.model
    def set_auto_weight(self, move_id, weight):
        move = self.browse(move_id)
        vals =move._prepare_move_line_vals(quantity=self.weight)
        # Avoid filling the reserved quantities
        vals.pop("reserved_uom_qty", None)
        # if self.lot_id:
        #     vals["lot_id"] = self.lot_id.id
        # self._check_lot_creation()
        selected_line = (
            self.env["stock.move.line"]
            .with_context(**clean_context(self.env.context))
            .create(vals)
        )
        if weight:
            selected_line.qty_done = weight
            selected_line.recorded_weight = weight
            selected_line.has_recorded_weight = True
            selected_line.weighing_user_id = self.env.user
            selected_line.weighing_date = fields.Datetime.now()
        # Reset value
        else:
            selected_line.qty_done = 0
            selected_line.recorded_weight = 0
            selected_line.has_recorded_weight = False
            selected_line.weighing_user_id = False
            selected_line.weighing_date = False
        # Unlock the operation
        selected_line.move_id.action_unlock_weigh_operation()
        # action = selected_line.action_print_weight_record_label()
        # action["close_on_report_download"] = True
        # return action
    
    def action_weight_detailed_operations(self):
        """Weight detailed operations for this picking"""
        action = super().action_weight_detailed_operations()
        if self.mode_auto_weighing:
            action = self.env["ir.actions.actions"]._for_xml_id(
            "web_widget_auto_measure.weighing_operation_action_auto"
        )
            action["name"] = _("Detailed operations for %(name)s", name=self.name)
            action["domain"] = [("id", "=", self.id)]
            action["view_mode"] = "form"
            action["res_id"] = self.id
            action["views"] = [
                (view, mode) for view, mode in action["views"] if mode == "form"
            ]
            action["context"] = dict(
                self.env.context,
                **ast.literal_eval(action["context"]),
                weight_operation_details=True
            )
            return action
        return action


