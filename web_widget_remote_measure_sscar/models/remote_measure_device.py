# Copyright 2024 Comunitea - Javier Colmenero
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
from odoo import fields, models


class RemoteMeasureDevice(models.Model):
    _inherit = "remote.measure.device"

    protocol = fields.Selection(
        selection_add=[
            ("sscar", "SSCAR"),
        ],
        ondelete={"sscar": "cascade"},
    )
