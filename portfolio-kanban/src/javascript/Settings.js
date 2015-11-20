Ext.define('Rally.technicalservices.Settings', {
    singleton: true,
    requires: [
        'Rally.ui.combobox.FieldComboBox',
        'Rally.ui.combobox.ComboBox',
        'Rally.ui.CheckboxField'
    ],

    getFields: function (context, config, modelNames) {
        var filters = [{property: 'TypePath', operator: 'contains', value: 'PortfolioItem/'},{
                property: 'Ordinal',
                operator: '>',
                value: 0
            }],
            useSelector = config.showScopeSelector === true || config.showScopeSelector === "true",
            labelWidth= 150;

        return [{
            name: 'showScopeSelector',
            xtype: 'rallycheckboxfield',
            fieldLabel: 'Show Scope Selector',
            bubbleEvents: ['change'],
            labelWidth: labelWidth,
            labelAlign: 'right',
            labelCls: 'settingsLabel'
        },{
            name: 'selectorType',
            xtype: 'rallycombobox',
            allowBlank: false,
            autoSelect: false,
            shouldRespondToScopeChange: true,
            fieldLabel: '      Selector Type',
            labelCls: 'settingsSubLabel',
            labelAlign: 'right',
            context: context,
            labelWidth: labelWidth,
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
            disabled: !useSelector,
            handlesEvents: {
                change: function (chk) {
                    this.setDisabled(chk.getValue() !== true);
                }
            }
        },{
            name: 'groupHorizontallyByField',
            xtype: 'rowsettingsfield',
            fieldLabel: 'Swimlanes',
            margin: '10 0 10 0',
            mapsToMultiplePreferenceKeys: ['showRows', 'rowsField'],
            readyEvent: 'ready',
            labelWidth: labelWidth,
            whiteListFields: ['Parent'],
            modelNames: modelNames,
            isAllowedFieldFn: function (field) {
                var attr = field.attributeDefinition;
                return (attr.Custom && (attr.Constrained || attr.AttributeType.toLowerCase() !== 'string') ||
                    attr.Constrained || _.contains(['boolean'], attr.AttributeType.toLowerCase())) &&
                    !_.contains(['web_link', 'text', 'date'], attr.AttributeType.toLowerCase()) &&
                    !_.contains(['Archived', 'Portfolio Item Type', 'State'], attr.Name);
            }
        },{
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