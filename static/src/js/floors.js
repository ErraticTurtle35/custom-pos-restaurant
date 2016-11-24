odoo.define('custom_pos_restaurant.floors', function(require){
    var models = require('point_of_sale.models');
    var floors= require('pos_restaurant.floors');
    var chrome = require('point_of_sale.chrome');
    var screens = require('point_of_sale.screens');

    models.load_models({
        model: 'restaurant.table',
        fields: ['name','width','height','position_h','position_v','shape','floor_id','color','seats',
            'default_product_id', 'additional_product_id', 'wait_time', 'extra_time'],
        loaded: function(self,tables){
            self.tables_by_id = {};
            for (var i = 0; i < tables.length; i++) {
                self.tables_by_id[tables[i].id] = tables[i];
                var floor = self.floors_by_id[tables[i].floor_id[0]];
                if (floor) {
                    floor.tables.push(tables[i]);
                    tables[i].floor = floor;
                }
            }
            console.log('loaded new fields for restaurant.table, baby!');
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
                    this.change_color_of_table();
                }
            }
        },
        change_color_of_table: function(){
            var order = this.get_order();
            var table = order.table;
            if (order.get_orderlines().length > 0){
                table.color = "rgb(235, 109, 109)"; // Fixme: client side change doesn't storage in the database
            } else {
                table.color = "rgb(130, 233, 171)";
            }

        },
        add_new_order: function () {
            _super_posmodel.add_new_order.call(this);
            this.add_default_product_to_current_order();
        },
        on_removed_order: function(removed_order,index,reason){
            if (this.config.iface_floorplan) {
                var order_list = this.get_order_list();
                if( (reason === 'abandon' || removed_order.temporary) && order_list.length > 0){
                    this.set_order(order_list[index] || order_list[order_list.length -1]);
                }else{
                    var table = this.table;
                    table.color= "rgb(130, 233, 171)";
                    // back to the floor plan
                    this.set_table(null);
                }
            } else {
                _super_posmodel.on_removed_order.apply(this,arguments);
            }
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
            var order = this.get_order(),
                table = order.table;
            var defaultProductId = table.default_product_id;
            if (defaultProductId){
                return defaultProductId[0];
            }
            return false;
        },
        calculate_extra_product: function (minutes_apart) {
            var order = this.get_order(),
                table = order.table,
                wait_time = table.wait_time,
                extra_time = table.extra_time;

            var extra_minutes = Math.abs(minutes_apart - wait_time);
            var extra_product_qty = Math.ceil(extra_minutes / extra_time);
            this.add_extra_product_to_current_order(extra_product_qty);
            console.log('calculate_extra_product, baby!', default_product);
        },
        add_extra_product_to_current_order: function(extra_product_qty){
            var extra_product_id = this.get_extra_product_id_for_table();
            if (extra_product_id){
                var extra_product = this.db.get_product_by_id(extra_product_id);
                var order = this.get_order();
                order.add_product(extra_product, {quantity: extra_product_qty});
            }
            console.log('add_extra_product_to_current_order, baby!', extra_product);
        },
        get_extra_product_id_for_table: function(){
            var order = this.get_order(),
            var table = order.table;
            var extraProductId = table.additional_product_id;
            if (extraProductId){
                return extraProductId[0];
            }
            return false;
        }
    });

    floors.TableWidget = floors.TableWidget.include({
      // Overwritten methods
        set_table_color: function(color){
            if(color=== "rgb(235, 109, 109)"){ // Not allow to change to red
                console.log('set_table_color, nup red baby!');
            } else {
                this.table.color = _.escape(color);
                this.$el.css({'background': this.table.color});
                console.log('set_table_color, baby');
            }
        }
    });

    chrome.OrderSelectorWidget.include({
      // Overwritten methods
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

    var TableUpdateOrderButton = screens.ActionButtonWidget.extend({
        template: 'TableUpdateOrderButton',
        update_order_time: function() {
            console.log('update_order_time, baby!');
            if (this.pos.get_order()) {
                return this.pos.get_order().customer_count;
            } else {
                return 0;
            }
        },
        button_click: function() {
            var order = this.pos.get_order(),
                table = order.table,
                creation_date = order.creation_date,
                now = new Date();
            var difference = Math.abs(now - creation_date);
            var minutes_apart = Math.floor((difference/1000)/60);

            if (minutes_apart > table.wait_time){
                console.log('calculate_extra_product, baby');
                this.pos.calculate_extra_product(minutes_apart);
            }
            console.log('TableUpdateOrderButton onclick, baby!')
        }
    });

    screens.define_action_button({
        'name': 'update_order_time',
        'widget': TableUpdateOrderButton,
        'condition': function(){
            return this.pos.config.iface_floorplan;
        }
    });
});
