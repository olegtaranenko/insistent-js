Ext.define('Mocha.os.AbstractOS', {
    extend: 'Insistent.mixin.Chainable',
    
    mixins: [
        'Mocha.vendor.AbstractVendor'
    ],

    config: {
        name: null,
        version: null
    }
});