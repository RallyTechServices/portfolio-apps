Ext.define('CA.techservices.recordmenu.changesetdisconnect', {
    alias:'widget.tschangesetmenuitemdisconnect',
    extend:'Rally.ui.menu.item.RecordMenuItem',

    config:{
        predicate: function(record) {
            return true;
        },

        handler: function() {
            this._removeFromArtifact(this.changeset, this.record);
        },

        text: 'Disconnect Changeset'
    },
    
    _removeFromArtifact: function(changeset,record) {
        // a hack to get the grid.  must be a better way
        var display_store = this.store;
        
        var changeset_store = record.getCollection('Changesets');
        changeset_store.load({
            callback: function() {
                changeset_store.remove([changeset.get('_ref')]);
                changeset_store.sync({
                    callback: function() {
                        display_store.load();
//                        var store = record.getCollection('Changesets',{
//                            fetch: ['Author','CommitTimestamp','Message','Revision','SCMRepository','Uri'],
//                            pageSize: 200,
//                            limit: 'Infinity'
//                        });
                        
                    }
                });
            }
        });
    }
});