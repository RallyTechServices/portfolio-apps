Ext.override(Rally.ui.grid.TreeGrid,{

    /* 
     * Override applyState so that the grid's state is merged with the provided configured
     * columns.  This allows changes to the required columns to be applied.
     */
    applyState: function(state) {
        
        if (state) {
            if (state.columns) {
                
                // state columns might be objects, and column configs be an array of strings
                var cfg_by_index = {};
                Ext.Array.each(state.columns, function(column){
                    if ( Ext.isObject(column) ) {
                        cfg_by_index[column.dataIndex] = column;
                    }
                });
                
                // for columns passed in, use state-saved version if available
                var cfgs = Ext.Array.map(this.columnCfgs, function(col) {
                    if ( !Ext.isEmpty(cfg_by_index[col]) ) {
                        return cfg_by_index[col];
                    }
                    return col;
                });
                
                // put any state saved ones that weren't passed in at the end
                this.columnCfgs = Ext.Array.filter( 
                    Ext.Array.merge(cfgs, state.columns),
                    function(col) {
                        return ( col != 'FormattedID' );
                });
            }

            if (state.sorters && this.storeConfig ) {
                this.storeConfig.sorters = _.map(state.sorters, function(sorterState) {
                    return Ext.create('Ext.util.Sorter', {
                        property: sorterState.property,
                        direction: sorterState.direction
                    });
                });
            }
        }
    }
});

