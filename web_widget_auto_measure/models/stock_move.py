# Copyright 2023 Tecnativa - David Vidal
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
from odoo import fields, models, api
from odoo.tools.misc import clean_context


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
            selected_line.qty_done = self.weight
            selected_line.recorded_weight = self.weight
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

