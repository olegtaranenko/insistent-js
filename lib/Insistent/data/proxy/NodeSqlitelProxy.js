Ext.define('Insistent.data.proxy.NodeSqlitelProxy', {
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


    throwDbError: function (tx, err, sql) {
        console.error(" %s ---- %s\n\n%s", this.type, err.message, sql);
    },


    executeBatch: function (queries, successCallback, errorCallback, callback, scope) {
        var me = this,
            connection = me.getConnection();

        connection.transaction(function (tx) {
            if (typeof callback == 'function') {
                callback.call(scope || me, results, me);
            }

            Ext.each(queries, function (query) {
                query(tx);
            });

        }, errorCallback, successCallback);
    },

    read: function (operation, callback, scope) {
        
    },

    destroy: function (operation, callback, scope) {
        
    },

    create: function (operation, callback, scope) {

    },

    update: function (operation, callback, scope) {
        
    }

});