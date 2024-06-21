# Copyright 2024 Tecnativa - David Vidal
# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl.html).
from odoo import fields, models


class StockMoveLine(models.Model):
    _inherit = "stock.move.line"

    has_recorded_weight = fields.Boolean(help="The weight was set from the wizard")
    recorded_weight = fields.Float(digits="Product Unit of Measure")
    weighing_user_id = fields.Many2one(comodel_name="res.users")
    weighing_date = fields.Datetime()

    def _get_action_weighing_name(self):
        """Add secondary unit info"""
        action_name = super()._get_action_weighing_name()
        if self.secondary_uom_id:
            extra_info = (
                f"[{self.secondary_uom_id.display_name} - {self.secondary_uom_qty}]"
            )
            action_name = f"{action_name} {extra_info}"
        return action_name
