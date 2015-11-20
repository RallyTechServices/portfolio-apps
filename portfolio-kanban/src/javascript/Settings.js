Ext.define('Rally.technicalservices.Settings', {
    singleton: true,
    requires: [
        'Rally.ui.combobox.FieldComboBox',
        'Rally.ui.combobox.ComboBox',
        'Rally.ui.CheckboxField'
    ],

    getFields: function (context, modelNames) {

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
                    sorters: [{property: 'DisplayName'}],
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
                    change: function (chk) {
                        this.setDisabled(chk.getValue() !== true);
                    }
                }
            },
            {
                name: 'groupHorizontallyByField',
                xtype: 'rowsettingsfield',
                fieldLabel: 'Swimlanes',
                margin: '10 0 10 0',
                mapsToMultiplePreferenceKeys: ['showRows', 'rowsField'],
                readyEvent: 'ready',
                whiteListFields: ['Parent'],
                modelNames: modelNames,
                isAllowedFieldFn: function (field) {
                    var attr = field.attributeDefinition;
                    return (attr.Custom && (attr.Constrained || attr.AttributeType.toLowerCase() !== 'string') ||
                        attr.Constrained || _.contains(['boolean'], attr.AttributeType.toLowerCase())) && !_.contains(['web_link', 'text', 'date'], attr.AttributeType.toLowerCase()) && !_.contains(['Archived', 'Portfolio Item Type', 'State'], attr.Name);
                }
            },
            {
                type: 'query',
                config: {
                    plugins: [
                        {
                            ptype: 'rallyhelpfield',
                            helpId: 271
                        },
                        'rallyfieldvalidationui'
                    ]
                }
            }];
    }
});