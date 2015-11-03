Ext.define('portfolio-item-selector', {
    extend : 'Ext.Container',
    componentCls : 'app',
    alias : 'widget.portfolioitemselector',
    layout : 'hbox',
    width : '100%',
    mixins : [
        'Rally.Messageable'
    ],

    buttonText: 'Select...',

    constructor : function(config)
    {
        Ext.apply(this, config);
        this.stateId = Rally.environment.getContext().getScopedStateId('portfolioitemselector');
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
    _addSelector : function()
    {
        this.add({
            xtype: 'rallybutton',
            text: this.buttonText,
            cls: 'rly-small secondary',
            listeners: {
                scope: this,
                click: this._showPicker
            }
        });
        var ct = this.add({
            xtype:'container',
            itemId:'portfolio-item-description',
            tpl:'<tpl if="FormattedID">{FormattedID}:  {Name}<tpl else>Please select a Portfolio Item</tpl>'
        });

        if (this.portfolioItem){
            ct.update(this.portfolioItem.getData());
        } else {
            ct.update({});
        }



    },
    _showPicker: function(){
        var types = _.pluck(this.portfolioItemTypes, 'typePath');
        Ext.create('Rally.ui.dialog.ArtifactChooserDialog', {
            artifactTypes: types,
            autoShow: true,
            height: 250,
            title: 'Select Portfolio Item',
            listeners: {
                artifactchosen: function(dialog, selectedRecord){
                    this.portfolioItem = selectedRecord;
                    this.down('#portfolio-item-description').update(selectedRecord.getData());
                    this.fireEvent('change', selectedRecord);
                    this.publish('portfolioItemSelected', selectedRecord);
                },
                scope: this
            }
        });
    },
    _requestPorfolioItem : function() {
        this.publish('portfolioItemSelected', this.portfolioItem || null);
    }
});