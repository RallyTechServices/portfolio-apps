Ext.define('CArABU.apps.portfolio-apps.ShowBurnupBulkMenuItem', {
    alias: 'widget.showburnupbulkrecordmenuitem',
    extend: 'Rally.ui.menu.bulk.MenuItem',

    config: {
        onBeforeAction: function(){
//            console.log('onbeforeaction');
        },

        /**
         * @cfg {Function} onActionComplete a function called when the specified menu item action has completed
         * @param Rally.data.wsapi.Model[] onActionComplete.successfulRecords any successfully modified records
         * @param Rally.data.wsapi.Model[] onActionComplete.unsuccessfulRecords any records which failed to be updated
         */
        onActionComplete: function(){
            console.log('onActionComplete');
        },

        text: 'Show Burnup...',

        handler: function () {
            var data = _.map(this.records, function(r){ return r.getData(); });
            Rally.getApp().publish('portfolioitemselected',data);

        },
        predicate: function (records) {
            return _.every(records, function (record) {
                  return record;
            });

        }
    }
});
