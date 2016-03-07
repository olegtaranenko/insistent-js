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
        sorters: [{
            property : 'ChildName',
            direction: 'ASC'
        }],
        idProperty: 'ID'
    }
});