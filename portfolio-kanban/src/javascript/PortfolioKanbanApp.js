(function () {
    var Ext = window.Ext4 || window.Ext;

    /**
     * PI Kanban Board App
     * Displays a cardboard and a type selector. Board shows States for the selected Type.
     */
    Ext.define('portfolio-kanban', {
        extend: 'Rally.app.App',

        appName: 'Portfolio Kanban',
        autoScroll: false,
        cls: 'portfolio-kanban',
        statePrefix: 'portfolio-kanban',
        toggleState: 'board',
        settingsScope: 'project',

        config: {
            defaultSettings: {
                fields: 'Discussion,PercentDoneByStoryCount,UserStories,Milestones'
            }
        },

        mixins: [
            "Rally.clientmetrics.ClientMetricsRecordable"
        ],

        clientMetrics: [
            {
                method: '_showHelp',
                description: 'portfolio-kanban-show-help'
            }
        ],

        plugins: ['rallygridboardappresizer'],

        actionMenuItems: [],

        enableGridBoardToggle: false,
        enableAddNew: true,
        gridConfig: {},
        gridStoreConfig: {},
        addNewConfig: {},
        enableImport: true,
        enableCsvExport: true,
        enablePrint: true,
        enableRanking: true,
        isWorkspaceScoped: false,
        modelNames: [],
        modelsContext: null,
        printHeaderLabel: '',
        allowExpansionStateToBeSaved: true,
        initEvents: function() {
            this.callParent(arguments);
            this.addEvents(
                /**
                 * @event
                 * Fires after a gridboard has been added to the app.
                 * @param {Rally.ui.gridboard.GridBoard} gridboard
                 */
                'gridboardadded'
            );
        },
        constructor: function(config) {
            config.settingsScope = config.isFullPageApp ? 'project' : 'app';
            config.piTypePickerConfig = { renderInGridHeader: !config.isFullPageApp };
            var defaultConfig = {
                piTypePickerConfig: {
                    renderInGridHeader: false
                }
            };
            this.callParent([Ext.Object.merge(defaultConfig, config)]);
        },
        initComponent: function(){
            this.callParent(arguments);
            this.addCls('portfolio-items-grid-board-app');
        },
        launch: function () {
            if (Rally.environment.getContext().getSubscription().isModuleEnabled('Rally Portfolio Manager')) {
                console.log('launch');
                this._loadGridBoardPreference();
                this.loadModelNames().then({
                    success: function (modelNames) {

                        this.modelNames = modelNames;
                        if(!this.rendered) {
                            this.on('afterrender', this.loadGridBoard, this, {single: true});
                        } else {
                            this.loadGridBoard();
                        }
                    },
                    scope: this
                });
            } else {
                this.add({
                    xtype: 'container',
                    html: '<div class="rpm-turned-off" style="padding: 50px; text-align: center;">You do not have RPM enabled for your subscription</div>'
                });

                this.publishComponentReady();
            }
        },
        _loadGridBoardPreference: function(){
            var gridboardPrefs = this.getSetting(this.getStateId('gridboard'));
            if (gridboardPrefs) {
                gridboardPrefs = Ext.JSON.decode(gridboardPrefs);
                this.toggleState = gridboardPrefs.toggleState || this.toggleState;
            }
        },
        loadModelNames: function () {
            return this._createPITypePicker().then({
                success: function (selectedType) {
                    this.currentType = selectedType;
                    return [selectedType.get('TypePath')];
                },
                scope: this
            });
        },
        loadGridBoard: function () {
            return Rally.data.ModelFactory.getModels({
                context: this.modelsContext || this.getContext(),
                types: this.modelNames,
                requester: this
            }).then({
                success: function (models) {
                    this.models = _.transform(models, function (result, value) {
                        result.push(value);
                    }, []);

                    this.modelNames = _.keys(models);

                    if (this.toggleState === 'grid') {
                        return this.getGridStores().then({
                            success: function (stores) {
                                this.addGridBoard(stores);
                            },
                            scope: this
                        });
                    } else if(this.toggleState === 'board') {
                        return this.getCardBoardColumns().then({
                            success: function (columns) {
                                this.addGridBoard({
                                    columns: columns
                                });

                                if (!columns || columns.length === 0) {
                                    this.showNoColumns();
                                    this.publishComponentReady();
                                }
                            },
                            scope: this
                        });
                    } else {
                        this.addGridBoard();
                        this.publishComponentReady();
                    }
                },
                scope: this
            });
        },
        showNoColumns: function () {
            this.add({
                xtype: 'container',
                cls: 'no-type-text',
                html: '<p>This Type has no states defined.</p>'
            });
        },
        getCardBoardColumns: function () {
            return this._getStates().then({
                success: function (states) {
                    return this._buildColumns(states);
                },
                scope: this
            });
        },
        _buildColumns: function (states) {
            if (!states.length) {
                return undefined;
            }

            var columns = [
                {
                    columnHeaderConfig: {
                        headerTpl: 'No Entry'
                    },
                    value: null,
                    plugins: ['rallycardboardcollapsiblecolumns'].concat(this.getCardBoardColumnPlugins(null))
                }
            ];

            return columns.concat(_.map(states, function (state) {
                return {
                    value: state.get('_ref'),
                    wipLimit: state.get('WIPLimit'),
                    enableWipLimit: true,
                    columnHeaderConfig: {
                        record: state,
                        fieldToDisplay: 'Name',
                        editable: false
                    },
                    plugins: ['rallycardboardcollapsiblecolumns'].concat(this.getCardBoardColumnPlugins(state))
                };
            }, this));
        },
        _getStates: function () {
            var deferred = new Deft.Deferred();
            Ext.create('Rally.data.wsapi.Store', {
                model: Ext.identityFn('State'),
                context: this.getContext().getDataContext(),
                autoLoad: true,
                fetch: ['Name', 'WIPLimit', 'Description'],
                filters: [
                    {
                        property: 'TypeDef',
                        value: this.currentType.get('_ref')
                    },
                    {
                        property: 'Enabled',
                        value: true
                    }
                ],
                sorters: [
                    {
                        property: 'OrderIndex',
                        direction: 'ASC'
                    }
                ],
                listeners: {
                    load: function (store, records) {
                        deferred.resolve(records);
                    }
                }
            });
            return deferred.promise;
        },
        getSettingsFields: function () {
            return [{
                name: 'groupHorizontallyByField',
                xtype: 'rowsettingsfield',
                fieldLabel: 'Swimlanes',
                margin: '10 0 10 0',
                mapsToMultiplePreferenceKeys: ['showRows', 'rowsField'],
                readyEvent: 'ready',
                whiteListFields: ['Parent'],
                modelNames: this.piTypePicker.getAllTypeNames(),
                isAllowedFieldFn: function (field) {
                    var attr = field.attributeDefinition;
                    return (attr.Custom && (attr.Constrained || attr.AttributeType.toLowerCase() !== 'string') ||
                        attr.Constrained || _.contains(['boolean'], attr.AttributeType.toLowerCase())) &&
                        !_.contains(['web_link', 'text', 'date'], attr.AttributeType.toLowerCase()) &&
                        !_.contains(['Archived', 'Portfolio Item Type', 'State'], attr.Name);
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
        },
        getGridStoreConfig: function () {
            return _.merge({}, this.gridStoreConfig, { models: this.piTypePicker.getAllTypeNames() });
        },

        _createPITypePicker: function () {
            if (this.piTypePicker && this.piTypePicker.destroy) {
                this.piTypePicker.destroy();
            }
            var deferred = new Deft.Deferred();
            var piTypePickerConfig = {
                preferenceName: this.getStateId('typepicker'),
                fieldLabel: '', // delete this when removing PORTFOLIO_ITEM_TREE_GRID_PAGE_OPT_IN toggle. Can't delete these from PI Combobox right now or GUI tests fail in old PI page
                labelWidth: 0,  // delete this when removing PORTFOLIO_ITEM_TREE_GRID_PAGE_OPT_IN toggle. Can't delete these from PI Combobox right now or GUI tests fail in old PI page
                value: this.getSetting('type'),
                context: this.getContext(),
                listeners: {
                    change: this._onTypeChange,
                    ready: {
                        fn: function (picker) {
                            deferred.resolve(picker.getSelectedType());
                        },
                        single: true
                    },
                    scope: this
                }
            };

            if(!this.config.piTypePickerConfig.renderInGridHeader){
                piTypePickerConfig.renderTo = Ext.query('#content .titlebar .dashboard-timebox-container')[0];
            }

            this.piTypePicker = Ext.create('Rally.ui.combobox.PortfolioItemTypeComboBox', piTypePickerConfig);

            if(this.config.piTypePickerConfig.renderInGridHeader){
                this.on('gridboardadded', function() {
                    var headerContainer = this.gridboard.getHeader().getLeft();
                    headerContainer.add(this.piTypePicker);
                });
            }

            return deferred.promise;
        },
        _onTypeChange: function (picker) {
            var newType = picker.getSelectedType();

            if (this._pickerTypeChanged(picker)) {
                this.currentType = newType;
                this.modelNames = [newType.get('TypePath')];
                this.gridboard.fireEvent('modeltypeschange', this.gridboard, [newType]);
            }
        },
        _createFilterItem: function(typeName, config) {
            return Ext.apply({
                xtype: typeName,
                margin: '-15 0 5 0',
                showPills: true,
                showClear: true
            }, config);
        },

        addGridBoard: function(options){
            if (this.gridboard && this.piTypePicker && this.piTypePicker.rendered) {
                var parent = this.piTypePicker.up();
                if(parent && parent.remove){
                    parent.remove(this.piTypePicker, false);
                }
            }

            if (this.gridboard) {
                this.gridboard.destroy();
            }

            this.gridboard = Ext.create('Rally.ui.gridboard.GridBoard', this.getGridBoardConfig(options));
            this.gridboard.on('modeltypeschange', this.onTypesChange, this);
            this.gridboard.on('toggle', this._onGridBoardToggle, this);
            this.gridboard.on('filtertypeschange', this.onFilterTypesChange, this);

            this.add(this.gridboard);

            this.fireEvent('gridboardadded', this.gridboard);

            this.gridboard.getHeader().getRight().add([
                this._buildHelpComponent(),
                this._buildFilterInfo()
            ]);
        },
        _onGridBoardToggle: function (toggleState, gridOrBoard) {
            this.toggleState = toggleState;

            if (!gridOrBoard) {
                this.loadGridBoard();
            }
        },
        onTypesChange: function (gridboard, newTypes) {
            this.modelNames = _.map(newTypes, function (type) {
                return type.isModel ? type.get('TypePath') : type;
            });
            this.loadGridBoard();
        },
        getGridBoardPlugins: function () {

            return []
                .concat(this.enableAddNew ? [
                    {
                        ptype: 'rallygridboardaddnew',
                        context: this.getContext(),
                        addNewControlConfig: this.getAddNewConfig()
                    }
                ] : [])
                .concat([
                    _.merge({
                        ptype: 'rallygridboardcustomfiltercontrol',
                        containerConfig: {
                            width: 42
                        },
                        filterChildren: false,
                        filterControlConfig: _.merge({
                            margin: '3 9 3 0',
                            modelNames: this.modelNames,
                            stateful: true,
                            stateId: this.getScopedStateId('custom-filter-button')
                        }, this.getFilterControlConfig()),
                        ownerFilterControlConfig: {
                            stateful: true,
                            stateId: this.getScopedStateId('owner-filter')
                        },
                        showOwnerFilter: Rally.data.ModelTypes.areArtifacts(this.modelNames)
                    }, this.getGridBoardCustomFilterControlConfig()),
                    _.merge({
                        ptype: 'rallygridboardfieldpicker',
                        headerPosition: 'left'
                    }, this.getFieldPickerConfig())
                ])
                .concat(this.enableGridBoardToggle ? this.getGridBoardTogglePluginConfig() : [])
                .concat(this.getActionsMenuConfig())
                .concat([{
                    ptype: 'rallyboardpolicydisplayable',
                    pluginId: 'boardPolicyDisplayable',
                    prefKey: 'piKanbanPolicyChecked',
                    checkboxConfig: {
                        boxLabel: 'Show Policies',
                        margin: '2 5 5 5'
                    }
                }]);
        },
        getGridBoardTogglePluginConfig: function () {
            return {
                ptype: 'rallygridboardtoggleable'
            };
        },
        getFilterControlConfig: function () {
            var config = {
                    blackListFields: ['PortfolioItemType'],
                    whiteListFields: ['Milestones']
                };

            return _.merge(config, {
                blackListFields: _.union(config.blackListFields, ['State'])
            });
        },
        getFieldPickerConfig: function () {
            var config = {
                gridFieldBlackList: Rally.ui.grid.FieldColumnFactory.getBlackListedFieldsForTypes(this.modelNames),
                boardFieldBlackList: [
                    'AcceptedLeafStoryCount',
                    'AcceptedLeafStoryPlanEstimateTotal',
                    'Blocker',
                    'DirectChildrenCount',
                    'LastUpdateDate',
                    'LeafStoryCount',
                    'LeafStoryPlanEstimateTotal',
                    'PortfolioItem',
                    'UnEstimatedLeafStoryCount'
                ],
                context: this.getContext()
            };

            return _.merge(config, {
                boardFieldBlackList: ['Predecessors', 'Successors'],
                margin: '3 9 14 0'
            });
        },
        getCardConfig: function () {
            return {
                xtype: 'rallyportfoliokanbancard'
            };
        },
        getCardBoardConfig: function (options) {
            options = options || {};
            var currentTypePath = this.currentType.get('TypePath');
            var filters = [];

            if (this.getSetting('query')) {
                try {
                    filters.push(Rally.data.QueryFilter.fromQueryString(this.getSetting('query')));
                } catch (e) {
                    Rally.ui.notify.Notifier.showError({ message: e.message });
                }
            }

            var config = {
                attribute: 'State',
                cardConfig: _.merge({
                    editable: true,
                    showColorIcon: true
                }, this.getCardConfig()),
                columnConfig: {
                    xtype: 'rallycardboardcolumn',
                    enableWipLimit: true,
                    fields: (this.getSetting('fields') || '').split(',')
                },
                columns: options.columns,
                ddGroup: currentTypePath,
                listeners: {
                    load: this.publishComponentReady,
                    cardupdated: this._publishContentUpdatedNoDashboardLayout,
                    scope: this
                },
                plugins: [{ ptype: 'rallyfixedheadercardboard' }],
                storeConfig: {
                    filters: filters,
                    context: this.getContext().getDataContext()
                },
                loadDescription: 'Portfolio Kanban'
            };

            if (this.getSetting('showRows') && this.getSetting('rowsField')) {
                Ext.apply(config, {
                    rowConfig: {
                        field: this.getSetting('rowsField'),
                        sortDirection: 'ASC'
                    }
                });
            }

            return config;
        },

        getCardBoardColumnPlugins: function (state) {
            var policyPlugin = this.gridboard && this.gridboard.getPlugin('boardPolicyDisplayable');
            return {
                ptype: 'rallycolumnpolicy',
                policyCmpConfig: {
                    xtype: 'rallyportfoliokanbanpolicy',
                    hidden: !policyPlugin || !policyPlugin.isChecked(),
                    title: 'Exit Policy',
                    stateRecord: state
                }
            };
        },

        publishComponentReady: function () {
            this.fireEvent('contentupdated', this);
            this.recordComponentReady();

            if (Rally.BrowserTest) {
                Rally.BrowserTest.publishComponentReady(this);
            }
            Rally.environment.getMessageBus().publish(Rally.Message.piKanbanBoardReady);
        },

        _buildHelpComponent: function (config) {
            return this.isFullPageApp ? null : Ext.create('Ext.Component', Ext.apply({
                cls: 'help-field ' + Rally.util.Test.toBrowserTestCssClass('portfolio-kanban-help-container'),
                renderTpl: Rally.util.Help.getIcon({
                    id: 265
                })
            }, config));
        },

        _buildFilterInfo: function () {
            this.filterInfo = this.isFullPageApp ? null : Ext.create('Rally.ui.tooltip.FilterInfo', {
                projectName: this.getSetting('project') && this.getContext().get('project').Name || 'Following Global Project Setting',
                scopeUp: this.getSetting('projectScopeUp'),
                scopeDown: this.getSetting('projectScopeDown'),
                query: this.getSetting('query')
            });

            return this.filterInfo;
        },
        _pickerTypeChanged: function(picker){
            var newType = picker.getSelectedType();
            return newType && this.currentType && newType.get('_ref') !== this.currentType.get('_ref');
        },

        _publishContentUpdatedNoDashboardLayout: function () {
            this.fireEvent('contentupdated', { dashboardLayout: false });
        },

        onDestroy: function() {
            this.callParent(arguments);
            if(this.piTypePicker) {
                this.piTypePicker.destroy();
                delete this.piTypePicker;
            }
        },
        getGridStores: function () {
            return this._getTreeGridStore();
        },

        _getTreeGridStore: function () {
            return Ext.create('Rally.data.wsapi.TreeStoreBuilder').build(_.merge({
                autoLoad: false,
                childPageSizeEnabled: true,
                context: this._getGridBoardContext().getDataContext(),
                enableHierarchy: true,
                fetch: _.union(['Workspace'], this.columnNames),
                models: _.clone(this.models),
                pageSize: 25,
                remoteSort: true,
                root: {expanded: true}
            }, this.getGridStoreConfig())).then({
                success: function (treeGridStore) {
                    treeGridStore.on('load', this._fireTreeGridReady, this, { single: true });
                    return { gridStore: treeGridStore };
                },
                scope: this
            });
        },

        _fireTreeGridReady: function () {
            var grid = this.gridboard && this.gridboard.getToggleState() === 'grid' && this.gridboard.getGridOrBoard();

            if (grid) {
                this.onTreeGridReady(grid);
            } else {
                this.on('gridboardadded', this._fireTreeGridReady, this, { single: true });
            }
        },

        onTreeGridReady: function (grid) {
            this.publishComponentReady();
        },
        getGridStoreConfig: function () {
            return this.gridStoreConfig || {};
        },

        getGridBoardConfig: function (options) {
            return {
                itemId: 'gridboard',
                stateId: this.getStateId('gridboard'),
                toggleState: this.toggleState,
                modelNames: _.clone(this.modelNames),
                context: this._getGridBoardContext(),
                addNewPluginConfig: this.getAddNewConfig(),
                plugins: this.getGridBoardPlugins(options),
                cardBoardConfig: this.getCardBoardConfig(options),
                chartConfig: this.getChartConfig(),
                gridConfig: this.getGridConfig(options),
                height: this.getHeight()
            };
        },

        getStateId: function (suffix) {
            return this.statePrefix + (suffix ? '-' + suffix : '');
        },

        getScopedStateId: function (suffix) {
            return this.getContext().getScopedStateId(this.getStateId(suffix));
        },
        getChartConfig: function () {
            return {};
        },

        onFilterTypesChange: function() {},

        _shouldEnableRanking: function() {
            return this.enableRanking && Rally.data.ModelTypes.areArtifacts(this.modelNames) && this.getContext().getWorkspace().WorkspaceConfiguration.DragDropRankingEnabled;
        },
        getGridConfig: function (options) {
            var config = {
                xtype: 'rallytreegrid',
                alwaysShowDefaultColumns: false,
                bufferedRenderer: true,
                columnCfgs: this.getColumnCfgs(),
                enableBulkEdit: true,
                allowExpansionStateToBeSaved: this.allowExpansionStateToBeSaved,
                enableInlineAdd: Rally.data.ModelTypes.areArtifacts(this.modelNames),
                enableRanking: this._shouldEnableRanking(),
                enableSummaryRow: Rally.data.ModelTypes.areArtifacts(this.modelNames),
                expandAllInColumnHeaderEnabled: true,
                plugins: this.getGridPlugins(),
                stateId: this.getScopedStateId('grid'),
                stateful: true,
                store: options && options.gridStore,
                storeConfig: {
                    filters: this.getPermanentFilters()
                }
            };

            if (this.modelNames.length === 1 && !Rally.data.ModelTypes.isArtifact(this.modelNames[0])) {
                config.noDataItemName = this.modelNames[0].toLowerCase();
            }

            return _.merge( config, this.gridConfig );
        },
        getPermanentFilters: function() {
            return [];
        },

        getColumnCfgs: function() {
            return _.isEmpty(this.columnNames) ? Rally.ui.grid.FieldColumnFactory.getDefaultFieldsForTypes(this.modelNames) : this.columnNames;
        },

        getGridPlugins: function () {
            return [{
                ptype: 'rallytreegridexpandedrowpersistence',
                allowExpansionStateToBeSaved: this.allowExpansionStateToBeSaved
            }];
        },
        getActionsMenuConfig: function () {
            var importItems = this._getImportItems();
            var printItems = this._getPrintItems();
            var exportItems = this._getExportItems();

            var tooltipTypes = []
                .concat(importItems.length ? 'Import' : [])
                .concat(exportItems.length ? 'Export' : [])
                .concat(printItems.length ? 'Print' : []);

            var menuItems = this.actionMenuItems.concat(importItems, exportItems, printItems);

            return tooltipTypes.length === 0 || this.toggleState === 'board' ? [] : [{
                ptype: 'rallygridboardactionsmenu',
                menuItems: menuItems,
                buttonConfig: {
                    disabled: this.toggleState !== 'grid',
                    iconCls: 'icon-export',
                    toolTipConfig: {
                        html: tooltipTypes.join('/'),
                        anchor: 'top',
                        hideDelay: 0
                    }
                }
            }];
        },

        _getGridBoardContext: function () {
            return this.isWorkspaceScoped ? this.getContext().clone({ project: null }) : this.getContext();
        },

        _getImportItems: function () {
            if (!this.enableImport) {
                return [];
            }

            var piTypesExist = _.any(this.models, function (model) { return model.isPortfolioItem(); });

            var importableTypes = _(this.models).filter(function (model) {
                return !model.isPortfolioItem() && model.isImportable();
            }, this).map(function (model) {
                return { typePath: model.typePath, displayName: model.displayName };
            }).concat(piTypesExist ? [{ typePath: 'PortfolioItem', displayName: 'Portfolio Item'}] : []).sortBy('displayName').value();

            return _.map(importableTypes, function (type) {
                var displayName = Ext.util.Inflector.pluralize(type.displayName);
                return  {
                    text: 'Import ' + displayName + '...',
                    handler: function() {
                        Ext.widget({
                            xtype: 'rallycsvimportdialog',
                            type: type.typePath,
                            title: 'Import ' + displayName
                        });
                    }
                };
            }, this);
        },

        _getExportItems: function() {
            var exportItems = [];

            if(this.enableCsvExport) {
                exportItems.push({
                    text: 'Export to CSV...',
                    handler: function() {
                        window.location = Rally.ui.gridboard.Export.buildCsvExportUrl(this.gridboard.getGridOrBoard());
                    },
                    scope: this
                });
            }
            if(this.xmlExportEnabled()) {
                exportItems.push({
                    text: 'Export to XML...',
                    handler: function() {
                        window.location = Rally.ui.gridboard.Export.buildXmlExportUrl(this.gridboard.getGridOrBoard());
                    },
                    scope: this
                });
            }

            return exportItems;
        },

        _getPrintItems: function() {
            return !this.enablePrint || this.toggleState === 'chart' ? [] : [{
                text: 'Print ...',
                handler: function() {
                    Ext.create('Rally.ui.grid.TreeGridPrintDialog', {
                        grid: this.gridboard.getGridOrBoard(),
                        treeGridPrinterConfig: {
                            largeHeaderText: this.printHeaderLabel
                        }
                    });
                },
                scope: this
            }];
        },
        getAddNewConfig: function () {
            return _.merge({
                context: this.getContext(),
                margin: '0 30 0 0',
                stateful: true,
                stateId: this.getScopedStateId('add-new')
            }, this.addNewConfig);
        },
        getGridBoardCustomFilterControlConfig: function () {
            return {};
        },
        getHeight: function () {
            var height = this.callParent(arguments);
            return Ext.isIE8 ? Math.max(height, 600) : height;
        },

        setHeight: function(height) {
            this.callParent(arguments);
            if(this.gridboard) {
                this.gridboard.setHeight(height);
            }
        },

        xmlExportEnabled: function(){
            return false;
        }
    });
})();