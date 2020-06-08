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
    var _oldWindowError = _window.onerror;
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
            _oldWindowError && _oldWindowError.apply(window, arguments);
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

var _handleFetchError = function (_window, config) {
    if(!_window.fetch) return;
    let _oldFetch = _window.fetch;
    _window.fetch = function () {
        return _oldFetch.apply(this, arguments)
        .then(res => {
            if (!res.ok) { // True if status is HTTP 2xx
                config.sendError({
                    title: arguments[0],
                    msg: JSON.stringify(res),
                    category: 'ajax',
                    level: 'error'
                });
            }
            return res;
        })
        .catch(error => {
            config.sendError({
                title: arguments[0],
                msg: JSON.stringify({
                    message: error.message,
                    stack: error.stack
                }),
                category: 'ajax',
                level: 'error'
            });
            throw error;
        })
    }
}

var handleAjaxError = function (_window, config) {
    var protocol = _window.location.protocol;
    if (protocol === 'file:') return;

    // 处理fetch
    _handleFetchError(_window, config);

    // 处理XMLHttpRequest
    if (!_window.XMLHttpRequest) {
        return;
    }
    var xmlhttp = _window.XMLHttpRequest;

    var _oldSend = xmlhttp.prototype.send;
    var _handleEvent = function (event) {
        if (event && event.currentTarget && event.currentTarget.status !== 200) {
            config.sendError({
                title: event.target.responseURL,
                msg: JSON.stringify({
                    response: event.target.response,
                    responseURL:  event.target.responseURL,
                    status: event.target.status,
                    statusText: event.target.statusText
                }),
                category: 'ajax',
                level: 'error'
            });
        }
    }
    xmlhttp.prototype.send = function () {
        if (this['addEventListener']) {
            this['addEventListener']('error', _handleEvent);
            this['addEventListener']('load', _handleEvent);
            this['addEventListener']('abort', _handleEvent);
        } else {
            var _oldStateChange = this['onreadystatechange'];
            this['onreadystatechange'] = function (event) {
                if (this.readyState === 4) {
                    _handleEvent(event);
                }
                _oldStateChange && _oldStateChange.apply(this, arguments);
            };
        }
        return _oldSend.apply(this, arguments);
    }
}

var handleConsoleError = function (_window, config) {
    if (!_window.console || !_window.console.error) return;

    var _oldConsoleError = _window.console.error;
    _window.console.error = function () {
        config.sendError({
            title: 'consoleError',
            msg: JSON.stringify(arguments.join(',')),
            category: 'js',
            level: 'error'
        });
        _oldConsoleError && _oldConsoleError.apply(_window, arguments);
    };
}

var handleVueError = function (_window, config) {
    var vue = _window.Vue;
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
            _oldVueError.call(this, error, vm, info);
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