Ext.define('Insistent.environment.GenericProxy', {
    extend: 'Ext.data.proxy.Client',

    config: {
        reader: null,
        writer: null,

//         batchOrder: 'destroy,update,create',
        connection: null
    },


    constructor: function(config) {
        var connection = config && config.connection || config,
            fallbackGlobalConnection;

        if (!connection) {
            fallbackGlobalConnection = Insistent.__global_fallback_connection__;
        }

        if (!config) {
            config = {};

        }

        if (!connection && fallbackGlobalConnection) {
            connection = fallbackGlobalConnection;
        }

        this.callParent([config]);
        this.setConnection(connection);
    },


    /*
        throwDbError: function(tx, err, sql) {
            console.error(" %s ---- %s\n\n%s", this.type, err.message, sql);
        },
    */


    failureHandler: function(err, query) {
        var me = this;
        return function(err, scope) {
            var className = me.getClass(),
                fmt = 'Unexpected error in "%s"',
                args = [className];

            if (query) {
                fmt += ', sql: "%s"';
                args.push(query);
            }
            args.push(Object.prototype.toString.call(me, err));

            args.unshift(fmt);
            console.error.apply(console, args);
        }
    },


    run: function(queries, success, failure, beforeCallback, scope) {
        var me = this,
            connection = me.getConnection();

        scope = scope || me;
        connection.seiralize(function() {
            if (typeof beforeCallback == 'function') {
                beforeCallback.call(scope, me);
            }

            Ext.each(queries, function(query) {
                connection.run(query, function(err) {
                    if (err) {
                        if (!Ext.isFunction(failure)) {
                            failure = me.failureHandler();
                        }
                        if (Ext.isFunction(failure)) {
                            failure.call(scope, err, me, query);
                        }
                        return;
                    }

                    if (Ext.isFunction(success)) {
                        success.call(scope, me, query);
                    }
                })
            });

        });
    },



    query: function(sql, successcallback, errorcallback, params, callback) {
        var me = this,
            hasParams = params && params.length;

//  <debug>
        const eolRe = /(\r\n|\n|\r|\t)/gm;
        var trimLength = hasParams ? 80000 : 13000;
        var spacesRe = / +/gm;
        var sqlTrimmed = sql.substr(0, trimLength).replace(eolRe, ' ').replace(spacesRe, ' ');
        var config = this.config;
        var type = (config && config.type) ? config.type + ' : ' : '';
        var message = type + sqlTrimmed + (sql.length > trimLength ? '...' : '');

        if (hasParams) {
            var longParams = [], printClone = false;
            Ext.each(params, function(param, idx) {
                if (param != null && Object.prototype.toString.call(param).length > 1000) {
                    printClone = true;
                    longParams.push(idx);
                }
            });

            if (printClone) {
                var clone = Ext.clone(params);
                Ext.each(printClone, function (idx) {
                    clone[idx] = clone[idx].substring(0, 997) + '...'
                });
            }
            console.log(message, printClone ? clone : params)
        } else {
            console.log(message);
        }
//  </debug>


        if (successcallback == null) {
            successcallback = Ext.emptyFn;
        }

        if (errorcallback == null) {
            errorcallback = me.throwDbError;
        }

        dbConn.each(function (tx) {
            tx.executeSql(
                sql,
                (params ? params : []),
                successcallback,
                errorcallback
            );
        });
    },


    read: function(operation, callback, scope) {
        var me = this,
            connection = me.getConnection();

    },

    destroy: function(operation, callback, scope) {

    },

    create: function(operation, callback, scope) {

    },

    update: function(operation, callback, scope) {

    }
});