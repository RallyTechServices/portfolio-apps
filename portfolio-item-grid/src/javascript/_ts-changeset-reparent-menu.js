Ext.define('CA.techservices.recordmenu.ChangesetReparent', {
    alias:'widget.tschangesetmenuitemreparent',
    extend:'Rally.ui.menu.item.RecordMenuItem',

    config:{
        predicate: function(record) {
            return true;
        },

        handler: function() {
            this._launchParentChooser();
        },

        text: 'Reparent Changeset'
    },
    
    _launchParentChooser: function() {
        var me = this;
        Ext.create('Rally.ui.dialog.ArtifactChooserDialog', {
            artifactTypes: ['userstory', 'defect','task'],
            autoShow: true,
            height: 250,
            title: 'Choose Artifact',
            listeners: {
                artifactchosen: function(dialog, new_record){
                    Deft.Chain.sequence([
                        function() {
                            return me._moveToArtifact(me.changeset, new_record);
                        },
                        function() {
                            return me._removeFromArtifact(me.changeset, me.record);
                        }
                    ]).then({
                        failure: function(msg) {
                            Ext.Msg.alert('Problem Reparenting', msg);
                        }
                    });
                },
                scope: this
            }
         });
            
    },
    
    _moveToArtifact: function(changeset,record) {
        var deferred = Ext.create('Deft.Deferred');
        
        var changeset_store = record.getCollection('Changesets');
        changeset_store.load({
            callback: function() {
                changeset_store.add([changeset.get('_ref')]);
                changeset_store.sync({
                    callback: function() {
                        deferred.resolve();
                    },
                    failure: function(batch,options) {
                        console.log('problem:', batch, options);
                        deferred.reject("Cannot Add Changeset to ", record.get('FormattedID'));
                    }
                });
            }
        });
        
        return deferred.promise;
    },
    
    _removeFromArtifact: function(changeset,record) {
        var deferred = Ext.create('Deft.Deferred');

        // a hack to get the store.  must be a better way
        var display_store = this.store;
        
        var changeset_store = record.getCollection('Changesets');
        changeset_store.load({
            callback: function() {
                changeset_store.remove([changeset.get('_ref')]);
                changeset_store.sync({
                    callback: function() {
                        display_store.load();
                        deferred.resolve();
                    },
                    failure: function(batch,options) {
                        console.log('problem:', batch, options);
                        deferred.reject("Cannot Remove Changeset from ", record.get('FormattedID'));
                    }
                });
            }
        });
        return deferred.promise;
    }
});