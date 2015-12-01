(function () {
    var Ext = window.Ext4 || window.Ext;

    var getHiddenFieldConfig = function (name) {
        return {
            name: name,
            xtype: 'rallytextfield',
            hidden: true,
            handlesEvents: {
                typeselected: function (type) {
                    this.setValue(null);
                }
            }
        };
    };

    Ext.define('Rally.technicalservices.PortfolioItemSankeyGraph', {
        singleton: true,
        requires: [
            'Rally.ui.combobox.FieldComboBox',
            'Rally.ui.combobox.ComboBox',
            'Rally.ui.CheckboxField'
        ],

        getFields: function (context) {


            var filters = [{property: 'TypePath', operator: 'contains', value: 'PortfolioItem/'}];
            return [
                {
                    name: 'showScopeSelector',
                    xtype: 'rallycheckboxfield',
                    fieldLabel: 'Show Scope Selector',
                    bubbleEvents: ['change']
                },
                {
                    name: 'selectorType',
                    xtype: 'rallycombobox',
                    allowBlank: false,
                    autoSelect: false,
                    shouldRespondToScopeChange: true,
                    fieldLabel: 'Selector Type',
                    context: context,
                    storeConfig: {
                        model: Ext.identityFn('TypeDefinition'),
                        sorters: [{ property: 'DisplayName' }],
                        fetch: ['DisplayName', 'ElementName', 'TypePath', 'Parent', 'UserListable'],
                        filters: filters,
                        autoLoad: false,
                        remoteSort: false,
                        remoteFilter: true
                    },
                    displayField: 'DisplayName',
                    valueField: 'TypePath',
                    readyEvent: 'ready',
                    handlesEvents: {
                        change: function(chk){
                            this.setDisabled(chk.getValue()!==true);
                        }
                    }
                }];
        }
    });
})();