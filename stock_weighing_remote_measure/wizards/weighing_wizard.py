# Copyright 2024 Tecnativa - David Vidal
# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl.html).
from odoo import api, fields, models


class WeighingWizard(models.TransientModel):
    _inherit = "weighing.wizard"

    measure_device_id = fields.Many2one(
        comodel_name="remote.measure.device",
        default=lambda self: self.env.user.remote_measure_device_id,
        readonly=True,
    )
    uom_id = fields.Many2one(comodel_name="uom.uom", compute="_compute_uom_id")

    @api.depends("product_id", "selected_move_line_id")
    def _compute_uom_id(self):
        for wiz in self:
            wiz.uom_id = (
                wiz.product_id.uom_id or wiz.selected_move_line_id.product_uom_id
            )
