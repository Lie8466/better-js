function isFunction(what) {return typeof what === 'function';}

function isUndefined(what) { return what === void 0;}

function hasKey(object, key) { return Object.prototype.hasOwnProperty.call(object, key);}

function each(obj, callback) {
    var i, j;
  
    if (isUndefined(obj.length)) {
      for (i in obj) {
        if (hasKey(obj, i)) {
          callback.call(null, i, obj[i]);
        }
      }
    } else {
      j = obj.length;
      if (j) {
        for (i = 0; i < j; i++) {
          callback.call(null, i, obj[i]);
        }
      }
    }
}

function objectMerge(obj1, obj2) {
    if (!obj2) {
        return obj1;
    }
    each(obj2, function(key, value) {
        obj1[key] = value;
    });
    return obj1;
}

var handleWindowError = function (_window, config) {
    _oldWindowError = _window.onerror;
    _window.onerror = function (msg, url, line, col, error) {
        if (error && error.stack) {
            config.sendError({
                title: msg,
                msg: error.stack,
                category: 'js',
                level: 'error'
            });
        } else if (typeof msg === 'string') {
            config.sendError({
                title: msg,
                msg: JSON.stringify({
                    resourceUrl: url,
                    rowNum: line,
                    colNum: col
                }),
                category: 'js',
                level: 'error'
            });
        }
        if (_oldWindowError && isFunction(_oldWindowError)) {
            windowError && windowError.apply(window, arguments);
        }
    }
    
}
var handleRejectPromise = function (_window, config) {
    _window.addEventListener('unhandledrejection', function (event) {
        if (event) {
            var reason = event.reason;
            config.sendError({
                title: 'unhandledrejection',
                msg: reason,
                category: 'js',
                level: 'error'
            });
        }
    }, true);
}

var handleResourceError = function (_window, config) {
    _window.addEventListener('error', function (event) {
        if (event) {
            var target = event.target || event.srcElement;
            var isElementTarget = target instanceof HTMLScriptElement || target instanceof HTMLLinkElement || target instanceof HTMLImageElement;
            if (!isElementTarget) return; // js error不再处理
            
            var url = target.src || target.href;
            config.sendError({
                title: target.nodeName,
                msg: url,
                category: 'resource',
                level: 'error'
            });
        }
    }, true);
}

var handleAjaxError = function (_window, config) {

}

var handleConsoleError = function (_window, config) {
    if (!_window.console || !_window.console.error) return;

    var _oldConsoleError = _window.console.error;
    window.console.error = function () {
        config.sendError({
            title: 'consoleError',
            msg: JSON.stringify(arguments.join(',')),
            category: 'js',
            level: 'error'
        });
        _oldConsoleError && _oldConsoleError.apply(window, arguments);
    };
}

var handleVueError = function (_window, config) {
    var vue = window.Vue;
    if (!vue || !vue.config) return; // 没有找到vue实例
    var _oldVueError = vue.config.errorHandler;

    Vue.config.errorHandler = function VueErrorHandler(error, vm, info) {
        var metaData = {};
        if (Object.prototype.toString.call(vm) === '[object Object]') {
            metaData.componentName = vm._isVue ? vm.$options.name || vm.$options._componentTag : vm.name;
            metaData.propsData = vm.$options.propsData;
        }
        config.sendError({
            title: 'vue Error',
            msg: metaData + info,
            category: 'js',
            level: 'error'
        });
    
        if (_oldVueError && isFunction(_oldVueError)) {
          _oldOnError.call(this, error, vm, info);
        }
      };
}

module.exports = {
    isFunction,
    objectMerge,
    handleWindowError,
    handleRejectPromise,
    handleConsoleError,
    handleResourceError,
    handleAjaxError,
    handleVueError
};