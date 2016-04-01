Ext.define('portfolio-item-selector', {
    extend : 'Ext.Container',
    componentCls : 'app',
    alias : 'widget.portfolioitemselector',
    layout : 'hbox',
    width : '100%',
    mixins : [
        'Rally.Messageable',
        'Ext.state.Stateful'
    ],
    stateful: true,
    stateEvents: ['change'],

    type: null,
    buttonText: 'Go',
    buttonPushed: false,

    constructor : function(config)
    {
        this.type = config.type;
        this.callParent(arguments);
    },
    initComponent : function()
    {
        this.callParent(arguments);
        this.removeAll();
        this._addSelector();

        // configured to allow others to ask what the current selection is,
        // in case they missed the initial message
        this.subscribe(this, 'requestPortfolioItem', this._requestPorfolioItem, this);

    },
    getState: function(){
        if (this.portfolioItem){
            return {portfolioItemRef: this.portfolioItem.get('_ref')};
        }
        return null;
    },
    applyState: function(state) {
//        if (!Ext.isEmpty(state) && !Ext.Object.isEmpty(state)){
//            var ref = Ext.create('Rally.util.Ref',state.portfolioItemRef),
//                type = ref.getType();
//
//            //don't apply the state if the type doesn't match.
//            if (this.type && this.type.toLowerCase() !== type.toLowerCase()){
//                this._updatePortfolioItem(null);
//                return;
//            }
//
//            Rally.data.ModelFactory.getModel({
//                type: type,
//                scope: this,
//                success: function(model) {
//                    model.load(ref.getOid(),{
//                        scope: this,
//                        callback: function(result, operation){
//                            if (result && operation.wasSuccessful()){
//                                this._updatePortfolioItem(result);
//                            } else {
//                                this._updatePortfolioItem(null);
//                                Rally.ui.notify.Notifier.showError({message: 'Could not load state for item [' + state + ']: ' + operation.error && operation.error.errors.join(',')});
//                            }
//
//                        }
//                    });
//                },
//                failure: function(){
//                    this._updatePortfolioItem(null);
//                    Rally.ui.notify.Notifier.showError({message: 'Could not load state for item [' + state + ']'});
//                }
//            });
//        } else {
//            this._updatePortfolioItem(null);
//        }
    },
    _updatePortfolioItem: function(){
        this.buttonPushed = true;
        var cb = this.down('#cb-portfolioitem');
        
        if (cb){
            var portfolioItem = cb.getRecord();
            this.portfolioItem = portfolioItem;
            this.fireEvent('change', portfolioItem);
            this.publish('portfolioItemSelected', portfolioItem);

            if (this.stateful && this.stateId){
                this.saveState();
            }
        }

    },
    _addSelector : function()
    {
        this.removeAll();
        if (!this.type){
            this.add({
                xtype: 'container',
                html: '<div class="message">Please configure a selector type in the app settings.</div>',
                padding: 10
            });
        } else {

            var cb = Ext.create('Rally.ui.combobox.ComboBox',{
                storeConfig: {
                    model: this.type,
                    fetch: ['FormattedID','ObjectID','Name'],
                    remoteFilter: false,
                    autoLoad: true,
                    limit: Infinity
                },
                allowNoEntry: true,
                noEntryText: '',
                noEntryValue: 0,
                itemId: 'cb-portfolioitem',
                margin: 10,
                valueField: 'ObjectID',
                displayField: 'FormattedID',
                width: 600,
                listConfig: {
                    itemTpl: '<tpl if="ObjectID &gt; 0">{FormattedID}: {Name}</tpl>'
                },
                filterProperties: ['Name','FormattedID','ObjectID'],
                fieldCls: 'pi-selector',
                displayTpl: '<tpl for=".">' +
                '<tpl if="ObjectID &gt; 0 ">' +
                '{[values["FormattedID"]]}: {[values["Name"]]}' +
                '</tpl>' +
                '<tpl if="xindex < xcount">,</tpl>' +
                '</tpl>'
            });
            //cb.on('ready', this._updatePortfolioItem, this);
            cb.on('change', this._updateGoButton, this);
            
            this.add(cb);

            this.add({
                xtype: 'rallybutton',
                text: this.buttonText,
                itemId: 'cb-go-button',
                cls: 'rly-small primary',
                disabled: true,
                margin: 10,
                listeners: {
                    scope: this,
                    click: this._updatePortfolioItem
                }
            });
        }
    },
    
    _updateGoButton: function(cb) {
        if ( !Ext.isEmpty(cb.getValue()) && cb.getValue() > 0 ) {
            this.down('#cb-go-button').setDisabled(false);
        } else {
            this.down('#cb-go-button').setDisabled(true);
        }
    },
    
    _requestPorfolioItem : function() {
        // only publish if the go button has been pushed
        if ( this.buttonPushed ) {
            this.publish('portfolioItemSelected', this.portfolioItem || null);
            return;
        }
        
        console.log("Requested PI, but the user hasn't pushed the Go button");
        
    }
});