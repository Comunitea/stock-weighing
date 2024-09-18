# Copyright 2024 Comunitea - Javier Colmenero Fernández
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
{
    "name": "Web Widget auto mesure",
    "summary": "Allows to automatic create stock move lines in wheighig view when a change in measure from zero is taken",
    "version": "16.0.1.0.0",
    "author": "Comunitea, Odoo Community Association (OCA)",
    "website": "https://github.com/OCA/stock-weighing",
    "maintainers": ["javierjcf"],
    "license": "AGPL-3",
    "category": "Stock",
    "depends": ["stock_weighing_remote_measure"],
    "data": [
        "views/stock_move_views.xml",
        "wizard/weighing_wizard_views.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "web_widget_auto_measure/static/src/**/*.esm.js",
            "web_widget_auto_measure/static/src/**/*.scss",
            "web_widget_auto_measure/static/src/**/*.xml"
        ],
    },
}
