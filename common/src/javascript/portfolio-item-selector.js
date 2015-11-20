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
    buttonText: 'Select...',

    constructor : function(config)
    {
        this.type = config.type;
        this.callParent(arguments);
    },
    initComponent : function()
    {
        this.callParent(arguments);
        this._addSelector();
        this.addEvents('change');

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
        if (!Ext.isEmpty(state) && !Ext.Object.isEmpty(state)){
            var ref = Ext.create('Rally.util.Ref',state.portfolioItemRef),
                type = ref.getType();

            //don't apply the state if the type doesn't match.
            if (this.type && this.type.toLowerCase() !== type.toLowerCase()){
                this._updatePortfolioItem(null);
                return;
            }

            Rally.data.ModelFactory.getModel({
                type: type,
                scope: this,
                success: function(model) {
                    model.load(ref.getOid(),{
                        scope: this,
                        callback: function(result, operation){
                            if (result && operation.wasSuccessful()){
                                this._updatePortfolioItem(result);
                            } else {
                                this._updatePortfolioItem(null);
                                Rally.ui.notify.Notifier.showError({message: 'Could not load state for item [' + state + ']: ' + operation.error && operation.error.errors.join(',')});
                            }

                        }
                    });
                },
                failure: function(){
                    this._updatePortfolioItem(null);
                    Rally.ui.notify.Notifier.showError({message: 'Could not load state for item [' + state + ']'});
                }
            });
        } else {
            this._updatePortfolioItem(null);
        }
    },
    _updatePortfolioItem: function(portfolioItem){
        this.portfolioItem = portfolioItem;
        var ct = this.down('#portfolio-item-description');
        if (ct){
            if (this.portfolioItem){
                ct.update(this.portfolioItem.getData());
            } else {
                ct.update({});
            }
        }
        this.fireEvent('change', portfolioItem);
        this.publish('portfolioItemSelected', portfolioItem);
        if (this.stateful && this.stateId){
            this.saveState();
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
            this.add({
                xtype: 'rallybutton',
                text: this.buttonText,
                cls: 'rly-small primary',
                margin: 10,
                width: 63,
                listeners: {
                    scope: this,
                    click: this._showPicker
                }
            });
            var ct = this.add({
                xtype:'container',
                itemId:'portfolio-item-description',
                margin: 10,
                tpl:'<tpl if="FormattedID"><div class="portfolio-item">{FormattedID}:  {Name}</div><tpl else><div class="message">Please select a Portfolio Item</div></tpl>'
            });
        }
    },
    _showPicker: function(){
        var types = [this.type];
        Ext.create('Rally.ui.dialog.ArtifactChooserDialog', {
            artifactTypes: types,
            autoShow: true,
            height: 250,
            title: 'Select Portfolio Item',
            listeners: {
                artifactchosen: function(dialog, selectedRecord){
                    this._updatePortfolioItem(selectedRecord);
                },
                scope: this
            }
        });
    },
    _requestPorfolioItem : function() {
        this.publish('portfolioItemSelected', this.portfolioItem || null);
    }
});