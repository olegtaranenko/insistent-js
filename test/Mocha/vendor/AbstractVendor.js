Ext.define('Mocha.vendor.AbstractVendor', {
    extend: 'Insistent.mixin.Chainable',

    config: {
        vendorName: null
    },

    mixinConfig: {
        id: 'vendor',

        returnAfter: {
            getVendorName: true
        }
    },

    getVendorName: function() {
        var me = this,
            ret = me.$pullHostResult(arguments),
            vendor = me.getInitialConfig('vendorName');

        if (ret) {
            ret += ', '
        } else {
            ret = '';
        }

        return ret + vendor;
    }
});