Ext.define("CArABU.app.portfolio-apps.PortfolioBurnup", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new CArABU.technicalservices.Logger(),
    defaults: { margin: 10 },

    integrationHeaders : {
        name : "CArABU.app.TSApp"
    },
    featureTypePath: null,
    modelType: null,

    launch: function() {

        this.fetchFeatureType().then({
           success: function(){
             this._initializeApp();
             this._showEmptyMessage();
             this.subscribe(this,'portfolioitemselected',this._onSelect, this);
           },
           failure: this._showErrorNotification,
           scope: this
        });

    },
    clearDisplay: function(){
       this.down('#displayBox') && this.down('#displayBox').removeAll();
    },
    getFeatureTypePath: function(){
       return this.featureTypePath;
    },
    _initializeApp: function(){
        var cb = this.add({
            xtype: 'rallycombobox',
            fieldLabel: 'Chart Units',
            labelAlign:"right",
            itemId:"chartUnit",
            cls: 'ctlLabel',
            editable:!1,
            store:Ext.create("Rally.data.custom.Store",{
              data:[{
                name: "Points",
                value: "points"
              },{
                name: "Count",
                value: "count"
              }],
              fields:["name","value"]
            }),
            value: "points",
            allowNoEntry:!1,
            displayField:"name",
            valueField:"value",
            stateful:!0,
            margin:5,
            stateId:"chart-units"
        });
        cb.on('select', this._updateChartUnits, this);

        this.add({
           xtype: 'container',
           itemId: 'displayBox'
        });
    },
    _showEmptyMessage: function(){
      this._showAppMessage("Please select an item from the grid.");
    },
    _showAppMessage: function(msg){
      this.clearDisplay();
      this.down('#displayBox').add({
         xtype: 'container',
         html: Ext.String.format("<div class='non-error-text'>{0}</div>",msg)
      });
    },
    _showErrorNotification: function(msg){
      this.clearDisplay();
      this.down('#displayBox').add({
         xtype: 'container',
         html: Ext.String.format("<div class='error-text'>{0}</div>",msg)
      });
    },
    getUsePoints: function(){
        return this.down('#chartUnit') && this.down('#chartUnit').getValue() == "points";
    },
    _updateChartUnits: function(cb){
        this._addChart();
    },
    _onSelect: function(data){
        this.logger.log('_onSelect',data);
        this.modelType = null;
        if (!data || data.length == 0){
            this._showEmptyMessage();
            return;
        }
          this.setLoading(true);

        this.modelType = data[0]._type;

        this.logger.log('modelType', this.modelType);

        this._setBoundaryDates(data);

        var title = _.pluck(data,'FormattedID');
        title = title.join(', ');
        this.title = title;
    
        this.clearDisplay();

        this._fetchStoreConfig(data).then({
           success: this._addChart,
           failure: this._showErrorNotification,
           scope: this
        });//.always(function(){ this.setLoading(false); },this);

    },
    getFetureTypePath: function(){
       return this.featureTypePath;
    },
    _fetchStoreConfig: function(data){
        var deferred = Ext.create('Deft.Deferred'),
            isMilestone = data.length > 0 && data[0]._type.toLowerCase() == "milestone";

        this.logger.log('_getStoreConfig', data, isMilestone);

        var typeHierarchy = [];
        if (this.getShowStories()){
            typeHierarchy.push('HierarchicalRequirement');
        }
        if (this.getShowDefects() && !isMilestone){
            typeHierarchy.push('Defect');
        }
        if (typeHierarchy.length === 0){
            typeHierarchy = ['HierarchicalRequirement'];
        }

        var configs = {
            find: {
                _TypeHierarchy: {$in: typeHierarchy},
                Children: null,
                _ItemHierarchy: {$in: [0] }
            },
            fetch: ['ScheduleState', 'PlanEstimate','_id','_TypeHierarchy','FormattedID','Project'],
            hydrate: ['ScheduleState','_TypeHierarchy','Project'],
            removeUnauthorizedSnapshots: true,
            useHttpPost: true,
            sort: {
                _ValidFrom: 1
            },
          //  context: this.getContext().getDataContext(),
            limit: Infinity
        };

        this.logger.log('data.length', data.length);
        if (data.length == 0){
           deferred.resolve(configs);
        } else {
            if (!isMilestone){
                configs.find._ItemHierarchy["$in"] = _.map(data, function(d){ return d.ObjectID; });
                this.storeConfig = configs;
                deferred.resolve(configs);
            } else {
              var filters = _.map(data, function(d){
                  return {
                     property: 'Milestones.ObjectID',
                     value: d.ObjectID
                  };
              });

              this.logger.log('filters', filters,this.getFeatureTypePath());
              if (filters.length > 1){
                 filters = Rally.data.wsapi.Filter.or(filters);
              }
              this.logger.log('filters', filters, this.getFeatureTypePath())
              // Ext.create('Rally.data.wsapi.artifact.Store', {
              //    models: ['PortfolioItem/Feature','Defect', 'UserStory'],
              /* Customer only wants user stories assocaited with features */
              Ext.create('Rally.data.wsapi.Store',{
                 model: this.getFeatureTypePath(),
                 filters: filters,
                 fetch: ['ObjectID','FormattedID','ActualStartDate','PlannedStartDate','Release','ReleaseDate','ReleaseStartDate','Project','Name','LeafStoryCount','AcceptedLeafStoryCount','AcceptedLeafStoryPlanEstimateTotal','LeafStoryPlanEstimateTotal'],
                 limit: Infinity,
                 pageSize: 1000,
                 context: {
                    project: null
                 }
             }).load({
                callback: function(records,operation){
                   this.logger.log('callback', operation);
                   if (operation.wasSuccessful()){
                      configs.find._ItemHierarchy["$in"] = _.map(records, function(d){ return d.get('ObjectID'); });

                      this.milestoneTeamData = this._buildMilestoneTeamData(records);

                      this._setBoundaryDates(records);

                      this.storeConfig = configs;
                      deferred.resolve(configs);
                   } else {
                      deferred.reject("Error loading milestone artifacts: " + operation && operation.error && operation.error.errors.join(','));
                   }
                },
                scope: this
             });
            }
        }
        return deferred.promise;
    },
    _setBoundaryDates: function(records){
        var startDate = null,
            endDate = this.endDate || null,
            startDateSource = null,
            endDateSource = this.endDateSource || null;

      this.logger.log('_setBoundaryDates', records);

      _.each(records, function(r){
          var data = r.getData && r.getData() || r;
          if (data._type == "milestone"){
             var edt = data.TargetDate;
             if (edt && (!endDate || edt > endDate)){
                endDate = edt;
                endDateSource = Ext.String.format("{0} TargetDate",data.FormattedID);
             }
          } else {
            var dt = data.ActualStartDate || data.PlannedStartDate || data.Release && data.Release.ReleaseStartDate || null;
            if (dt && (!startDate || dt < startDate)){
               startDate = dt;
               if (dt == (data.Release && data.Release.ReleaseStartDate)){ startDateSource = Ext.String.format("{0} ReleaseStartDate",data.FormattedID);  }
               if (dt == data.PlannedStartDate){ startDateSource = Ext.String.format("{0} PlannedStartDate",data.FormattedID);  }
               if (dt == data.ActualStartDate){ startDateSource = Ext.String.format("{0} ActualStartDate",data.FormattedID);  }
            }

            var edt = data.ActualEndDate || data.PlannedEndDate || (data.Release && data.Release.ReleaseDate) ;
            if (edt && (!endDate || edt > endDate)){
               endDate = edt;
               if (edt == (data.Release && data.ReleaseDate)){ endDateSource = Ext.String.format("{0} Release Date",data.FormattedID);  }
               if (edt == data.PlannedEndDate){ endDateSource = Ext.String.format("{0} PlannedEndDate",data.FormattedID);  }
               if (edt == data.ActualEndDate){ endDateSource = Ext.String.format("{0} ActualEndDate",data.FormattedID);  }
            }
          }

      });

      this.startDate = startDate;
      this.endDate = endDate;
      this.startDateSource = startDateSource;
      this.endDateSource = endDateSource;
      this.logger.log('_setBoundaryDates', this.startDate, this.endDate, this.startDateSource,this.endDateSource);
      },
    _buildMilestoneTeamData: function(records){
        var hashByTeam = _.reduce(records, function(hsh, r){
            console.log('r',r.get('Project').Name, r.get('FormattedID'));
            var proj = r.get('Project').Name;
            if (!hsh[proj]){
                hsh[proj] = {
                    name: proj,
                    totalCount: 0,
                    totalPoints: 0,
                    acceptedCount: 0,
                    acceptedPoints: 0
                };
            }
            hsh[proj].totalCount += r.get('LeafStoryCount') || 0;
            hsh[proj].totalPoints += r.get('LeafStoryPlanEstimateTotal') || 0;
            hsh[proj].acceptedCount += r.get('AcceptedLeafStoryCount') || 0;
            hsh[proj].acceptedPoints += r.get('AcceptedLeafStoryPlanEstimateTotal') || 0;
            return hsh;
        },{});
        return _.values(hashByTeam);
    },
    _addChart: function(storeConfig, title, startDate, endDate, usePoints){
             usePoints = this.getUsePoints();
             title = this.title;
             this.logger.log('_addChart', this.storeConfig, this.title, this.startDate, this.endDate, usePoints);
              this.setLoading(true);

              var items = [{
                xtype: 'portfolioburnup',

                chartColors: this._getChartColors(),
                chartConfig: {
                    title: {
                      text: title
                    },
                    yAxis: [{
                       title: {
                          text: usePoints ? "Points" : "Work Item Count"
                       }
                    }],
                    xAxis: {
                       title: {
                          text: Ext.String.format('DATE [{0}]',this.getXAxisSubtitle())
                       }
                    }
                },
                calculatorConfig: {
                     usePoints: usePoints,
                     completedScheduleStateNames: this.getCompletedStates(),
                     startDate: this.getStartDate(),
                     endDate: this.getEndDate(),
                     showDefects: this.getShowDefects(),
                     showStories: this.getShowStories()
                 },
                 storeConfig: this.storeConfig,
                 listeners: {
                     afterrender: function(){
                        this.setLoading(false);
                     },
                     scope: this
                 }
               }];

               if (this.isMilestones()){
                  items.push(this._getTeamBreakdownGrid());
               }

              this.down('#displayBox').removeAll();
              this.down('#displayBox').add({
                xtype: 'container',
                items: items
               });
    },
    getXAxisSubtitle: function(){
      if (!this.endDateSource){ this.getEndDate(); }
      if (!this.startDateSource) {this.getStartDate(); }

      return Ext.String.format("{0} through {1}",this.startDateSource, this.endDateSource);
    },
    getEndDate: function(){
       if (this.endDate){
          return this.endDate;
       }

       this.endDateSource = "today";
       return new Date();
    },
    getStartDate: function(){

        if (this.startDate){
           return this.startDate;
        }

        this.startDateSource = '1 year prior';
        return Rally.util.DateTime.add(this.getEndDate(), 'year', -1);

    },
    isMilestones: function(){
       return this.modelType.toLowerCase() == 'milestone';
    },
    getCompletedStates: function(){
        return ['Accepted'];
    },
    _getTeamBreakdownGrid: function(){
        this.logger.log('_getTeamBreakdownGrid', this.milestoneTeamData);
        var fields = _.keys(this.milestoneTeamData[0]);
        return {
            xtype: 'rallygrid',
            store: Ext.create('Rally.data.custom.Store',{
               data: this.milestoneTeamData,
               fields: fields,
               pageSize: this.milestoneTeamData.length
            }),
            showPagingToolbar: false,
            showRowActionsColumn: false,
            margin: 30,
            columnCfgs: [{
               text: 'Team',
               dataIndex: 'name',
               flex: 1
            },{
               text: 'Story Count',
               dataIndex: 'totalCount'
            },{
               text: 'Story Points',
               dataIndex: 'totalPoints'
            },{
               text: '% Done by Count',
               dataIndex: 'acceptedCount',
               renderer: function(v,m,r){
                  var data = r.getData();
                  data.percentDoneCount = data.totalCount > 0 ? data.acceptedCount/data.totalCount : 0;

                  return Ext.create('Rally.ui.renderer.template.progressbar.ProgressBarTemplate',{
                    percentDoneName: 'percentDoneCount',
                    calculateColorFn: function(){ return Rally.util.Colors.lime;}
                  }).apply(data);
               }
            },{
              text: '% Done by Points',
              dataIndex: 'acceptedPoints',
              renderer: function(v,m,r){
                 var data = r.getData();
                 data.percentDonePoints = data.totalPoints > 0 ? data.acceptedPoints/data.totalPoints : 0;

                 return Ext.create('Rally.ui.renderer.template.progressbar.ProgressBarTemplate',{
                   percentDoneName: 'percentDonePoints',
                   calculateColorFn: function(){ return Rally.util.Colors.lime;}
                 }).apply(data);
              }
            }]
        };
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
    },
    fetchFeatureType: function(){
        var deferred = Ext.create('Deft.Deferred');

        var store = Ext.create('Rally.data.wsapi.Store', {
            model: 'TypeDefinition',
            fetch: ['TypePath', 'Ordinal','Name'],
            filters: [
                {
                    property: 'Parent.Name',
                    operator: '=',
                    value: 'Portfolio Item'
                },
                {
                    property: 'Creatable',
                    operator: '=',
                    value: 'true'
                },{
                  property: 'Ordinal',
                  value: 0
                }
            ],
            sorters: [{
                property: 'Ordinal',
                direction: 'ASC'
            }]
        });
        store.load({
            callback: function(records, operation, success){

                if (success && records.length > 0){
                    this.featureTypePath = records[0].get('TypePath');
                    deferred.resolve(records[0].get('TypePath'));
                } else {
                    var error_msg = '';
                    if (operation && operation.error && operation.error.errors){
                        error_msg = operation.error.errors.join(',');
                    } else {
                        error_msg = "No Portfolio Item Types found."
                    }
                    deferred.reject('Error loading Portfolio Item Types:  ' + error_msg);
                }
            },
            scope: this
        });
        return deferred.promise;
    }

});
