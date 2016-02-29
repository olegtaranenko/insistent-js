/**
 * Created by JetBrains WebStorm.
 * User: user1
 * Date: 12.01.16
 * Time: 15:41
 */
Ext.define('Insistent.system.System', {
    singleton: true,

    alternateClassName: 'System',

    /**
     * Property name to for Chainable mixin.
     */
    MRTCP: '_mixin_runtime_',

    /**
     * 'Deep' javascript object's comparison, arguments can be array or objects.
     * See http://stackoverflow.com/questions/1068834/object-comparison-in-javascript for more information.
     *
     * @param a
     * @param b
     * @private
     * @param depth prevent infinite recursion
     *
     * @returns {boolean}
     */
    areObjectsEqual: function(a, b, depth) {
        if (a === b) {
            return true;
        }
        if (depth >= 10) {
            return false;
        }
        // if both a and b are null or undefined and exactly the same

        if (!( a instanceof Object ) || !( b instanceof Object )) {
            return false;
        }
        // if they are not strictly equal, they both need to be Objects

        if (a.constructor !== b.constructor) {
            return false;
        }
        // they must have the exact same prototype chain, the closest we can do is
        // test there constructor.

        for (var p in a) {
            if (!a.hasOwnProperty(p)) {
                continue;
            }
            // other properties were tested using a.constructor === b.constructor

            if (!b.hasOwnProperty(p)) {
                return false;
            }
            // allows to compare a[ p ] and b[ p ] when set to undefined

            if (a[p] === b[p]) {
                continue;
            }
            // if they have the same strict value or identity then they are equal

            if (typeof( a[p] ) !== "object") {
                return false;
            }
            // Numbers, Strings, Functions, Booleans must be strictly equal

            if (!System.areObjectsEqual(a[p], b[p], (depth || 0) + 1)) {
                return false;
            }
            // Objects and Arrays must be tested recursively
        }

        for (p in b) {
            if (b.hasOwnProperty(p) && !a.hasOwnProperty(p)) {
                return false;
            }
            // allows a[ p ] to be set to undefined
        }
        return true;
    },


    getMixinRuntime: function(objectOrClass, create) {
        var me = this,
            isInstance = Boolean(objectOrClass.self),
            klassProto = (isInstance ? objectOrClass.self : objectOrClass)['prototype'] || objectOrClass,
            ret = klassProto.hasOwnProperty(me.MRTCP) ? klassProto[me.MRTCP] : null;

        if (!ret && create) {
            ret = klassProto[me.MRTCP] = {};
        }

        return ret;
    },


    getMixinFunctionConfig: function(name, classOrRuntime, create) {
        var me = this,
            paramIsClass = Ext.isFunction(classOrRuntime),
            runtime = paramIsClass ? me.getMixinRuntime(classOrRuntime, create) : classOrRuntime,
            ret = runtime && runtime[name];

        if (!ret && create && runtime) {
            ret = runtime[name] = {};
        }

        return ret;
    },


    /**
     * Expand functionality of {@link Ext#isEmpty} with followng aspects
     *  - Object is treated as empty if it has no properties, or callback fn|scope called for every property returns empty as true.
     *    Format of `fn` is *function fn(propertyName, propertyValue)*
     *  - in call isEmpty(number, false) - if number === 0 is treated not as empty - return `false`
     *  - if first argument is {@link Ext.data.Store} - on empty store returns `true`
     *  - Date with defined fn|scope is treated empty, if call of fn.call(scope, Date) returns true.
     *
     * @param {*|Function} object Any javascript object or function
     * @param {Boolean|Function} fn
     * @param scope
     * @returns {Boolean} `true` if object or value considered as empty.
     */
    isEmpty: function(object, fn, scope) {
        var me = this;
        // format #isEmpty(Number, doNotTreatZeroAsEmpty
        if (object === 0) {
            if (fn === false || fn === true) {
                return fn;
            } else if (fn === undefined) {
                // quirk fixation
                return true;
            }
        }

        // quirk fixation
        if (object === false) {
            if (fn === undefined) {
                return false;
            }

            if (fn === true) {
                return true;
            }
        }

        if (!Ext.isObject(object)) {
            if (Ext.isDate(object)) {
                if (Ext.isFunction(fn)) {
                    return fn.call(scope || me, object);
                }
                if (object.getTime() === $.NullDateTime) {
                    return true;
                }
            }
            if (fn === false && Ext.isArray(object)) {
                return false
            }
            return Ext.isEmpty.apply(Ext, arguments);
        }

        // here object should be Object
        if (fn === false) {
            return false;
        }
        if (object.isStore) {
            return !object.getCount();
        } else if (object === $.ModelFake) {
            return true;
        }

        var isEmpty = true;
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                var value = object[key];

                if (fn && Ext.isFunction(fn)) {
                    isEmpty = fn.call(scope | me, key, value);
                } else if (fn === true) {
                    isEmpty = System.isEmpty(value, fn);
                } else {
                    isEmpty = false;
                }
            }
            if (!isEmpty) {
                break;
            }
        }
        return isEmpty;
    },


    /**
     *
     * @param obj
     * @param property
     * @returns {boolean|*}
     */
    isPropertyDefined: function(obj, property) {
        return obj != null && (typeof obj == 'object' && (obj.hasOwnProperty(property) || Object.prototype.toString.apply(obj[property]) != '[object Undefined]'));
    },


    /**
     * @public
     * Borrowed from Ext.Object.merge. Reason to 'fix' it - original does not merge Arrays' properties properly
     *
     * @param source
     * @returns {*}
     */
    merge: function(source) {
        var me = this,
            i = 1,
            ln = arguments.length,
            mergeFn = me.merge,
            cloneFn = Ext.clone,
            object, key, value, sourceKey;

        for (; i < ln; i++) {
            object = arguments[i];

            for (key in object) {
                value = object[key];
                if (value && value.constructor === Object) {
                    sourceKey = source[key];
                    if (sourceKey && sourceKey.constructor === Object) {
                        mergeFn.call(me.sourceKey, value);
                    } else {
                        source[key] = cloneFn(value);
                    }
                } else if (value && value.constructor === Array) {
                    sourceKey = source[key];
                    if (sourceKey && sourceKey.constructor === Array) {
                        source[key] = sourceKey.concat(value);
                    } else if (sourceKey && sourceKey.constructor === Object) {
                        // exotic case where array is merging to object.
                        // possible, but not practical
                        /*
                         for (var j = 0; j < value.length; j++) {
                         var property = value[j];

                         }
                         */
                    } else if (sourceKey) {
                        source[key] = [sourceKey].concat(value);
                    }
                } else {
                    source[key] = value;
                }
            }
        }

        return source;
    },


    /**
     * @private
     * @param mixins
     * @param mixinName
     * @param alias
     * @returns {*}
     */
    isMixinApplied: function(mixins, mixinName, alias) {
        var ret = null;

        if (mixins) {
            Ext.iterate(mixins, function(mixin, instance) {
                var mixinInstance = mixin.getName ? mixin : instance,
                    compareName = Ext.isString(mixin) ? mixin : mixinInstance.$className;

                ret = compareName === mixinName;

                if (!ret && alias) {
                    var mixinProto = mixinInstance.prototype || mixinInstance;
                    compareName = mixinProto.mixinId;
                    ret = compareName === mixinName;
                }

                return !ret;
            })
        }

        return ret;
    },


    /**
     * @public
     *
     * @param mixinName
     * @param parentClass
     * @param classData
     * @returns {*}
     */
    doesClassHaveMixin: function(mixinName, parentClass, classData) {
        var me = this,
            found = false,
            aliasOrFull = mixinName.indexOf('.') === -1;

        if (mixinName) {
            if (classData) {
                var mixins = classData.mixins;

                found = me.isMixinApplied(mixins, mixinName, aliasOrFull);
            }

            if (!found) {
                while (parentClass && !found) {
                    mixins = parentClass.mixins;

                    if (mixins) {
                        found = me.isMixinApplied(mixins, mixinName, aliasOrFull);
                    }

                    if (!found) {
                        parentClass = parentClass.superclass;
                    }
                }
            } else {
                return classData;
            }
        }

        return parentClass;
    },


    /**
     * @public
     *
     * @param parentClass
     * @param configurationName
     * @param dataConfiguration
     * @returns {*|{}}
     */
    mergeConfigurationFromSuper: function(parentClass, configurationName, dataConfiguration) {
        var me = this,
            currentConfiguration = dataConfiguration || {};

        parentClass = parentClass.prototype || parentClass;

        while (parentClass) {
            var parentConfiguration = parentClass[configurationName];

            if (parentConfiguration) {
                Ext.mergeIf(currentConfiguration, parentConfiguration);
//                me.merge(currentConfiguration, parentConfiguration);
            }

            parentClass = parentClass.superclass;
        }

        return currentConfiguration;
    }
});
