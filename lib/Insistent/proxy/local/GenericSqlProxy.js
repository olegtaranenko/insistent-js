/**
 * Created by JetBrains WebStorm.
 */
Ext.define('Insistent.proxy.local.GenericSqlProxy', {

//     extend: 'Insistent.proxy.GenericProxy',
    requires: [
        'Insistent.system.System'
    ],

    config: {
        /**
         * Platform proxy implementation.
         * Ie. for Node environment - {@link Insistent.environment.node.proxy.Sqlite}, for browser ... another one
         * It will be used to perform real action against database or service
         */
        impl: null,

        /**
         * TODO replace with Mandate Property
         */
        ClientID: null,
        /**
         * For simple queries, where reading would enough to SELECT * FROM tableName WHERE ...
         */
        selectStar: true,
        /**
         * Table name of FROM clause. Often is being used with {@link #tableAlias} definition
         */
        tableName: null,
        /**
         * @cfg {string}
         * Sql part SELECT .... FROM ...'. Do not fill up JOIN, WHERE and other clauses here, they should be define in other config values
         */
        selectSql: null,
        /**
         * By generation select sql use SELECT DISTINCT instead of just SELECT
         */
        selectDistinct: false,
        sqlHaving: null,
        /**
         * explicit state that 
         */
        emptyData: false,
        suppressSelect: [],
        dictionary: false,
        isCurrentField: false,
        limit: false,

        /**
         * @private
         * Fields are appeared in SELECT clause
         */
        selectColumns: [],
        persistColumns: [],

        /**
         * @private
         */
        keyColumns: [],
        rawColumns: [],
        orderColumns: [],
        groupByColumns: [],
        dateColumns: null,
        datetimeColumns: null,
        booleanColumns: null,
        columnAliases: null,
        escapedColumns: {},
        // for reconfigure proxy at next call
        dirty: false
    },
    

    constructor: function(config) {
        var me = this;
        var environment = Insistent.Environment.determine(config);
        var initialConfig = me.getInitialConfig();
        Ext.applyIf(config, initialConfig);
        var proxy = environment.proxyImpl(config);
        
        me.callParent(arguments);
        me.setImpl(proxy);
    },


    /**
     * Move to platform proxy 
     */
    mapDataToStore: function(tx, results, operation, callback, scope, mappingConfig) {
        var me = this,
            dateColumns = me.getDateColumns(),
            datetimeColumns = me.getDatetimeColumns(),
            hasDateColumns = !Workflow.isEmpty(dateColumns) || !Workflow.isEmpty(datetimeColumns),
            args = arguments;

        if (hasDateColumns) {
            var hasMappingConfig = Ext.isDefined(mappingConfig);
            if (!hasMappingConfig) {
                var columns = {};
                args = Array.prototype.slice.call(arguments, 0);
                args.length = 5;
                mappingConfig = args[5] = {
                    DateFields: {}
                };
            }
            var dateFields = mappingConfig.DateFields;
            if (!dateFields) {
                dateFields = mappingConfig.DateFields = {};
            }
            Ext.merge(dateFields, dateColumns, datetimeColumns);
        }
        return me.callParent(args);
    },


    /**
     * By default returns config {@link #selectSql selectSql value}
     *
     * @param params {Object} load parameters
     * @param scope {Mixed} changed scope if not same with proxy
     * @param rawMode {boolean} specific mode of loading {@see}
     */
    getSelectSql: function(params, scope, rawMode) {
        return this._selectSql;
    },


    /**
     * TODO subject to remove
     */
    tableName: function() {
        return this.getTableName();
    },


    /**
     * Check whether  the column is escaped or not
     * @param name
     * @param escapedColumns
     * @returns {*}
     */
    getEscapedColumn: function(name, escapedColumns) {
        var reserved = $.SQL_RESERVED_WORDS;

        Ext.each(reserved, function(keyword) {
            if (name.toUpperCase() == keyword) {
                name = '[' + name + ']';
                return false;
            }
        });
        return name;
    },


    /**
     * Parse model and prepare many other collection to latter sql generation
     * @param model
     */
    updateModel: function(model) {
        // set selectColumns, keyColumns, etc...
        var me = this,
            escapedColumns = me.getEscapedColumns(),
            fields = model.getFields(),
            selectColumns = [],
            persistColumns = [],
            keyColumns = [],
            rawColumns = [],
            orderColumns = [],
            groupByColumns = [],
            dateColumns = {},
            datetimeColumns = {},
            booleanColumns = {},
            columnAliases = {},
            fieldsMapping = $.SQL_FIELDS_MAPPING;

        fields.each(function(field) {
            var typeObject = field.getType(),
                type = typeObject.type,
                isDate = type == 'date',
                isBoolean = type == 'bool',
                name = field.getName(),
                config = field.config,
                isDatetime = config.type == 'datetime',
                isPersist = config.persist,
                sqlColumn = config.sqlColumn,
                inSelect = !!sqlColumn,
                selectKey = config.keyColumn,
                rawKey = config.rawKey,
                loadModelKey = config.loadModel,
                isKey = selectKey || config.unique,
                isOrder = config.orderBy,
                sqlFunction = config.sqlFunction,
                groupByExpression = config.sqlGroupBy,
                isGroupBy = groupByExpression === true || Ext.isString(groupByExpression);

            // surrogate id
            if (name == 'id') return;

            if (isDate) {
                dateColumns[name] = true;
            }
            if (isDatetime) {
                datetimeColumns[name] = true;
            }
            if (isBoolean) {
                booleanColumns[name] = true;
            }
            if (sqlColumn) {
                columnAliases[name] = sqlColumn;
            }
            if (sqlFunction) {
                var functionArgument = columnAliases[name] || name;
                columnAliases[name] = sqlFunction + '(' + functionArgument + ')';
            }

            var escaped = me.getEscapedColumn(name);
            if (escaped != name) {
                escapedColumns[escaped] = name;
                name = escaped;
            }

            if (fieldsMapping[name]) {
                name = fieldsMapping[name];
            }

            if (rawKey) {
                rawColumns.push({
                    name: name,
                    prio: config.keyPrio || 0
                });
            }

            if (isKey) {
                keyColumns.push({
                    name: name,
                    prio: config.keyPrio || 0
                });
            } else if (isPersist || inSelect) {
                if (isPersist) {
                    persistColumns.push(name);
                }
                selectColumns.push(name);
            }

            if (isOrder) {
                orderColumns.push({
                    name: name,
                    prio: isOrder || 0
                })
            }

            if (isGroupBy) {
                if (Ext.isString(groupByExpression)) {
                    name = groupByExpression;
                }
                groupByColumns.push(name);
            }
        });

        if (selectColumns.length) {
            me.setSelectColumns(selectColumns);
        }

        if (persistColumns.length) {
            me.setPersistColumns(persistColumns);
        }

        me.setDateColumns(dateColumns);
        me.setDatetimeColumns(datetimeColumns);
        me.setBooleanColumns(booleanColumns);
        me.setColumnAliases(columnAliases);

        if (rawColumns.length) {
            rawColumns = namePrioOrdered(rawColumns);
            me.setRawColumns(rawColumns);
        }
        if (keyColumns.length) {
            keyColumns = namePrioOrdered(keyColumns);
            me.setKeyColumns(keyColumns);
        }
        if (orderColumns.length) {
            orderColumns = namePrioOrdered(orderColumns);
            me.setOrderColumns(orderColumns);
        }
        if (groupByColumns.length) {
            me.setGroupByColumns(groupByColumns);
        }

        function namePrioOrdered(arr) {
            arr.sort(function(a, b) {
                return a.prio - b.prio;
            });
            var ret = [];
            arr.forEach(function(item) {
                ret.push(item.name);
            });
            return ret;
        }
    },


    rawDataArray: function(record, scope, persist) {
        var me = this,
            selectColumns = me.getKeyColumns(true);

        return me.dumpDataArray(selectColumns, record, scope, undefined, persist);
    },


    keyDataArray: function(record, scope, rawKeysAdd) {
        var me = this,
            selectColumns = me.getKeyColumns(),
            doAddRawKey = rawKeysAdd === true;

        if (doAddRawKey) {
            selectColumns = selectColumns.concat(me.getRawColumns());
        }

        return me.dumpDataArray(selectColumns, record, scope);
    },


    plainDumpDataArray: function(selectColumns, record, scope) {
        return this.dumpDataArray(selectColumns, record, scope, undefined, undefined, [])
    },


    dumpDataArray: function(selectColumns, record, scope, useOriginalValues, persist, suppressKeys) {
        var me = this;
        suppressKeys = suppressKeys || me.getSuppressSelect();
        var dateColumns = me.getDateColumns(),
            datetimeColumns = me.getDatetimeColumns(),
            booleanColumns = me.getBooleanColumns(),
            modified = useOriginalValues ? record.modified : null,
            removeClientIdIndex = null,
            ret = [];

        Ext.each(selectColumns, function(column, index) {
            var exclude = suppressKeys.indexOf(column);
            if (exclude != -1 && !persist) {
                return;
            }
            var value = dumpValue(column);
            if (column == $.ClientID) {
                if (value == null) {
                    me.setClientID(false);
                    removeClientIdIndex = index;
                } else {
                    me.setClientID(value);
                }
            }
            ret.push(value);
        });

        if (removeClientIdIndex != null) {
            ret.splice(removeClientIdIndex, 1);
            Ext.each([me.getKeyColumns(), me.getRawColumns()], function(arr) {
                Ext.Array.remove(arr, $.ClientID);
            })
        }
        return ret;


        function dumpValue(field) {
            var escapedCache = me.getEscapedColumns(),
                deEscapedField = escapedCache[field],
                val;

            if (deEscapedField) {
                field = deEscapedField;
            }

            if (useOriginalValues && modified && modified[field] !== undefined) {
                val = modified[field];
            } else if (record && record.isModel) {
                val = record.get(field);
            } else {
                val = record[field];
            }

            if (val === undefined && scope) {
                var getterName = 'get' + Ext.String.capitalize(field),
                    getter = scope[getterName];

                if (Ext.isFunction(getter)) {
                    val = getter.call(scope);
                }
            }

            if (dateColumns[field]) {
                val = __global.makeSQLDate(val);
            } else if (datetimeColumns[field]) {
                val = __global.makeSQLDateAndTime(val);
            } else if (booleanColumns[field]) {
                val = val ? 1 : 0
            }
            return val;
        }
    },


    AND: ' AND ',
    WHERE: ' WHERE ',
    PLACEHOLDER: ' = ?',

    plainColumnsWhere: function (idOjbect) {
        var me = this,
            binder = me.AND,
            placeholder = me.PLACEHOLDER,
            keyColumns = me.convertIdToArray(idOjbect),
            ret = '';

        Ext.each(keyColumns, function(item, index) {
            if (ret.length) {
                ret += binder;
            }
            ret += item;

            ret += placeholder
        });

        return ret;
    },


    prepareColumnsWhere: function(rawMode) {
        var me = this,
            enterprise = me.getEnterprise(),
            isEnterprise = enterprise && enterprise.active,
            enterpriseColumnID,
            suppressSelect = me.getSuppressSelect() || [],
            binder = me.AND,
            placeholder = me.PLACEHOLDER,
            dictionary = me.getDictionary(),
            isCurrent = dictionary ? me.getIsCurrentField() : false,
            isCurrentField = isCurrent === true ? 'IsCurrent' : isCurrent,
            prefix = me.getTableAlias(),
            rawColumns = rawMode ? me.getRawColumns() : null,
            hasRaw = rawColumns && rawColumns.length,
            keyColumns = me.getKeyColumns(),
            ret = '';

        if ((keyColumns.length || hasRaw || isCurrent)) {
            // do clone
            keyColumns = Ext.isArray(keyColumns) ? keyColumns.slice(0) : [];

            if (hasRaw) {
                keyColumns = keyColumns.concat(rawColumns);
            }

            if (isCurrent) {
                keyColumns.push(isCurrentField);
            }

            if (isEnterprise) {
                var index = keyColumns.indexOf($.ClientID);

                if (index > -1) {
                    enterpriseColumnID = sprintf('IFNULL(%s.%s, %s.%s)', enterprise.joinTableAlias, $.ClientID, me.getTableAlias(), $.ClientID);

                    keyColumns.splice(index, 1, enterpriseColumnID);
                }
            }

            Ext.each(keyColumns, function(item, index) {
                var exclude = suppressSelect.indexOf(item);
                if (exclude != -1) {
                    return;
                }

                if (ret.length) {
                    ret += binder;
                }
                if (prefix && !(isEnterprise && item == enterpriseColumnID)) {
                    ret += prefix + '.';
                }
                ret += item;
                if (dictionary && item == $.ClientID) {
                    ret += ' IN (0, ?)'
                } else {
                    ret += placeholder
                }
            });
        }

        return ret;
    },


    // private
    generateWhereSnippet: function(rawMode, loadModelMode, params) {
        var me = this,
            snippet = me.getSqlWhere(),
            columnsSnippet = null;

        // it is possible to avoid default generation by setting sqlWhere to false;
        if (snippet !== false) {
            if (loadModelMode) {
                columnsSnippet = me.plainColumnsWhere(params.id);
                snippet = '';
            } else {
                columnsSnippet = me.prepareColumnsWhere(rawMode);
            }

            if (columnsSnippet || snippet) {
                var whereSnippet = columnsSnippet || '';
                if (columnsSnippet && snippet) {
                    whereSnippet += me.AND;
                }
                snippet = me.WHERE + whereSnippet + (snippet || '');
            }
        }

        return snippet;
    },


    // private
    generateHavingSnippet: function() {
        var me = this,
            snippet = me.getSqlHaving();
        if (snippet)
            snippet = ' HAVING ' + snippet;

        return snippet;
    },


    selectSQL: function(params, scope, rawMode, sqlParams, loadModelMode) {
        const AS = ' AS ',
            FROM = ' FROM ';

        var me = this,
            snippet = '',
            enterprise = me.getEnterprise(),
            isEnterprise = enterprise && enterprise.active,
//            enterpriseColumnID,
//            having = '',
            sql = me.getSelectSql(params, scope, rawMode, sqlParams),
            orderColumns = me.getOrderColumns(),
            groupColumns = me.getGroupByColumns(),
            selectStar = me.getSelectStar(),
            tableName = me.getTableName(),
            tableAlias = me.getTableAlias(),
            limit = me.getLimit(),
            sqlJoin = me.getSqlJoin(params),
            selectDistinct = me.getSelectDistinct();
//<debug>
        console.debug('-------->selectSQL: proxy "%s", rawMode = %s', me.$className, rawMode, params, sqlParams);
//</debug>
        if (!sql) {
            sql = 'SELECT ';
            if (selectDistinct) {
                sql += 'DISTINCT ';
            }
            if (selectStar) {
                sql += '*';
            } else {
                var columns = me.getColumns(me.getSelectColumns());
                var selectColumns = me.getKeyColumns().concat(columns);

                if (selectColumns.indexOf('dbPostDate') == -1) {
                    selectColumns.push('dbPostDate');
                }

                Ext.each(selectColumns, function(columnName) {
                    var aliases = me.getColumnAliases(),
                        columnExpr = aliases[columnName];

                    if (snippet) {
                        snippet += ','
                    }
                    if (columnExpr) {
                        snippet += columnExpr + AS + columnName
                    } else {
                        if (tableAlias) {
                            snippet += tableAlias + '.'
                        }
                        snippet += columnName;
                    }
                });
                sql += snippet;
            }
            sql += FROM + tableName;

            if (tableAlias) {
                sql += ' ' + tableAlias
            }
        } else {
            var hasFromClause = sql.toUpperCase().indexOf(FROM) !== -1;

            if (!hasFromClause) {
                sql += FROM + tableName;
                if (tableAlias) {
                    sql += ' ' + tableAlias;
                }
            }
        }

        if (sqlJoin) {
            sql += '\n ' + sqlJoin
        }
        if (isEnterprise) {
            var joinTable = enterprise.joinTable,
                joinTableAlias = enterprise.joinTableAlias,
                joinField = enterprise.joinField;

            sql += sprintf('\n LEFT JOIN %s %s ON %s.%s = %s.%s',
                joinTable, joinTableAlias, tableAlias, joinField, joinTableAlias, joinField);
        }

        snippet = this.generateWhereSnippet(rawMode, loadModelMode, params);

        if (snippet) {
            sql += snippet;
        }

        if (orderColumns.length) {
            snippet = orderColumns.join(',');
        } else {
            snippet = me.getOrderBy();
        }
        if (groupColumns.length) {
            sql += ' GROUP BY ' + groupColumns.join(',');
        }

        var having = me.generateHavingSnippet();
        if (having) {
            sql += having;
            snippet = null;
        }

        if (snippet) {
            sql += ' ORDER BY ' + snippet;
            snippet = null;
        }

        if (limit) {
            if (limit === true) {
                limit = 1;
            }
            sql += '\n LIMIT ' + limit;
        }

        return sql;

    },


    convertIdToArray: function (idObject) {
        return Ext.Object.getKeys(idObject);
    },


    loadModelDataArray: function(params, scope) {
        var me = this,
            id = params.id,
            loadModelColumns = me.convertIdToArray(id);

        return me.plainDumpDataArray(loadModelColumns, id, scope);
    },


    selectDataArray: function(params, scope, rawMode) {
        var me = this,
            keyDataArray = me.keyDataArray(params, scope, rawMode),
            dictionary = me.getDictionary(),
            isCurrent = me.getIsCurrentField();

        if (isCurrent && dictionary) {
            keyDataArray.push(1);
        }

        return keyDataArray;
    },


    getKeyColumns: function(rawKeysAdd, suppressKeys) {
        var me = this,
            selectColumns = me._keyColumns,
            doAdd = rawKeysAdd === true;

        if (doAdd) {
            var rawColumns = me.getRawColumns();
            selectColumns = selectColumns.concat(rawColumns);
        }

        if (suppressKeys) {
            if (Ext.isArray(suppressKeys)) {
                Ext.each(suppressKeys, function(key) {
                    Ext.Array.remove(selectColumns, key)
                })
            } else {
                Ext.Array.remove(selectColumns, suppressKeys)
            }
        }
        return selectColumns;
    },


    getColumns: function(columns, model, keys, rawKeysAdd) {
        var me = this,
            selectColumns = columns.slice(), // clone
            doAdd = rawKeysAdd === true,
            doRemove = rawKeysAdd === false,
            rawColumns = rawKeysAdd !== undefined ? me.getRawColumns() : null;

        if (rawColumns) {
            if (doAdd) {
                selectColumns = selectColumns.concat(rawColumns);
            }
            if (doRemove) {
                selectColumns = Ext.Array.difference(selectColumns, rawColumns);
            }
        }
        if (model && keys) {
            //            me.appendIfModified(selectColumns, model, keys);
            if (model.isModel) {
                var modified = model.modified;
            }

            Ext.Object.each(modified, function(fieldNm, oldValue) {
                var escaped = me.getEscapedColumn(fieldNm);
                var exists = Ext.Array.contains(keys, escaped);
                if (exists) {
                    selectColumns.push(fieldNm);
                }
            });
        }
        return selectColumns;
    },


    checkLoadModel: function (params) {
        return !!params.id
    },


    read: function(operation, callback, scope) {
        var me = this,
            params = operation.getParams(),
            rawMode = params.rawMode,
            loadModelMode = me.checkLoadModel(params),

            emptyData = me.getEmptyData(),
// NOTE! calls sequence to is predefined: first #selectDataArray, then #selectSQL...
            sqlParams = emptyData ? [] : (loadModelMode ? me.loadModelDataArray(params, scope) : me.selectDataArray(params, scope, rawMode)),
            sql = me.selectSQL(params, scope, rawMode, sqlParams, loadModelMode),
            onSuccess = me.getReadCallback(operation, callback, scope),
            onError = me.getErrorCallback(sql);

        me.queryDB(sql, onSuccess, onError, sqlParams);
    }
});
