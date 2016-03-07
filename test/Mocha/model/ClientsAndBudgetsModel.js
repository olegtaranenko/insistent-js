/**
 * Created by JetBrains WebStorm.
 * User: user1
 * Date: 02.07.13
 * Time: 23:16
 */


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


