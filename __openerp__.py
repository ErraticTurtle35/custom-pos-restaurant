# -*- coding: utf-8 -*-
{
    'name': 'Custom POS Restaurant',
    'version': '1.0',
    'category': 'Point of Sale',
    'sequence': 6,
    'summary': 'Restaurant extensions for the Point of Sale ',
    'depends': ['point_of_sale', 'pos_restaurant'],
    'data': [
        'data/pos_data.xml',
        'views/restaurant_table.xml',
    ],
    'qweb': [
        'static/src/xml/pos.xml',
    ],
    'installable': True,
    'auto_install': False,
}
