# Copyright 2024 Comunitea - Javier Colmenero
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
{
    "name": "Remote SSCAR scales",
    "summary": "Compatibility with UTILCELL propietary protocols",
    "version": "16.0.1.0.0",
    "author": "Tecnativa, Odoo Community Association (OCA)",
    "website": "https://github.com/OCA/stock-weighing",
    "maintainers": ["javierjcf"],
    "license": "AGPL-3",
    "category": "Stock",
    "depends": [
        "stock_weighing_remote_measure",
    ],
    "data": [],
    "assets": {
        "web.assets_backend": [
            'web_widget_remote_measure_sscar/static/src/**/*.esm.js',
            'web_widget_remote_measure_sscar/static/src/**/*.scss',
            'web_widget_remote_measure_sscar/static/src/**/*.xml',
        ],
        # "web.assets_backend": [
            
        #     ('after', 'stock_weighing_remote_measure/static/src/remote_measure_form/remote_measure_form.esm.js', 'web_widget_remote_measure_sscar/static/src/remote_measure/remote_measure_form.esm.js'),
        #     'web_widget_remote_measure_sscar/static/src/**/*.scss',
        #     'web_widget_remote_measure_sscar/static/src/**/*.xml',
        # ],
    },
}
