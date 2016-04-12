(function () {
    var Ext = window.Ext4 || window.Ext;

    Ext.define('Rally.technicalservices.PortfolioItemTimelineSettings', {
        singleton: true,
        requires: [
            'Rally.ui.combobox.FieldComboBox',
            'Rally.ui.combobox.ComboBox',
            'Rally.ui.CheckboxField'
        ],

        getFields: function (context, settings) {
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
                },
                {
                    name: 'type',
                    xtype: 'rallycombobox',
                    allowBlank: false,
                    autoSelect: false,
                    shouldRespondToScopeChange: true,
                    fieldLabel: 'Results Type',
                    context: context,
                    initialValue: 'HierarchicalRequirement',
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
                    listeners: {
                        setvalue: function() {
                            if ( this.getRecord() ) {
                                this.fireEvent('typeselected', this.getRecord().get('TypePath'), this.context);
                            }
                        }
                    },
                    bubbleEvents: ['typeselected'],
                    readyEvent: 'ready',
                    handlesEvents: {
                        projectscopechanged: function (context) {
                            this.refreshWithNewContext(context);
                        }
                    }
                },
                { type: 'query' }
            ];
        }
    });
})();