/**
 * Created by JetBrains WebStorm.
 */
Ext.define('Mocha.store.ClientsAndBudgetsStore',{
    extend: 'Ext.data.Store',
    alias: 'store.clientsAndBudgets',
    requires: [
        'Mocha.model.ClientsAndBudgetsModel'
    ],

    config: {
        storeId: 'clientsAndBudgets',
        model: 'Mocha.model.ClientsAndBudgetsModel',
        autoDestroy: false,
//         autoLoad: true,
        sorters: [{
            property : 'ChildName',
            direction: 'ASC'
        }],
        idProperty: 'ID'
    }
});