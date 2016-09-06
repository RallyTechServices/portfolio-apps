Ext.define('CA.techservices.recordmenu.changesetedit', {
    alias:'widget.tschangesetmenuitemedit',
    extend:'Rally.ui.menu.item.RecordMenuItem',

    config:{
        predicate: function(record) {
            return this._isChangesetable(record);
        },

        handler: function() {
            this._displayGrid(this.record);
        },

        text: 'Edit Changesets...'
    },
    
    _isChangesetable: function(record) {
        var valid_types = ['hierarchicalrequirement','defect','task'];
        var record_type = record.get('_type').toLowerCase();
        
        return Ext.Array.contains(valid_types, record_type);
    },
    
    _displayGrid: function(record) {
        var title = Ext.String.format("Changesets for {0}:{1}",
            record.get('FormattedID'),
            record.get('Name')
        );
        
        // VERY SLOW:
//        var store = Ext.create('Rally.data.wsapi.Store',{
//            model:'Changeset',
//            fetch: ['Author','CommitTimestamp','Message','Revision','SCMRepository','Uri'],
//            pageSize: 200,
//            limit: 'Infinity',
//            filters: [{property:'Artifacts.ObjectID', operator:'contains',value:record.get('ObjectID')}],
//            context: {
//                project: null
//            }
//        });
        // FASTER:
        this.store = record.getCollection('Changesets',{
            fetch: ['Author','CommitTimestamp','Message','Revision','SCMRepository','Uri'],
            pageSize: 200,
            limit: 'Infinity'
        });

        var columns = this._getColumns();

        Ext.create('Rally.ui.dialog.Dialog', {
            id       : 'popup',
            width    : Ext.getBody().getWidth() - 40,
            height   : Ext.getBody().getHeight() - 40,
            title    : title,
            autoShow : true,
            closable : true,
            layout   : 'fit',
            items    : [{
                xtype                : 'rallygrid',
                itemId               : 'cs_grid',
                showPagingToolbar    : false,
                disableSelection     : true,
                showRowActionsColumn : false,
                columnCfgs           : columns,
                store                : this.store
            }]
        });
    },
    
    _getColumns: function() {
        var me = this;
        var artifact = this.record;
        return [{
            xtype: 'rallyrowactioncolumn',
            rowActionsFn: function (record) {
                console.log(record);
                return [
                    {
                        xtype: 'tschangesetmenuitemdisconnect',
                        record: artifact,
                        changeset: record,
                        store: me.store
                    }
                ];
            }
        },{
            dataIndex:'Name',
            text:'Name',
            flex: 1
        },{
            dataIndex:'Message',
            text:'Message',
            flex: 3
        },{
            dataIndex:'Author',
            text:'Author',
            renderer: function(value) { 
                if (Ext.isObject(value)){ return value._refObjectName; }
                return value;
            }
        },{
            dataIndex: 'CommitTimestamp',
            text: 'Timestamp'
        }];
    }
});