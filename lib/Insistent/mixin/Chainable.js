/**
 *   This class borrows base idea from {@link Ext.mixin.Mixin} to extend functionality of mixed classes.
 *   In both is used function overriding, see more {@link Class.override}. If function in mixed (host) Class is overridden,
 *   it is still accessible in the closure. This trick is been exploited to create of different combination both mixin and mixed
 *   function execOrdered.
 *   For example, more interesting case if subsequent execOrdered first host function (with return) then executing mixin
 *   function.
 *
 *   This is pretty similar to useful construction like
 *          function bar() {
 *              var me = this,
 *                  ret = me.callParent(arguments),
 *
 *              // more action
 *              return ret;
 *          }
 *   but there is calling mixin function rather than base overridden function from parent class.
 *
 */

/*
// TODO convert to documentation
    // First executes class function with return, then put return value as first argument & call mixin function with return
    // No preventable logic, as it done in {@link Ext.mixin.Mixin}
    if ('returnAfter' in mixinConfig) {
        Ext.Object.each(mixinConfig.returnAfter, function(from, to) {
            override.call(this, targetClass, from, to, {
                before: false,
                returnable: true
            });
        }, this);
    }

    // First executes mixin function with return, then calls class function with return
    // Signature of mixin function is same as class one.
    // No preventable logic (as it done in {@link Ext.mixin.Mixin}
    // If class function is defined overall return is from this function, return of first (mixin function) call is dismissed.
    if ('returnBefore' in mixinConfig) {
        Ext.Object.each(mixinConfig.returnBefore, function(from, to) {
            override.call(this, targetClass, from, to, {
                before: true,
                returnable: true
            });
        }, this);
    }

    // just call mixin function (with or without return), no call to class function
    if ('returnMixin' in mixinConfig) {
        Ext.Object.each(mixinConfig.returnMixin, function(from, to) {
            override.call(this, targetClass, from, to, {
                before: false,
                returnable: true
            });
        }, this);
    }


    // call to class function then call to mixin one (with or without return)
    // returns (if any) class result, if it is undefined, returns mixin result
    if ('returnClass' in mixinConfig) {
        Ext.Object.each(mixinConfig.returnClass, function(from, to) {
            override.call(this, targetClass, from, to, {
                before: true,
                returnable: true
            });
        }, this);
    }

    // call to class function, then mixin one.
    // No return
    if ('voidAfter' in mixinConfig) {
        Ext.Object.each(mixinConfig.voidAfter, function(from, to) {
            override.call(this, targetClass, from, to, {
                before: false,
                returnable: false
            });
        }, this);
    }

    // call to mixin function, then class one.
    // No return
    if ('voidBefore' in mixinConfig) {
        Ext.Object.each(mixinConfig.voidBefore, function(from, to) {
            override.call(this, targetClass, from, to, {
                returnable: false,
                before: true
            });
        }, this);
    }

    // do not method in base class, instead call mixin's one (usually with warning) and exit from processing.
    if ('deprecated' in mixinConfig) {
        Ext.Object.each(mixinConfig.deprecated, function(from, to) {
            override.call(this, targetClass, from, to, {
                deprecated: true
            });
        }, this);
    }
*/
Ext.define('Insistent.mixin.Chainable', {
    requires: [
        'Insistent.system.System'
    ],

    config: {
        hostResults: null
    },


    /**
     * For proper communication with mixin and first host request of overloaded function
     *
     * @param {Arguments|String} fnName
     * @returns {String} propertyName
     */
    $buildResultProperty: function(fnName) {
        if (Object.prototype.toString.call(fnName) == '[object Arguments]') {
            fnName = fnName.callee.$name;
        }

        return fnName;
    },


    $pullHostResult: function() {
        var me = this,
            MRTCP = System.MRTCP,
            isDef = System.isPropertyDefined,
            resultFn,
            resultProperty = ((resultFn = me.$buildResultProperty) || (resultFn = me.prototype && me.prototype.$buildResultProperty)) && resultFn.apply(me, arguments),
            resultObj = lookupInMixinsRuntime(resultProperty);

        return resultObj && resultObj._result_;


        function lookupInMixinsRuntime(property) {
            var classInstance = me, done = false,
                mixinRuntimeBase, ownMixinRuntime, fnConfig;

            while ((mixinRuntimeBase = classInstance && classInstance.self && classInstance.self.prototype) && done !== true) {
                if (   !(ownMixinRuntime = mixinRuntimeBase.hasOwnProperty(MRTCP) && mixinRuntimeBase[MRTCP])
                    || !(done = (isDef(ownMixinRuntime, property) && (fnConfig = ownMixinRuntime && ownMixinRuntime[property]) && isDef(fnConfig, '_result_')))
                ) {
                    classInstance = classInstance.superclass;
                }
            }

            return fnConfig;
        }
    },


    onClassExtended: function(cls, data) {
        var MRTCP = System.MRTCP,
            mixinConfig = data.mixinConfig,
            chainableConfig = data.chainableConfig,
            parentClassMixinConfig = cls.superclass.mixinConfig,
            parentChainableConfig = cls.superclass.chainableConfig;

        if (chainableConfig || parentChainableConfig) {
            if (parentChainableConfig) {
                chainableConfig = Ext.merge({}, parentChainableConfig, chainableConfig);
            }

            if (!data.chainableConfig) {
                data.chainableConfig = chainableConfig;
            }
        }

        if (mixinConfig || parentClassMixinConfig) {
            if (parentClassMixinConfig) {
                mixinConfig = data.mixinConfig = Ext.merge({}, parentClassMixinConfig, mixinConfig);
            }

            var mixinId = mixinConfig.id;

            data.mixinId = mixinId;

            Ext.Function.interceptBefore(data, 'onClassMixedIn', function(targetClass) {
                var mixin = this.prototype;

                if (!System.isEmpty(chainableConfig)) {
                    targetClass.addConfig(chainableConfig, true);
                }

                Ext.Object.each(mixinConfig, function (hooksType, functions) {
                    var intercept = hooksType === 'returnMixin',
                        before = hooksType.indexOf('Before') !== -1,
                        after = hooksType.indexOf('After') !== -1,
                        returnable = hooksType.indexOf('return') !== -1,
                        deprecated = hooksType === 'deprecated',
                        override = hooksType === 'override',
                        preventable = hooksType.indexOf('Preventable') !== -1;

                    /*
                                        if (override) {
                                            Ext.Object.each(functions, function(from, hookConfig) {
                                                var to = hookConfig.to;

                                                if (to) {
                                                    delete hookConfig.to;
                                                } else {
                                                    to = true;
                                                }

                                                mixinOverrideMethod.call(this, from, to, hookConfig);
                                            }, this);
                                        }
                    */
                    if (before || after || returnable || deprecated || override || intercept) {
                        var overrideConfig = !override ? {} : null;

                        if (overrideConfig) {
                            if (deprecated) {
                                overrideConfig.deprecated = true;
                            } else {
                                overrideConfig.before = before;
                                overrideConfig.returnable = returnable;
                            }
                            if (preventable) {
                                overrideConfig.preventable = preventable;
                            }
                            if (intercept) {
                                overrideConfig.intercept = intercept;
                                // by interception always execute base at first place
                                overrideConfig.before = false;
                            }
                        }

                        Ext.Object.each(functions, function(from, to) {
                            var toConfig = !Ext.isObject(to) ? overrideConfig : to;
                            if (toConfig) {
                                Ext.applyIf(toConfig, overrideConfig);
                            }

                            mixinOverrideMethod.call(this, from, to, overrideConfig);
                        }, this);
                    }
                }, this);


                function lookupNearestClassForMethod(targetClass, method) {
                    var currentClass = targetClass;

                    do {
                        var classProto = currentClass.prototype || currentClass,
                            isOwnProperty = classProto.hasOwnProperty(method),
                            done = !currentClass || isOwnProperty;

                        if (!done) {
                            currentClass = currentClass && currentClass.superclass;
                        }
                    } while (!done);

                    return currentClass;
                }


                function mixinOverrideMethod(from, to, config, childClass, toFn, baseFn) {
                    var overriddenClass = childClass || targetClass,
                        targetProto = overriddenClass.prototype,
                        targetMixinsRuntime = targetProto.hasOwnProperty(MRTCP) ? targetProto[MRTCP] : null,
                        isStatic = Ext.isFunction(overriddenClass[from]),
                        mixinProto = this.prototype;

                    baseFn = baseFn || lookupBaseFunction(overriddenClass, from);

                    var baseIsAlreadyDelegated = baseFn && baseFn.$delegated,
                        originalBaseFn = baseIsAlreadyDelegated && baseFn.$originalFn,
                        toHasPrio = Ext.isNumber(to) ? to : false,
                        toFnName = to === true || toHasPrio || toHasPrio === 0;

                    if (toFnName) {
                        to = from;
                    }

                    toFn = toFn || lookupMixinFunction(this, to);

                    if (toFn == null) {
//  <debug>
                        var panicMsg = 'Wrong mixin overriding for class/method "' + overriddenClass.$className + '#' + from + '"...';
                        if (mixinProto) {
                            panicMsg += '\nFunction "' + mixinProto.$className + '#' + to + '" is not defined';
                        } else if (!toFn) {
                            panicMsg += '\n"toFn" Function should be explicitly defined';
                        }

                        throw new Error(panicMsg);
//  </debug>
                        //noinspection UnreachableCodeJS
                        return;
                    }

                    if (toFn !== baseFn && toFn !== Ext.emptyFn) {
                        if (!targetMixinsRuntime) {
                            targetMixinsRuntime = targetProto[MRTCP] = {};
                        }

                        var fromFnConfig = targetMixinsRuntime[from];

                        if (!fromFnConfig) {
                            fromFnConfig = targetMixinsRuntime[from] = {};
                        }

                        var inherited = fromFnConfig.baseFnIsInherited;
                        var originalFn = originalBaseFn || baseFn;

                        if (originalFn && !inherited) {
                            if (originalFn !== Ext.emptyFn) {
                                fromFnConfig.baseFn = originalFn;
                            }

                            fromFnConfig.baseFnIsInherited = true;

                            var overriddenFn = function() {
                                var args = Array.prototype.slice.call(arguments);
                                args.unshift(from);
                                var scope = this;

                                return mixinsRuntimeDispatch.apply(scope, args);
                            };

                            if (isStatic) {
                                overriddenClass[from] = overriddenFn;
                            } else {
                                targetProto[from] = overriddenFn;
                            }

                            overriddenFn.$delegated = true;
                            overriddenFn.$originalFn = originalFn;
                        }

                        var fromMixin = fromFnConfig[mixinId];

                        if (toHasPrio === false) {
                            toHasPrio = 0;
                        }

                        if (fromMixin) {
                            var fromMixinArr = Ext.isArray(fromMixin);

                            if (!fromMixinArr) {
                                fromMixinArr = fromFnConfig[mixinId] = [fromMixin];
                                fromMixin = {};
                            }

                            fromMixinArr.push(fromMixin);
                        } else {
                            fromMixin = fromFnConfig[mixinId] = {};
                        }

                        fromMixin.prio = toHasPrio;
                        fromMixin.isStatic = isStatic;

                        fromMixin.fn = toFn;

                        if (config) {
                            Ext.apply(fromMixin, config);
                        }
                    }


                    function lookupBaseFunction(Class, fnName) {
                        var ret = Class[fnName];

                        if (!ret) {
                            ret = Class.prototype[fnName];
                        }

                        return ret ? ret : null;
                    }


                    function lookupMixinFunction(Mixin, fnName) {
                        var ret = Mixin[fnName];

                        if (!ret) {
                            var mixinProto = Mixin.prototype;
                            ret = mixinProto && mixinProto[fnName];
                        }
                        if (!ret) {
                            var mixinInherited = mixinProto.inheritedStatics;
                            ret = mixinInherited && mixinInherited[fnName];
                        }
                        return ret;
                    }
                }


            });
        }
    }
}/*, function(mixinClass) {
    Ext.Class.registerPreprocessor('chainable', function(Class, data) {
        var MRTCP = System.MRTCP;

        try {
            console.log('call postmixins preprocessor for %s', Class.$className);

            // look up use cases where abstract class (say GenericForm) catches a method in mixin,
            // at same time subclass defines its own method instance (instance), which effectively masks
            // superclassed overridden method. We need here explicit generate new override for subclass
            var klass = Class;

            do {
                // targetClass.$className === 'Livestock.view.treatments.Form'
                var runtime = System.getMixinRuntime(klass, false);

                Ext.Object.each(runtime, function(methodName, config) {
                    var fn;

                    if (fn = data[methodName]) {
                        var delegated = fn.$delegated;

                        if (!delegated) {
                            var classRuntime = System.getMixinRuntime(Class, true),
                                fnConfig = System.getMixinFunctionConfig(methodName, classRuntime, true);

                            console.log(' ******** NOT DELEGATED ********* class/method: "%s#%s"', klass.$className, methodName);

                            Ext.Object.each(config, function(mixinId, mixinConfig) {
                                if (mixinId === 'baseFnIsInherited') {
                                    fnConfig[mixinId] = mixinConfig; // true

                                    return;
                                }

                                if (mixinId === 'baseFn') {
                                    // override given function with mixin RTD
                                    var overriddenFn = data[methodName] = function() {
                                        var args = Array.prototype.slice.call(arguments);
                                        args.unshift(methodName);

                                        return mixinsRuntimeDispatch.apply(this, args);
                                    };

                                    overriddenFn.$delegated = true;
                                    overriddenFn.$originalFn = fn;

                                    fnConfig[mixinId] = fn;

                                    return;
                                }

                                fnConfig[mixinId] = Ext.clone(mixinConfig);

                            });
//                        } else {
//                            console.log(' ............. DELEGATED ......... class/method: "%s#%s"', klass.$className, methodName);
                        }
                    }
                });

                klass = klass.superclass;

            } while (klass);

        } catch (e) {
            console.error('Panic error for %s definition.', mixinClass.$className);
            console.debug(e);
        }


    }, true/!*, 'after', 'mixins'*!/);
}*/);


function mixinsRuntimeDispatch(from) {
    var me = this,
        targetProto = this.prototype || this.self.prototype,
        targetMixinsRuntime = System.getMixinRuntime(me, false),
        klass, checkpointKlass, klassMethod, runtime;

    if (!targetMixinsRuntime || !targetMixinsRuntime[from]) {
        klass = me.superclass;

        do {
//             klassProto = klass.prototype || klass.self && klass.self.prototype;
            klassMethod = klass.hasOwnProperty(from) || klass.self && klass.self.hasOwnProperty(from);

            if (klassMethod) {
                runtime = System.getMixinRuntime(klass, false);
                checkpointKlass = klass;
            }

            klass = klass.superclass;
        } while (klass && !runtime);

        if (runtime) {
            targetMixinsRuntime = runtime;
        }
    }

    if (!targetMixinsRuntime) {
        throw new Error ('Panic error in Chainable core. Please file ticket to issues.fairport.com.au with step by step instruction how to reproduce');
    }
    var alreadyExecuted = targetMixinsRuntime.areadyExecuted,
        methodDone,
        ret,
        args = Array.prototype.slice.call(arguments, 1),
        baseFn,
        baseConfig,
        returnable,
        baseMixins = targetProto.mixins,
        fromFnConfig = targetMixinsRuntime[from];

    if (!fromFnConfig) {
        fromFnConfig = targetMixinsRuntime[from] = {};
    }

    var fromMixinConfig,
        deprecated = false,
        baseIsCalled = false,
        execOrdered = fromFnConfig && fromFnConfig.execOrdered;

    baseFn = fromFnConfig.baseFn;

    var superBaseFn = null,
        runtimeScope = baseFn && baseFn.$baseChain,
        inCallParentMode = Boolean(runtimeScope),
        superFnDefinitions = [],
        superExecOrdered = [],
        subKlass;

    klass = runtimeScope || checkpointKlass || me.superclass;
    runtimeScope = null;

    do {
        // this.$className === "Livestock.view.purchases.Operation" && from === 'initialize'
        runtime = System.getMixinRuntime(klass, false);
        var runtimeFnConfig = runtime && runtime[from];

        Ext.Object.each(runtimeFnConfig, function(mixinId, mixinConfig) {
            if (mixinId === 'baseFnIsInherited') {
                return;
            }

            if (mixinId === 'baseFn') {
                if (!inCallParentMode) {
                    if (mixinConfig && !superBaseFn && mixinConfig !== baseFn) {
                        superBaseFn = mixinConfig;
                        runtimeScope = klass;
                    }
                } else {
                    superBaseFn = mixinConfig;
                    runtimeScope = klass.superclass;
                }

                return;
            }

            if (!inCallParentMode) {
                if (mixinId === 'execOrdered') {
                    var cloneOrdered = [];

                    Ext.each([true, false], function(before) {
                        mergeConfigsOrdered(cloneOrdered, before, superExecOrdered, mixinConfig, function(config, isSuperConfig) {
                            if (isSuperConfig) {
                                var superIsReturnable = config.returnable;

                                if (superIsReturnable) {
                                    returnable = true;
                                }
                            }
                        });
                    });

                    superExecOrdered = cloneOrdered;
                } else {
                    if (Ext.isArray(mixinConfig)) {
                        Ext.each(mixinConfig, function(superConfig) {
                            processSuperConfig(superConfig);
                        })
                    } else {
                        processSuperConfig(mixinConfig);
                    }
                }
            }


            function processSuperConfig(superConfig) {
                var configFn = superConfig.fn,
                    found = false;

                Ext.each(superFnDefinitions, function(config) {
                    return !(found = config.fn === configFn);
                });

                if (!found) {
                    if (superConfig.returnable) {
                        returnable = true;
                    }
                    superFnDefinitions.push(superConfig);
                }
            }
        });

        subKlass = klass;

        klass = klass.superclass;

    } while (klass && (!inCallParentMode || !superBaseFn));

    if (inCallParentMode) {
        // emulate me.callParent(arguments)
        baseFn.$baseChain = runtimeScope;

        var execRet = superBaseFn && superBaseFn.apply(me, args);

//         delete baseFn.$baseChain;

        return execRet;
    } else if (superBaseFn) {
        if (!baseFn) {
            baseFn = superBaseFn;
        }

        fromFnConfig.baseFnIsInherited = superBaseFn;
    }

    if (!execOrdered) {
        var prios = [],
            configsPrioritized = [],
            mixinsToDelete = {};

        execOrdered = fromFnConfig.execOrdered = [];

        Ext.Object.each(fromFnConfig, function(mixinId, config) {
            // mixinId == 'navigable'
            if (mixinId === 'execOrdered' || mixinId === 'baseFnIsInherited' || mixinId === 'baseFn') {
                return;
            }

            if (!Ext.isArray(config)) {
                processConfigBefore(config, mixinId);
            } else {
                Ext.each(config, function(config) {
                    processConfigBefore(config, mixinId);
                });
            }
        });

        flushPrioritized(true, configsPrioritized, superExecOrdered, superFnDefinitions);

        if (baseFn && !baseIsCalled && !deprecated) {
            baseConfig = {
                fn: baseFn,
                base: true
            };
            execOrdered.push(baseConfig);
            baseIsCalled = true;
        }

        if (!deprecated) {
            prios = [];
            configsPrioritized = [];

            Ext.Object.each(fromFnConfig, function(mixinId, config) {
                if (mixinId === 'execOrdered' || mixinId === 'baseFn' || mixinId == 'baseFnIsInherited') {
                    return;
                }

                if (!Ext.isArray(config)) {
                    processConfigAfter(config, mixinId);
                } else {
                    Ext.each(config, function(config) {
                        processConfigAfter(config, mixinId);
                    });
                }
            });

            flushPrioritized(false, configsPrioritized, superExecOrdered, superFnDefinitions);
        }

        if (baseConfig && returnable) {
            baseConfig.returnable = returnable;
        }

        Ext.Object.each(mixinsToDelete, function(mixinId) {
            delete fromFnConfig[mixinId];
        })
    }

    if (!alreadyExecuted) {
        alreadyExecuted = targetMixinsRuntime.areadyExecuted = {};
    }

    methodDone = alreadyExecuted[from];

    if (!methodDone) {
        methodDone = alreadyExecuted[from] = [];
    }

    // from === 'initialize' && this.$className === "Livestock.view.treatments.Operation"
    Ext.each(execOrdered, function(config) {
        var execFn = config.fn,
            execRet,
            intercept = config.intercept,
            base = config.base;

        if (base) {
            if (execFn.$originalFn) {
                execFn = execFn.$originalFn;
            }
        }

        if (Ext.Array.contains(methodDone, execFn)) {
            return;
        }

        Ext.Array.include(methodDone, execFn);

        if (!intercept || !base) {
            if (base) {
                execFn.$baseChain = runtimeScope;
            }
            execRet = execFn && execFn.apply(me, args);
            if (base) {
                delete execFn.$baseChain;
            }
        } else {
            execRet = execFn;
        }

        if (config.returnable && execRet !== undefined || intercept && base) {
            fromFnConfig._result_ = execRet;
        }
        if (config.preventable) {
            return false;
        }
    });

    methodDone.length = 0;

    if (fromFnConfig && System.isPropertyDefined(fromFnConfig, '_result_')) {
        ret = fromFnConfig._result_;
        delete fromFnConfig._result_;

        return ret;
    }


    function processConfigAfter(config, mixinId) {
        if (config.before === false) {
            var mixinProto = baseMixins[mixinId],
                mixinFn = config.fn;

//             returnable = returnable || config.returnable;
//                             fromMixinConfig = config;
            if (Ext.isString(mixinFn)) {
                mixinFn = mixinProto[mixinFn];
            }

            var intercept = config.intercept;
            if (intercept && baseConfig) {
                baseConfig.intercept = true;
            }

            var equalsToBase = mixinFn === baseFn;

            if (mixinFn && (!equalsToBase || !baseIsCalled)) {
                insertPrioritized(config, mixinId, false);
            }

            if (!equalsToBase && intercept) {
                delete config.intercept;
            }
        }
    }


    function processConfigBefore(config, mixinId) {
        if (config.returnable) {
            returnable = config.returnable;
        }
        var before = config.before;

        deprecated = config.deprecated;

        if (before === true || deprecated) {
            var mixinProto = baseMixins[mixinId],
                mixinFn = config.fn;

            fromMixinConfig = config;
            if (Ext.isString(mixinFn)) {
                mixinFn = mixinProto[mixinFn];
            }

            if (mixinFn) {
                baseIsCalled = baseIsCalled || mixinFn === fromFnConfig.baseFn;
                insertPrioritized(config, mixinId, true);

//                                    if (deprecated) {
//                                        return false;
//                                    }
            }
        }
    }


    function insertPrioritized(config, mixinId, beforeDirection) {
        var insertedPrio = config.prio,
            positionFound = false,
            length = prios.length;

        for (var executionPosition = 0; executionPosition < length; executionPosition++) {
            var currentPrio = prios[executionPosition];

            if ((currentPrio <= insertedPrio && beforeDirection) || (currentPrio >= insertedPrio && !beforeDirection)) {
                positionFound = true;
                prios.splice(executionPosition, 0, insertedPrio);
                break;
            }
        }

        if (!positionFound) {
            executionPosition = length;
            prios.push(insertedPrio);
        }

        configsPrioritized.splice(executionPosition, 0, config);
        mixinsToDelete[mixinId] = true;
    }


    function flushPrioritized(beforeFlag, currentOrdered, superOrdered, superUnOrdered) {
        var superConfig,
            currentConfig,
            superIndex,
            currentIndex;

        mergeConfigsOrdered(execOrdered, beforeFlag, currentOrdered, superOrdered);

        for (superIndex = 0; superIndex < superUnOrdered.length; superIndex++) {
            superConfig = superUnOrdered[superIndex];

            if (superConfig.before === beforeFlag) {
                var found = false;

                for (currentIndex = 0; currentIndex < execOrdered.length; currentIndex++) {
                    currentConfig = execOrdered[currentIndex];

                    found = superConfig.fn === currentConfig.fn;
                    if (found) {
                        break;
                    }
                }

                if (!found) {
                    for (currentIndex = 0; currentIndex < execOrdered.length; currentIndex++) {
                        currentConfig = execOrdered[currentIndex];

                        if (superConfig.prio <= currentConfig.prio && currentConfig.before === beforeFlag || currentConfig.before !== true && beforeFlag === true) {
                            break;
                        }
                    }

                    execOrdered.splice(currentIndex, 0, superConfig);
                }
            }
        }
    }
}


function mergeConfigsOrdered(execOrdered, beforeFlag, currentOrdered, superOrdered, callback) {
    var superPrio = null,
        currentPrio = null,
        superConfig, currentConfig,
        superLength = superOrdered && superOrdered.length,
        superIndex = superLength ? 0 : null,
        currentLength = currentOrdered && currentOrdered.length,
        currentIndex = currentLength ? 0 : null;

    if (superLength && beforeFlag === false) {
        // find first 'after' position, because superOrdered contains all before/base/after entries
        for (; superIndex < superOrdered.length; superIndex++) {
            var findConfig = superOrdered[superIndex];

            if (findConfig.before === false) {
                break;
            }
        }
    }

    while (superIndex !== null || currentIndex !== null) {
        var dropCurrent = null;

        if (superIndex >= superLength || superIndex === null) {
            superIndex = null;
        } else {
            superConfig = superOrdered[superIndex];
            if (superConfig.before !== beforeFlag) {
                superIndex = null;
            } else {
                superPrio = superConfig.prio;
            }
        }

        if (currentIndex >= currentLength || currentIndex === null) {
            currentIndex = null;
        } else {
            currentConfig = currentOrdered[currentIndex];
            currentPrio = currentConfig.prio;
        }

        if (superIndex !== null && currentIndex !== null) {
            dropCurrent = currentPrio < superPrio;
        } else if (superIndex !== null) {
            dropCurrent = false;
        } else if (currentIndex !== null) {
            dropCurrent = true;
        }

        if (dropCurrent === true) {
            if (callback) {
                Ext.callback(callback, this, [currentConfig], false);
            }
            pushInExecOrdered(currentConfig);
            currentIndex++;
        }

        if (dropCurrent === false) {
            if (callback) {
                Ext.callback(callback, this, [superConfig, true]);
            }

            pushInExecOrdered(superConfig, true);
//            pushInExecOrdered(Ext.clone(superConfig));
            superIndex++;
        }
    }


    function pushInExecOrdered(config, clone) {
        var found = false;
        for (var i = 0; i < execOrdered.length; i++) {
            var ordered = execOrdered[i];
            if (System.areObjectsEqual(ordered, config)) {
                found = true;
                break;
            }
        }
        if (!found) {
            if (clone) {
                config = Ext.clone(config);
            }
            execOrdered.push(config);
        } else {
//            console.log('pretty interesting...')
        }
    }
}
