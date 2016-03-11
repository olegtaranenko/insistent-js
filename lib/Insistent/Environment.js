Ext.define('Insistent.Environment', {
    singleton: true,

    mixins: [
        'Ext.mixin.Observable'
    ],
    
    
    determine: function(config) {
        var isNode = require('detect-node');

        return isNode ? Ext.create('Insistent.environment.Node') : null;
    }
});
