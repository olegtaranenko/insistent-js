Ext.define('Insistent.environment.Node', {
    proxyImpl: function(config) {
        return Ext.create('Insistent.environment.node.proxy.Sqlite', config);
    }
});