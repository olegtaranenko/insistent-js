/**
 * Top-level abstraction of proxies, which serves Entity.
 * Depends on current environment, it could redirect queries regard entity either centralized (Ajax, Websocket-based, etc)
 * or to fallback ones (local stores, indexed db, implicit local sqlite instances, etc);
 */
Ext.define('Insistent.entity.EntityProvider', {
    mixins: [
        'Ext.mixin.Observable'
    ],
    
    config: {
        /**
         * @event environmentchanged
         */

        /**
         * Current proxy's environment
         */
        environment: null
    },
    
    inheritableStatics: {
        /**
         * Retrieve entity list from persistence backend discriminated by Tenant
         * @param [tenant] Tenant information
         * @param {Object} [rt] RoundTrip transaction descriptor
         */
        list: function(tenant, rt) {

        },


        /**
         * Retrieve information about single entity instance from persistence layer
         *
         * @param {Number|Object} id entity ID
         * @param {Object} [brief]
         * @param {Object} [rt] RoundTrip transaction descriptor
         */
        pull: function(id, brief, rt) {

        }
    },


    /**
     * Planned to be used for fire & sync centralized <-> decentralized persisting. 
     */
    onEnvironmentChanged: function() {
        
    },


    /**
     * Persist entity list under RoundTrips transacion 
     * @param {Object|Number} tenant 
     * @param {List} payload List
     * @param rt
     */
    sync: function(tenant, payload, rt) {

    },


    push: function(id, payload, rt) {

    },


    /**
     * Reserve room (mainly from id space) for this entity to be used in cRUD operation.
     *
     * @param entity
     * @param rt
     */
    pullRoom: function(entity, rt) {
        
    },

    /**
     * Release unused room (id space) because of initial 
     * @param entity
     * @param rt
     */
    unusedRoom: function(entity, rt) {

    },


    /**
     * Commit all pending transactions/changes regarding entity under given RoundTrips.
     * @param rt
     */
    commit: function(rt) {

    },


    /**
     * Discard all pending transactions/changes regarding entity under given RoundTrips.
     * @param rt
     */
    rollback: function(rt) {

    }
});
