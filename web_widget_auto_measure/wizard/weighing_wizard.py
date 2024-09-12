# Copyright 2024 Tecnativa - Sergio Teruel
# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl)
from odoo import fields, models


class WeighingWizard(models.TransientModel):
    _inherit = "weighing.wizard"

    set_auto_weighing = fields.Boolean(string="Automathic Weighing")

    def default_get(self, fields):
        res = super(WeighingWizard, self).default_get(fields)
        move_id = self.env.context.get("active_id")
        if move_id:
            move = self.env["stock.move"].browse(move_id)
            res["set_auto_weighing"] = move.mode_auto_weighing
        return res

    def _post_add_detailed_operation(self):
        res = super(WeighingWizard, self)._post_add_detailed_operation()
        self.move_id.mode_auto_weighing = self.set_auto_weighing
        return res
