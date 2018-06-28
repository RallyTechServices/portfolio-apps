Ext.define("CArABU.app.portfolio-apps.PortfolioBurnup", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new CArABU.technicalservices.Logger(),
    defaults: { margin: 10 },

    integrationHeaders : {
        name : "CArABU.app.TSApp"
    },
    featureTypePath: null,

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
        if (!data){
            this._showEmptyMessage();
            return;
        }
          this.setLoading(true);

        var startDate = null, //Rally.util.DateTime.add(new Date(),'month',-12),
            endDate = null,
            title = [];

        _.each(data, function(d){
            var sDt = d.PlannedStartDate || d.ActualStartDate || (d.Release && d.Release.ReleaseStartDate) || null;
          //  console.log('sd',d.PlannedStartDate , d.ActualStartDate , (d.Release && d.Release.ReleaseStartDate))
            if (!startDate || sDt < startDate){
               startDate = sDt;
            }

            var eDt = d.PlannedEndDate || d.ActualEndDate || (d.Release && d.Release.ReleaseDate) || d.TargetDate || null;
            //console.log('ed',d.PlannedEndDate , d.ActualEndDate , (d.Release && d.Release.ReleaseDate))
            if (!endDate || eDt > endDate){
               endDate = eDt;
            }

            title.push(d.FormattedID);
        });
        title = title.join(', ');
        //var startDate = portfolioItemData.PlannedStartDate || portfolioItemData.ActualStartDate || Rally.util.DateTime.add(new Date(),'month',-3);
        //var endDate = portfolioItemData.PlannedEndDate || portfolioItemData.ActualEndDate || new Date();
        if (!endDate){
            endDate = new Date();
        }

        if (!startDate){
          startDate = Rally.util.DateTime.add(endDate, 'year',-1);
        }

        if (startDate >= endDate){
            this.logger.log('dates are wonky', startDate, endDate);
            startDate = Rally.util.DateTime.add(endDate,'month',-1);
        }

        this.startDate = startDate;
        this.endDate = endDate;
        this.title = title;

        this.logger.log('dates',startDate, endDate, title);
        this.clearDisplay();


        this._fetchStoreConfig(data).then({
           success: this._addChart,
           failure: this._showErrorNotification,
           scope: this
        }).always(function(){ this.setLoading(false); },this);

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
            fetch: ['ScheduleState', 'PlanEstimate','_id','_TypeHierarchy','FormattedID'],
            hydrate: ['ScheduleState','_TypeHierarchy'],
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
                 fetch: ['ObjectID','ActualStartDate','PlannedStartDate','Release','ReleaseDate','ReleaseStartDate'],
                 limit: Infinity,
                 pageSize: 1000,
                 context: {
                    project: null
                 }
             }).load({
                callback: function(records,operation){

                   if (operation.wasSuccessful()){
                      configs.find._ItemHierarchy["$in"] = _.map(records, function(d){ return d.get('ObjectID'); });

                      var startDate = null,
                          endDate = this.endDate || null,
                          startDateSource = null,
                          emd;

                      _.each(records, function(r){
                          var dt = r.get('ActualStartDate') || r.get('PlannedStartDate') || (r.get('Release') && r.get('Release').ReleaseStartDate);
                          if (!startDate || dt < startDate){
                             startDate = dt;
                             if (dt == (r.get('Release') && r.get('Release').ReleaseStartDate)){ startDateSource = Ext.String.format("Release Start Date ({0})",r.get('FormattedID'));  }
                             if (dt == r.get('PlannedStartDate')){ startDateSource = Ext.String.format("Planned Start Date ({0})",r.get('FormattedID'));  }
                             if (dt == r.get('ActualStartDate')){ startDateSource = Ext.String.format("Actual Start Date ({0})",r.get('FormattedID'));  }
                          }

                          var edt = r.get('ActualEndDate') || r.get('PlannedEndDate') || (r.get('Release') && r.get('Release').ReleaseDate);;
                          if (!endDate || edt > endDate){
                             endDate = edt;
                             if (edt == (r.get('Release') && r.get('Release').ReleaseDate)){ endDateSource = Ext.String.format("Release Date ({0})",r.get('FormattedID'));  }
                             if (edt == r.get('PlannedEndDate')){ endDateSource = Ext.String.format("Planned End Date ({0})",r.get('FormattedID'));  }
                             if (edt == r.get('ActualEndDate')){ endDateSource = Ext.String.format("Actual End Date ({0})",r.get('FormattedID'));  }
                          }
                      });

                      this.startDate = startDate;
                      this.endDate = endDate;

                      if (this.endDate < this.startDate){
                          this.endDate = new Date();
                      }
                      this.startDateSource = startDateSource;
                      this.endDateSource = endDateSource;

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
    _addChart: function(storeConfig, title, startDate, endDate, usePoints){
             usePoints = this.getUsePoints();
             title = this.title;
             this.logger.log('_addChart', this.storeConfig, this.title, this.startDate, this.endDate, usePoints);
             this.setLoading(true);
             this.down('#displayBox').removeAll();
              this.down('#displayBox').add({
                xtype: 'container',
                items: [{

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
                    }]
                },
                calculatorConfig: {
                     usePoints: usePoints,
                     completedScheduleStateNames: this.getCompletedStates(),
                     startDate: this.startDate,
                     endDate: this.endDate,
                     showDefects: this.getShowDefects(),
                     showStories: this.getShowStories()
                 },
                 storeConfig: this.storeConfig,
               }]
               });
    },
    getCompletedStates: function(){
        return ['Accepted'];
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
