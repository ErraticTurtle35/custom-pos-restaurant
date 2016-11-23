odoo.define('custom_pos_restaurant.floors', function(require){
    var models = require('point_of_sale.models');
    var floors= require('pos_restaurant.floors');
    var chrome = require('point_of_sale.chrome');

    models.load_models({
        model: 'restaurant.table',
        fields: ['name','width','height','position_h','position_v','shape','floor_id','color','seats',
            'default_product_id', 'additional_product_id', 'wait_time'],
        loaded: function(self,tables){
            console.log('loaded new fields, baby!');
            self.tables_by_id = {};
            for (var i = 0; i < tables.length; i++) {
                self.tables_by_id[tables[i].id] = tables[i];
                var floor = self.floors_by_id[tables[i].floor_id[0]];
                if (floor) {
                    floor.tables.push(tables[i]);
                    tables[i].floor = floor;
                }
            }
        }
    });

    var _super_posmodel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        // Overwritten methods
        set_table: function(table) {
            if (!table) { // no table ? go back to the floor plan, see ScreenSelector
                this.set_order(null);
            } else {     // table ? load the associated orders  ...
                this.table = table;
                var orders = this.get_order_list();
                if (orders.length) {
                    this.set_order(orders[0]); // and go to the first one ...
                } else {
                    this.add_new_order();  // or create a new order with the current table
                    this.add_default_product_to_current_order();
                    this.change_color_of_table();
                }
            }
        },
        change_color_of_table: function(){
            var order = this.get_order();
            var table = order.table;
            if (order.get_orderlines().length > 0){
                table.color = "rgb(235, 109, 109)"; // Fixme: local change doesn't save in the database
            } else {
                table.color = "rgb(130, 233, 171)";
            }

        },
        add_new_order: function () {
            _super_posmodel.add_new_order.call(this);
            this.add_default_product_to_current_order();
            console.log('add_new_order, baby!')
        },
        // New methods
        add_default_product_to_current_order: function(){
            var default_product_id = this.get_default_product_id_for_table();
            if (default_product_id){
                var default_product = this.db.get_product_by_id(default_product_id);
                var order = this.get_order();
                order.add_product(default_product);
            }
            console.log('add_default_product_to_current_order, baby!', default_product);
        },
        get_default_product_id_for_table: function(){
            var table = this.get_order().table;
            var defaultProductId = table.default_product_id;
            if (defaultProductId){
                return defaultProductId[0];
            }
            return false;
        }
    });

    floors.TableWidget = floors.TableWidget.include({
        set_table_color: function(color){
            if(color=== "rgb(235, 109, 109)"){ // It is not allowed to change color to red
                console.log('set_table_color, nup baby!');
            } else {
                this.table.color = _.escape(color);
                this.$el.css({'background': this.table.color});
                console.log('set_table_color, baby');
            }
        }
    });

    chrome.OrderSelectorWidget.include({
        floor_button_click_handler: function(){
            this.change_color_of_table();
            this.pos.set_table(null);
            console.log('floor_button_click_handler, baby!')
        },
        change_color_of_table: function(){
            var order = this.pos.get_order();
            var orderlines = order.get_orderlines();
            var table = order.table;
            if(orderlines.length > 0){
                table.color = "rgb(235, 109, 109)";
            }else {
                table.color = "rgb(130, 233, 171)";
            }
        }
    });
});
