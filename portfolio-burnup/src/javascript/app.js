Ext.define("CArABU.app.portfolio-apps.PortfolioBurnup", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new CArABU.technicalservices.Logger(),
    defaults: { margin: 10 },

    integrationHeaders : {
        name : "CArABU.app.TSApp"
    },

    launch: function() {

        this._showEmptyMessage();

        this.subscribe(this,'portfolioitemselected',this._onSelect, this);

    },
    _showEmptyMessage: function(){
        this.removeAll();
        this.add({
           xtype: 'container',
           html: "Please select a portfolio item from the portfolio selection grid."
        });
    },
    _onSelect: function(portfolioItemData){
        this.logger.log('_onSelect',portfolioItemData);
        if (!portfolioItemData){
            this._showEmptyMessage();
            return;
        }

        var startDate = portfolioItemData.PlannedStartDate || portfolioItemData.ActualStartDate || Rally.util.DateTime.add(new Date(),'month',-3);
        var endDate = portfolioItemData.PlannedEndDate || portfolioItemData.ActualEndDate || new Date();

        if (startDate >= endDate){
            this.logger.log('dates are wonky', startDate, endDate);
            startDate = Rally.util.DateTime.add(endDate,'month',-1);
        }

        this.logger.log('dates',startDate, endDate);
        this.removeAll();

        this.add({
          xtype: 'container',
          items: [{

          xtype: 'portfolioburnup',
          chartColors: this._getChartColors(),
          chartConfig: {
              title: {
                text: portfolioItemData.FormattedID
              },
              yAxis: [{
                 title: {
                    text: this.getUnit()
                 }
              }]
          },
          calculatorConfig: {
               usePoints: this.getUnit() === 'Points',
               completedScheduleStateNames: this.getCompletedStates(),
               startDate: startDate,
               endDate: endDate,
               showDefects: this.getShowDefects(),
               showStories: this.getShowStories()
           },
           storeConfig: this._getStoreConfig(portfolioItemData),
         }]
         });
    },
    getCompletedStates: function(){
        return ['Accepted'];
    },
    _getStoreConfig: function(portfolioItemData){

        this.logger.log('_getStoreConfig', portfolioItemData);

        var typeHierarchy = [];
        if (this.getShowStories()){
            typeHierarchy.push('HierarchicalRequirement');
        }
        if (this.getShowDefects()){
            typeHierarchy.push('Defect');
        }
        if (typeHierarchy.length === 0){
            typeHierarchy = ['HierarchicalRequirement'];
        }

        var configs = {
            find: {
                _TypeHierarchy: {$in: typeHierarchy},
                Children: null,
                _ItemHierarchy: portfolioItemData.ObjectID
            },
            fetch: ['ScheduleState', 'PlanEstimate','_id','_TypeHierarchy','FormattedID'],
            hydrate: ['ScheduleState','_TypeHierarchy'],
            removeUnauthorizedSnapshots: true,
            sort: {
                _ValidFrom: 1
            },
          //  context: this.getContext().getDataContext(),
            limit: Infinity
        };
        return configs;
    },
    _getChartColors: function(){
      //In order to keep the colors consistent for the different options,
      //we need to build the colors according to the settings
      var chartColors = [],
          numCompletedStates = this.getCompletedStates().length;

      if (this.getShowStories()){
          chartColors.push('#8DC63F');
      }
      if (this.getShowDefects()){
          chartColors.push('#FBB990');
      }
      if (numCompletedStates > 1){
          if (this.getShowStories()){
              chartColors.push('#1E7C00');
          }
          if (this.getShowDefects()){
              chartColors.push('#FF8200');
          }
      }
      chartColors.push('#7CAFD7');
      return chartColors;
  },
    getShowDefects: function(){
        return true;
    },
    getShowStories: function(){
        return true;
    },
    getUnit: function(){
       return 'Points';
    },
    getSettingsFields: function() {
        var check_box_margins = '5 0 5 0';
        return [{
            name: 'saveLog',
            xtype: 'rallycheckboxfield',
            boxLabelAlign: 'after',
            fieldLabel: '',
            margin: check_box_margins,
            boxLabel: 'Save Logging<br/><span style="color:#999999;"><i>Save last 100 lines of log for debugging.</i></span>'

        }];
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
