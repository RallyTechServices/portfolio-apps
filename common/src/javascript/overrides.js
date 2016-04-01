Ext.override(Ext.util.Filter,{
    createFilterFn: function() {
        var me       = this,
            matcher  = me.createValueMatcher();
        
        var property = me.property;
        
        if ( !Ext.isArray(me.property) && /,/.test(me.property) ) {
            property = me.property.split(',');
        }
        
        return function(item) {
            var hasmatch = false;
            for(var i=0;i<property.length;i++) {
                if(matcher.test(me.getRoot.call(me, item)[property[i]])) {
                    hasmatch=true;
                    break;
                }
            }
            return matcher === null ? value === null : hasmatch;
        };
    }
});


Ext.override(Rally.ui.combobox.ComboBox, {

    doLocalQuery: function(queryPlan) {
        var me = this,
            queryString = queryPlan.query;

        // Create our filter when first needed
        if (!me.queryFilter) {
            // Create the filter that we will use during typing to filter the Store
            me.queryFilter = new Ext.util.Filter({
                id: me.id + '-query-filter',
                anyMatch: true,
                caseSensitive: false,
                root: 'data',
                property: me.filterProperties
            });
                        
            me.store.addFilter(me.queryFilter, false);
        }

        // Querying by a string...
        if (queryString || !queryPlan.forceAll) {
            me.queryFilter.disabled = false;
            me.queryFilter.setValue(me.enableRegEx ? new RegExp(queryString) : queryString);
        }

        // If forceAll being used, or no query string, disable the filter
        else {
            me.queryFilter.disabled = true;
        }

        // Filter the Store according to the updated filter
        me.store.filter();

        // Expand after adjusting the filter unless there are no matches
        if (me.store.getCount()) {
            me.expand();
        } else {
            me.collapse();
        }

        me.afterQuery(queryPlan);
    }
});


Ext.define('Rally.technicalservices.PortfolioParentComboBox',{
    extend: 'Rally.ui.combobox.FieldValueComboBox',
    _loadStoreValues: function() {
        this.field.getAllowedValueStore().load({
            requester: this,
            callback: function(records, operation, success) {
                var store = this.store;
                if (!store) {
                    return;
                }
                var noEntryValues = [],
                    labelValues = _.map(
                        _.filter(records, this._hasStringValue),
                        this._convertAllowedValueToLabelValuePair,
                        this
                    );

                if(this.field.getType() === 'boolean') {
                    labelValues = labelValues.concat([
                        this._convertToLabelValuePair('Yes', true),
                        this._convertToLabelValuePair('No', false)
                    ]);
                } else if (this.field.required === false) {
                    var name = "-- No Entry --",
                        value = "";
                    if (this.getUseNullForNoEntryValue()) {
                        value = null;
                    }
                    if (this.field.attributeDefinition.AttributeType.toLowerCase() === 'rating') {
                        name = this.getRatingNoEntryString();
                        value = "None";
                    }
                    noEntryValues.push(this._convertToLabelValuePair(name, value));
                }

                store.loadRawData(noEntryValues.concat(labelValues));
                store.fireEvent('load', store, store.getRange(), success);
            },
            scope: this
        });
    },

    _hasStringValue: function(allowedValueObject) {
        return allowedValueObject.get('StringValue') !== "";
    }
});
