Ext.define("TSTimelineByItemSelector", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    
    integrationHeaders : {
        name : "TSTimelineByPFV"
    },
    
    config: {
        defaultSettings: {
            showScopeSelector: false,
            selectorType: null,
            type: 'PorftolioItem/Feature'
        }
    },
                        
    launch: function() {
        Rally.technicalservices.WsapiToolbox.fetchPortfolioItemTypes().then({
            success: function(portfolioItemTypes){
                this.portfolioItemTypes = portfolioItemTypes;
                                    
                if ( this.getSetting('showScopeSelector') || this.getSetting('showScopeSelector') == "true" ) {
                    this.headerContainer = this.add({xtype:'container',itemId:'header-ct', layout: {type: 'hbox'}});
                    this.headerContainer.add({
                        xtype: 'portfolioitemselector',
                        context: this.getContext(),
                        type: this.getSetting('selectorType'),
                        stateful: false,
                        stateId: this.getContext().getScopedStateId('app-selector'),
                        width: '75%',
                        listeners: {
                            change: this.updateWithPI,
                            scope: this
                        }
                    });
                } else {
                    // waiting for subscribe
                    this.subscribe(this, 'portfolioItemSelected', this.updateWithPI, this);
                    this.publish('requestPortfolioItem', this);
                }
            },
            failure: function(msg){
                this.logger.log('failed to load Portfolio Item Types', msg);
                Rally.ui.notify.Notifier.showError({message: msg});
            },
            scope: this
        });

    },
    
    _updateData: function() {
        var me = this;
        
        this._loadItems().then({
            success: function(data) {
                me.setLoading(false);
                
                me._addTimeline(data);
            },
            failure: function(msg) {
                Ext.Msg.alert("Problem loading data", msg);
            }
        });
    },
    
    _loadItems: function() {
        this.setLoading('Gathering items...');
        
        var filters = this._getFilters();
        var beginning_iso = Rally.util.DateTime.toIsoString( Rally.util.DateTime.add(new Date(),'month', -3) );
        
        filters = filters.and(Ext.create('Rally.data.wsapi.Filter',{
            property:'PlannedEndDate', 
            operator: '>', 
            value: beginning_iso
        }));
        
        this.logger.log('model:', this.model);
        this.logger.log('filters:', filters.toString());
        
        var config = {
            model: this.model,
            fetch: ['FormattedID','Name','PlannedEndDate', 'PlannedStartDate',
                'ActualStartDate', 'ActualEndDate'],
            sorters: [{property:'PlannedEndDate',direction:'ASC'}],
            filters: filters
        };
        
        this.logger.log('config:', config);
        
        return this._loadWsapiRecords(config);
    },
    
    updateWithPI: function(parentPI){
        this.logger.log('updateWithPI', parentPI);
        this.model = this.getSetting('type') || 'HierarchicalRequirement';
        
        this.removeAll();
        
        this.portfolioItem = parentPI;
        
        this._updateData();
    },
    
    _getFilters: function() {
        
        var setting_query = this.getSetting('query');
        
        if ( Ext.isEmpty( setting_query ) ) {
            return this._getPortfolioItemFilter();
        }
        
        var query_based_filter = Rally.data.wsapi.Filter.fromQueryString(setting_query);
        
        return this._getPortfolioItemFilter().and(query_based_filter);
    },
    
    _getPortfolioItemFilter: function(){
        this.logger.log('_getPortfolioItemFilter', this.portfolioItem)

        if (!this.portfolioItem){
            return [];
        }
        //First verify that the selected portfolio item type is an ancestor to the selected grid type.
        var pi_types = _.map(this.portfolioItemTypes, function(pi){return pi.typePath.toLowerCase()}),
            idx = _.indexOf(pi_types, this.portfolioItem.get('_type').toLowerCase()),
            type_idx = _.indexOf(pi_types, this.getSetting('type').toLowerCase());
        this.logger.log('_getPortfolioItemFilter', type_idx, idx)
        if (type_idx < idx) {
            var properties = [];
            for (var i = type_idx; i < idx; i++) {
                if (i < 0) {
                    properties.push("PortfolioItem");
                } else {
                    properties.push('Parent');
                }
            }
            this.logger.log('_getPortfolioItemFilter', properties);
            return Ext.create('Rally.data.wsapi.Filter', {
                property: properties.join('.'),
                value: this.portfolioItem.get('_ref')
            });
        } else if (type_idx === idx){
            return Ext.create('Rally.data.wsapi.Filter', {
                property: 'ObjectID',
                value: this.portfolioItem.get('ObjectID')
            });
        } else {
            Rally.ui.notify.Notifier.showError({message: "The selected type for the grid results is an ancestor to the selected portfolio item."});
            return [{property: 'ObjectID', value: 0}];
        }
        return [];
    },
    
    _addTimeline: function(records) {
        this.add({
            xtype: 'tsalternativetimeline',
            height: this.getHeight() - 20 ,
            width: this.getWidth() - 20,
            records: records
        });

        this.setLoading(false);
    },
      
    _loadWsapiRecords: function(config){
        var deferred = Ext.create('Deft.Deferred');
        var me = this;
        var default_config = {
            model: 'Defect',
            fetch: ['ObjectID']
        };
        this.logger.log("Starting load:",config.model);
        Ext.create('Rally.data.wsapi.Store', Ext.Object.merge(default_config,config)).load({
            callback : function(records, operation, successful) {
                if (successful){
                    deferred.resolve(records);
                } else {
                    me.logger.log("Failed: ", operation);
                    deferred.reject('Problem loading: ' + operation.error.errors.join('. '));
                }
            }
        });
        return deferred.promise;
    },
    
    getSettingsFields: function() {
       return Rally.technicalservices.PortfolioItemTimelineSettings.getFields(this.getContext(), this.getSettings() || this.config.defaultSettings);
    },
    
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },
    
    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },
    
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    },
    
    //onSettingsUpdate:  Override
    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
        // Ext.apply(this, settings);
        this.launch();
    }
});
