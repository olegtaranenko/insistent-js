Ext.define('Mocha.model.ClientsAndBudgetsModel', {
    extend: 'Ext.data.Model',
    requires: [
        'Mocha.proxy.ClientsAndBudgetsProxy'
    ],
    config: {
        fields: [
            {name: 'ID', type: 'int'},
            {name: 'ChildName', type: 'string'}
        ],
        proxy: {
            type: 'clientsAndBudgets'
        }
    }
});


