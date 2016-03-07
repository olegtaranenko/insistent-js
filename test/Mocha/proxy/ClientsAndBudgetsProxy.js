/**
 * Created by JetBrains WebStorm.
 * User: Roger
 * Date: 02.07.13
 * Time: 23:53
 */
Ext.define('Mocha.proxy.ClientsAndBudgetsProxy', {
    extend: 'Insistent.proxy.NodeSqlitelProxy',
    alias: 'proxy.clientsAndBudgets',
    config: {
        tableName: 'ClientBudget',
        suppressSelect: ['ClientID']
    }
});
