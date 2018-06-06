Ext.define('CArABU.apps.portfolio-apps.PortfolioBurnupCalculator',{
    extend: 'Rally.data.lookback.calculator.TimeSeriesCalculator',

    // constructor: function(config) {
    //     this.mergeConfig(config);
    //     this.callParent(arguments);
    // },
    runCalculation: function (snapshots) {
        var calculatorConfig = this._prepareCalculatorConfig(),
            seriesConfig = this._buildSeriesConfig(calculatorConfig);

        var calculator = this.prepareCalculator(calculatorConfig);
        calculator.addSnapshots(snapshots, this._getStartDate(snapshots), this._getEndDate(snapshots));

        return this._transformLumenizeDataToHighchartsSeries(calculator, seriesConfig);
    },
    _getTypes: function(){
        var typeHierarchy = [];
        if (this.showStories){
            typeHierarchy.push('HierarchicalRequirement');
        }
        if (this.showDefects){
            typeHierarchy.push('Defect');
        }
        return typeHierarchy;
    },
    getDerivedFieldsOnInput: function() {
        var completedScheduleStateNames = this.completedScheduleStateNames,
            usePoints = this.usePoints;

        var fields = [
            {
                "as": "Planned",
                "f": function(snapshot) {
                    if (snapshot.ScheduleState){ //We've added this to weed out the portfolio items for the count
                        if (usePoints){
                            return snapshot.PlanEstimate || 0;
                        } else {
                            return 1;
                        }
                    }
                    return 0;
                }
            }];

        var typeHierarchy = this._getTypes();

        Ext.Array.each(completedScheduleStateNames, function(ss){
            Ext.Array.each(typeHierarchy, function(t){
                fields.push({
                    "as": ss + t,
                    "f": function(snapshot) {

                        if (Ext.Array.contains(snapshot._TypeHierarchy, t) && snapshot.ScheduleState === ss) {
                            if (usePoints){
                                return snapshot.PlanEstimate || 0;
                            } else {
                                return 1;
                            }
                        }
                        return 0;
                    }
                });
            });
        });

        return fields;
    },
    getMetrics: function() {
        var completedScheduleStateNames = this.completedScheduleStateNames,
            metrics = [],
            typeHierarchy = this._getTypes();

        Ext.Array.each(completedScheduleStateNames, function(ss){
            Ext.Array.each(typeHierarchy, function(t){
                metrics.push({
                    "field": ss+t,
                    "f": "sum"
                });
            });
        });

        metrics = metrics.concat([{
            "field": "Planned",
            "f": "sum"
        }]);

        return metrics;
    },
    getDerivedFieldsAfterSummary: function () {

        var metrics = [],
            completedScheduleStateNames = this.completedScheduleStateNames,
            typeHierarchy = this._getTypes();

        var now = new Date(),
            endOfDayToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59,999);

      Ext.Array.each(completedScheduleStateNames, function(ss){
        Ext.Array.each(typeHierarchy, function(t){

                var fieldDisplayName = Ext.String.format("{0} ({1})",ss,t.replace('HierarchicalRequirement','User Story'));
                metrics.push({
                    "as": fieldDisplayName,
                    "f": function(snapshot, index, metrics, seriesData){

                        var point_date = Rally.util.DateTime.fromIsoString(snapshot.tick);
                        if (point_date > endOfDayToday){
                            return null;
                        }
                        return snapshot[ss + t + "_sum"];
                    },
                    "display": "column"
                });
            });
        });

        metrics.push({
              "as": "Planned",
              "f": function(snapshot, index, metrics, seriesData){
                  return snapshot.Planned_sum;
              },
              "display": "line"
          });

        return metrics;
    },
    // prepareChartData: function (stores) {
    //     var snapshots = [], ids = [];
    //
    //     Ext.Array.each(stores, function (store) {
    //         store.each(function(record){
    //             var data = record.raw;
    //             //We need to make sure the snapshots are unique so we are filtering them here.
    //             //The alternative is making a single store config that can filter both.
    //             //This approach may not be faster, but it makes the configuration code easier to read.
    //             if (!Ext.Array.contains(ids, data._id)){
    //                 ids.push(data._id);
    //                 snapshots.push(data);
    //             }
    //         });
    //     });
    //     return this.runCalculation(snapshots);
    // },
    _buildSeriesConfig: function (calculatorConfig) {
        var aggregationConfig = [],
            derivedFieldsAfterSummary = calculatorConfig.deriveFieldsAfterSummary;

        for (var j = 0, jlength = derivedFieldsAfterSummary.length; j < jlength; j += 1) {
            var derivedField = derivedFieldsAfterSummary[j];
            aggregationConfig.push({
                name: derivedField.as,
                type: derivedField.display,
                dashStyle: derivedField.dashStyle || "Solid"
            });
        }

        return aggregationConfig;
    }
});
