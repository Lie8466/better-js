var utils = require('./utils');

var _window =
  typeof window !== 'undefined'
    ? window
    : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var betterJs = _window.betterJs;
if (!betterJs) {
    var betterJs = {};
    betterJs.prototype.init = function (options) {
        var defaultConfig = {
            jsError: true,
            resourceError: true,
            ajaxError: true,
            consoleError: false, // console.error默认不处理
            scriptError: false, // 跨域js错误，默认不处理，因为没有任何信息
            vue: true,
            autoReport: true,
            filters: [], // 过滤器，命中的不上报
            levels: ['info', 'warning', 'error'],
            category: ['js', 'resource', 'ajax']
        }
        var config = _.merge(defaultConfig, options);

        if (!config.scriptError) {
            config.filters.push(function () {return /^Script error\.?$/.test(arguments[0]);})
        }

        // 处理过滤器
        var _oldSendError = config.sendError;
        config.sendError = function (title, msg, level, category, tags) {
            try {
                var isFilter = config.filters.some(func => {
                    return utils.isFunction(func) && func.apply(this, arguments);
                })
                if (isFilter) {return}
                _oldSendError.apply(this, arguments);
                if (config.autoReport) {return}
                // TODO ajax上报
            }
            catch (e) {
                _oldSendError({
                    title: 'betterJs',
                    msg: e,
                    category: 'js'
                })
            }
        }


        var _window = typeof window !== 'undefined' ? window
        : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};
        if (config.jsError) {
            utils.handleWindowError(_window, config);
        }
        if (config.resourceError) {
            utils.handleResourceError(_window, config);
        }
        if (config.ajaxError) {
            utils.handleAjaxError(_window, config);
        }
        if (config.consoleError) {
            utils.handleConsoleError(_window, config);
        }
        if (config.vue) {
            utils.handleVueError(_window, config);
        }
    }
}

_window.betterJs = betterJs;