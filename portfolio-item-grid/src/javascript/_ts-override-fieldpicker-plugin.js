Ext.override(Rally.ui.gridboard.plugin.GridBoardFieldPicker,{
    
    // add ability to override the properties of the popover, mostly so we can do height
    _getPopoverConfig: function() {
        return this.popoverConfig || {};
    },
    
    
    _createPopover: function(popoverTarget) {
        this.popover = Ext.create('Rally.ui.popover.Popover', 
            _.extend({
                target: popoverTarget,
                placement: ['bottom', 'left', 'top', 'right'],
                cls: 'field-picker-popover',
                toFront: Ext.emptyFn,
                buttonAlign: 'center',
                title: this.getTitle(),
                listeners: {
                    destroy: function () {
                        this.popover = null;
                    },
                    scope: this
                },
                buttons: [
                    {
                        xtype: "rallybutton",
                        text: 'Apply',
                        cls: 'field-picker-apply-btn primary rly-small',
                        listeners: {
                            click: function() {
                                this._onApply(this.popover);
                            },
                            scope: this
                        }
                    },
                    {
                        xtype: "rallybutton",
                        text: 'Cancel',
                        cls: 'field-picker-cancel-btn secondary dark rly-small',
                        listeners: {
                            click: function() {
                                this.popover.close();
                            },
                            scope: this
                        }
                    }
                ],
                items: [
                    _.extend({
                        xtype: 'rallyfieldpicker',
                        cls: 'field-picker',
                        itemId: 'fieldpicker',
                        modelTypes: this._getModelTypes(),
                        alwaysExpanded: true,
                        width: 200,
                        placeholderText: 'Search',
                        selectedTextLabel: 'Selected',
                        availableTextLabel: 'Available',
                        listeners: {
                            specialkey: function(field, e) {
                                if (e.getKey() === e.ESC) {
                                    this.popover.close();
                                }
                            },
                            scope: this
                        }
                    }, this._getPickerConfig())
                ]
            }, this._getPopoverConfig())
        );
    }
});