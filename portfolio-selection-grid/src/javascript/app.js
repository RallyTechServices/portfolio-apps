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
            enableHierarchy: true
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
                              stateId: this.getContext().getScopedStateId(this._getArtifactType().replace('/','').toLowerCase() + '-filters'),
                              modelNames: modelNames,
                              inlineFilterPanelConfig: {
                                  quickFilterPanelConfig: {
                                      defaultFields: this._getDefaultFields()
                                  }
                              }
                          }
                      },{
                          ptype: 'rallygridboardfieldpicker',
                          headerPosition: 'left',
                          modelNames: modelNames,
                          stateful: true,
                          stateId: this.getContext().getScopedStateId(this._getArtifactType().replace('/','').toLowerCase() + '-grid-columns')
                      }],
                      gridConfig: {
                        bulkEditConfig: {
                          items: [{
                              xtype: 'showburnupbulkrecordmenuitem'
                          }]
                        },
                          store: store,
                          columnCfgs: this._getColumnCfgs()
                      },
                      height: this.getHeight()
                  });
              }
        });

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
