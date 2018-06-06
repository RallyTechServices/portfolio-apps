Ext.define('CArABU.apps.portfolio-apps.PortfolioBurnupChart',{
    extend: 'Rally.ui.chart.Chart',
    alias: 'widget.portfolioburnup',
    config: {
      storeType: 'Rally.data.lookback.SnapshotStore',

      calculatorType: 'CArABU.apps.portfolio-apps.PortfolioBurnupCalculator',

       chartConfig: {
          chart: {
            defaultSeriesType: 'area',
            zoomType: 'xy'
          },
          title: {
              style: {
                  color: '#666',
                  fontSize: '18px',
                  fontFamily: 'ProximaNova',
                  fill: '#666'
              }
          },
          xAxis: {
              categories: [],
              tickmarkPlacement: 'on',
              title: {
                  text: 'Date',
                  margin: 10,
                  style: {
                      color: '#444',
                      fontFamily:'ProximaNova',
                      textTransform: 'uppercase',
                      fill:'#444'
                  }
              },
              labels: {
                  style: {
                      color: '#444',
                      fontFamily:'ProximaNova',
                      textTransform: 'uppercase',
                      fill:'#444'
                  },
                  formatter: function(){
                      var d = new Date(this.value);
                      return Rally.util.DateTime.format(d, 'm/d/Y');
                  }
              },
              tickPositioner: function () {
                  var positions = [],
                      tick = Math.floor(this.dataMin),
                      increment = Math.ceil((this.dataMax - this.dataMin) / 6);

                  if (this.dataMax !== null && this.dataMin !== null) {
                      for (tick; tick - increment <= this.dataMax; tick += increment) {
                          positions.push(tick);
                      }
                  }
                  return positions;
              }
            },
            yAxis: [
                {
                    title: {
                        text: "",
                        style: {
                            color: '#444',
                            fontFamily:'ProximaNova',
                            textTransform: 'uppercase',
                            fill:'#444'
                        }
                    },
                    labels: {
                        style: {
                            color: '#444',
                            fontFamily:'ProximaNova',
                            textTransform: 'uppercase',
                            fill:'#444'
                        }
                    },
                    min: 0
                }
            ],
            legend: {
                itemStyle: {
                        color: '#444',
                        fontFamily:'ProximaNova',
                        textTransform: 'uppercase'
                },
                borderWidth: 0
            },
            tooltip: {

                backgroundColor: '#444',
                headerFormat: '<span style="display:block;margin:0;padding:0 0 2px 0;text-align:center"><b style="font-family:NotoSansBold;color:#FFF;">{point.key}</b></span><table><tbody>',
                footerFormat: '</tbody></table>',
                pointFormat: '<tr><td class="tooltip-label"><span style="color:{series.color};width=100px;">\u25CF</span> {series.name}</td><td class="tooltip-point">{point.y}</td></tr>',
                shared: true,
                useHTML: true,
                borderColor: '#444'
            },
            plotOptions: {
                series: {
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                enabled: true
                            }
                        }
                    },
                    groupPadding: 0.01
                },
                column: {
                    stacking: true,
                    shadow: false
                }
            }
        }
    },

    constructor: function(config) {
         this.mergeConfig(config);
         this.callParent(arguments);
     }


});
