Ext.define("CArABU.app.portfolio-apps.PortfolioSelection", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new CArABU.technicalservices.Logger(),
    defaults: { margin: 10 },

    integrationHeaders : {
        name : "CArABU.app.portfolio-apps.TSPortfolioSelection"
    },

    config: {
       defaultSettings: {
           artifactType: "Milestone",
           saveLog: false
       }
    },

    launch: function() {
        var modelNames = this._getModelNames();
        var me = this;
        this.logger.log('modelNames', this._getModelNames(), this._getArtifactType());
        Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
            models: [this._getArtifactType()],
            autoLoad: true,
            enableHierarchy: true,
            fetch: this._getFetchFields(),
            sorters: [{property: 'Name', direction: 'ASC'}]
        }).then({
            scope: this,
            success: function(store) {
              this.add({
                      xtype: 'rallygridboard',
                      context: this.getContext(),
                      modelNames: modelNames,
                      toggleState: 'grid',
                      plugins: [{
                          ptype: 'rallygridboardinlinefiltercontrol',
                          inlineFilterButtonConfig: {
                              stateful: true,
                              stateId: this.getContext().getScopedStateId(this._getArtifactType().replace('/','').toLowerCase() + '--filters'),
                              modelNames: modelNames,
                              inlineFilterPanelConfig: {
                                  quickFilterPanelConfig: {
                                      defaultFields: this._getDefaultFields(),
                                      addQuickFilterConfig: {
                                          whiteListFields: this._getWhitelistFields()
                                      }
                                  },
                                  advancedFilterPanelConfig: {
                                    advancedFilterRowsConfig: {
                                        propertyFieldConfig: {
                                            whiteListFields: this._getWhitelistFields()
                                        }
                                    }
                                }
                              }
                          }
                      },{
                          ptype: 'rallygridboardfieldpicker',
                          headerPosition: 'left',
                          modelNames: modelNames,
                          stateful: true,
                          stateId: this.getContext().getScopedStateId(this._getArtifactType().replace('/','').toLowerCase() + '--columns')
                      }],
                      gridConfig: {
                        listeners: {
                            beforestaterestore: function(grid, state){
                                var fields = grid.getModels()[0].getFields();
                                var validFields = _.reduce(fields, function(arr, f){
                                  if (f.attributeDefinition && f.attributeDefinition._refObjectUUID){
                                      arr.push(f.attributeDefinition._refObjectUUID);
                                  }
                                  return arr;
                                },[]);

                                if (state.sorters && state.sorters.length > 0){
                                   var removeSorters = false;

                                    _.each(state.sorters, function(s, i){
                                        if (!_.contains(validFields, s.property)){
                                            removeSorters = true;
                                            return false;
                                        }
                                    });
                                    if (removeSorters){
                                      state.sorters = [{
                                       property: 'Name',
                                       value: 'ASC'
                                      }]
                                    }
                                }
                                if (state.columns && state.columns.length > 0){
                                    var removeColumns = false;
                                    _.each(state.columns, function(c,i){
                                        if (!_.contains(validFields, c.dataIndex)){
                                           removeColumns = true;
                                           return false;
                                        }
                                    });
                                    if (removeColumns){
                                        state.columns = this._getColumnCfgs();
                                    }
                                }
                            },
                            scope: this
                        },
                        // applyState: function(state) {
                        //     if (state) {
                        //         console.log('state',state);
                        //         Ext.apply(this, state);
                        //     }
                        // },
                        bulkEditConfig: {
                          items: [{
                              xtype: 'showburnupbulkrecordmenuitem'
                          }]
                        },
                          store: store,
                          columnCfgs: this._getColumnCfgs(),
                          storeConfig: {
                             sorters: [{
                                property: 'Name',
                                direction: 'ASC'
                             }]
                          }
                      },
                      height: this.getHeight()
                  });
              }
        });

    },
    _getWhitelistFields: function(){
        if (this._getArtifactType() == "Milestone"){
          return ['Tags'];
        }
        return ['Milestones', 'Tags'];
    },
    _getDefaultFields: function(){
      if (this._getArtifactType() == "Milestone"){
          return [
              'Name',
          ];
      }
       return [
           'ArtifactSearch',
           'Owner'
       ];
    },
    _getColumnCfgs: function(){
        if (this._getArtifactType() == "Milestone"){
            return [
                'Name',
                'TargetDate'
            ];
        }
        return [
            'Name',
            'State',
            'Owner',
            'Project'
        ];
    },
    _itemSelected: function(grid, record){
        this.logger.log('_itemSelected',record);
        this.publish('portfolioitemselected',record.getData());
    },
    _getArtifactType: function(){
        return this.getSetting('artifactType');
    },
    _getModelNames: function(){
        return [this._getArtifactType()];
    },
    _getFetchFields: function(){
      if (this._getArtifactType() == "Milestone"){
          return [
              'Name',
              'TargetDate'
          ];
      }
       return [
           'PlannedEndDate',
           'PlannedStartDate',
           'ActualStartDate',
           'ActualEndDate',
           'Release',
           'ReleaseDate',
           'ReleaseStartDate'
       ];
    },
    getOptions: function() {
        var options = [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];

        return options;
    },
    getSettingsFields: function(){

        var filters = [{
           property: 'TypePath',
           operator: 'contains',
           value: 'PortfolioItem/'
        },{
           property: 'TypePath',
           value: 'Milestone'
        }];
        filters = Rally.data.wsapi.Filter.or(filters);

       return [{
          xtype: 'rallycombobox',
          name: 'artifactType',
          fieldLabel: 'Artifact Type',
          margin: 10,
          displayField: 'Name',
          valueField: 'TypePath',
          storeConfig: {
              model: 'TypeDefinition',
              filters: filters,
              remoteFilter: true
          }
       }];
    },
    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }

        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{
            showLog: this.getSetting('saveLog'),
            logger: this.logger
        });
    },

    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    }

});
