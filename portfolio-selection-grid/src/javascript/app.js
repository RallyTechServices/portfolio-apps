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
           artifactType: "PortfolioItem/Feature"
       }
    },

    launch: function() {
        var modelNames = this._getModelNames();
        var me = this;
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
                              stateId: this.getContext().getScopedStateId('portfolio-grid-filters'),
                              modelNames: modelNames,
                              inlineFilterPanelConfig: {
                                  quickFilterPanelConfig: {
                                      defaultFields: [
                                          'ArtifactSearch',
                                          'Owner'
                                      ]
                                  }
                              }
                          }
                      },{
                          ptype: 'rallygridboardfieldpicker',
                          headerPosition: 'left',
                          modelNames: modelNames,
                          stateful: true,
                          stateId: this.getContext().getScopedStateId('portfolio-grid-columns')
                      }],
                      gridConfig: {
                          store: store,
                          columnCfgs: [
                              'Name',
                              'State',
                              'Owner',
                              'Project'
                          ],
                          listeners: {
                            //  select: this._itemSelected,
                            //  onselectionchange: this._selectionChanged,
                              itemclick: this._itemSelected,
                              scope: this

                          }
                      },
                      height: this.getHeight()
                  });
              }
        });

    },
    _itemSelected: function(grid, record){
        this.logger.log('_itemSelected',record);
        this.publish('portfolioitemselected',record.getData());
    },
    _getArtifactType: function(){
        return this.getSetting('artifactType');
    },
    _getModelNames: function(){
        return [this.getSetting('artifactType')];
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
