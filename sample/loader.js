(function (root) {
    'use strict';

    var Cache = {},
        _sim = {},
        _stack = [],
        _head = document.getElementsByTagName('head')[0],
        _require,
        _base,
        MODULE_CACHE_KEY = 'module',
        CGI_CACHE_KEY = 'cgi',
        INDEXEDDB_MODULE_NAME = 'indexedDB',
        DOT_RE = /\/\.\//g,
        DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//,
        DOUBLE_SLASH_RE = /([^:/])\/\//g;

    function _isFunction(f) {
        return typeof f === 'function';
    }

    function _normalize(base, id) {
        if (_isUnnormalId(id)) return id;
        if (_isRelativePath(id)) return _resolvePath(base, id) + '.js';
        return id;
    }

    function _isUnnormalId(id) {
        return (/^https?:|^file:|^\/|\.js$/).test(id);
    }

    function _isRelativePath(path) {
        return (path + '').indexOf('.') === 0;
    }

    function _resolvePath(base, path) {
        path = base.substring(0, base.lastIndexOf('/') + 1) + path;
        path = path.replace(DOT_RE, '/');
        while (path.match(DOUBLE_DOT_RE)) {
            path = path.replace(DOUBLE_DOT_RE, '/');
        }
        return path = path.replace(DOUBLE_SLASH_RE, '$1/');
    }

    // just a async parallel
    function parallel(tasks, cb) {
        var results, pending, keys;
        if (Array.isArray(tasks)) {
            results = [];
            pending = tasks.length;
        } else {
            keys = Object.keys(tasks);
            results = {};
            pending = keys.length;
        }

        function done(i, err, result) {
            results[i] = result;
            if (--pending === 0 || err) {
                cb && cb(err, results);
                cb = null;
            }
        }

        if (!pending) {
            cb && cb(null, results);
            cb = null;
        } else if (keys) {
            keys.forEach(function (key) {
                tasks[key](done.bind(undefined, key));
            });
        } else {
            tasks.forEach(function (task, i) {
                task(done.bind(undefined, i));
            });
        }
    }

    // like a sync require
    function _getMod(opt) {
        var name = opt.name,
            base = opt.base,
            path = _normalize(base, name),
            mod;
        return (mod = Cache[path]) ?
            mod.exports : false; 
    }

    function _initCache(path) {
        return Cache[path] = {
            dones: [], 
            url: _sim[path] || path, 
            loaded: false
        };
    }

    function _save(path) {
        var db = require(INDEXEDDB_MODULE_NAME),
            mod = Cache[path];

        db && (mod.factory ?
            db.set(MODULE_CACHE_KEY, {
                path: path,
                factory: mod.factory.toString(),
                deps: JSON.stringify(mod.deps)
            }) : db.set(MODULE_CACHE_KEY, {
                path: path,
                json: JSON.stringify(mod.json)
            }));
    }

    function _runFactory(path, factory, deps, saved) {
        var mod = Cache[path],
            r = makeRequire({ base: mod.url });
        function _run() {
            if (_isFunction(factory)) {
                var module = { exports: {} },
                    exports = factory(makeRequire({ base: mod.url }), module.exports, module) ||
                        module.exports;
                mod.factory = factory;
                mod.exports = exports;
            } else {
                mod.json = factory;
                mod.exports = factory;
            }
            mod.dones.forEach(function (done) {
                done(null, mod.exports);
            });
            mod.dones.length = 0;
            saved && _save(path);
        }
        if (deps) {
            mod.deps = deps.slice(0);
            setTimeout(function () {
                r(deps, _run);
            }, 0);
        } else {
            _run();
        }
    }

    function _makeMod(src) {
        _stack.forEach(function (o) {
            if (!o.m) o.m = src;
            var path = _normalize(src, o.m),
                factory = o.f,
                mod = Cache[path];
            if (!mod) {
                mod = _initCache(path);
                _runFactory(path, factory, o.d, true);
            }
            !mod.exports && _runFactory(path, factory, o.d, true);
        });
        _stack.length = 0;
    }

    function _loadScript(path) {
        var node = document.createElement('script'),
            mod = Cache[path];
        node.addEventListener('load', _onload, false);
        node.addEventListener('error', _onerror, false);
        node.type = 'text/javascript';
        node.src = mod.url;
        _head.appendChild(node);
        function _onload() {
            _onend();
            return _makeMod(path);
        }
        function _onerror() {
            _onend();
            _head.removeChild(node);
            // TODO
            mod.dones.forEach(function (done) {
                done(new Error(404));
            });
            mod.dones.length = 0;
        }
        function _onend() {
            node.removeEventListener('load', _onload, false);
            node.removeEventListener('error', _onerror, false);
        }
    }

    function _buildCallback(opt) {
        var name = opt.name,
            base = opt.base,
            path = _normalize(base, name),
            mod = Cache[path],
            db = require(INDEXEDDB_MODULE_NAME);

        return function (done) {
            if (!mod) {
                mod = _initCache(path);
                mod.dones.push(done);
                if (!db) { 
                    _loadScript(path);
                } else {
                    db.get(MODULE_CACHE_KEY, path, function (e) {
                        var data = this.result;
                        if (!data) {
                            _loadScript(path);
                        } else if (data.factory) {
                            var res = eval.call(window, '(' + data.factory + ')');
                            _runFactory(path, res, JSON.parse(data.deps));
                        } else if (data.json) {
                            _runFactory(path, JSON.parse(data.json));
                        }
                    });
                }
            } else {
                if ('exports' in mod) {
                    done(null, mod.exports);
                } else {
                    mod.dones.push(done);
                }
            }
        }
    }

    function makeRequire(opt) {
        // baseUrl
        var base = opt.base;
        function _r(deps, succ, fail) {
            // async
            if (succ) {
                deps.forEach(function (dep, i) {
                    // need build a callback
                    if (typeof dep === 'string') {
                        deps[i] = _buildCallback({
                            name: dep,
                            base: base
                        });
                    }
                });
                parallel(deps, function (err, results) {
                    if (err) return err();
                    succ.apply(undefined, results);
                });
            // sync
            } else {
                return _getMod({
                    name: deps,
                    base: base
                });
            }
        }
        return _r;
    }

    function require() {
        if (_require) return _require.apply(root, arguments);
        if (_base) {
            _require = makeRequire({ base: _base });
        } else {
            _require = makeRequire({ base: location.href });
        }
        return _require.apply(root, arguments);
    }

    /**
     * define(module, deps, factory)
     * define(module, factory)
     * define(factory)
     */
    function define(module, deps, factory) {
        if (!factory) {
            if (!deps) {
                factory = module;
                module = undefined;
            } else {
                factory = deps;
            }
            deps = null;
        }
        _stack.push({
            m: module,
            d: deps,
            f: factory
        });
    }

    !function () {
        var request = indexedDB.open('dwarf', 1);
        _initCache(INDEXEDDB_MODULE_NAME);
        request.onerror = function (e) {
            console.error(e);
        };
        request.onsuccess = function () {
            var db  = this.result;
            function _bind(data, succ, fail) {
                data.onsuccess = succ;
                data.onerror = fail;
            }
            _runFactory(INDEXEDDB_MODULE_NAME, function () {
                return {
                    get: function (key, name, succ, fail) {
                        var tran = db.transaction(key),
                            store = tran.objectStore(key),
                            data = store.get(name);
                        _bind(data, succ, fail);
                    },
                    set: function (key, value, succ, fail) {
                        var tran = db.transaction(key, 'readwrite'),
                            store = tran.objectStore(key),
                            data = store.add(value);
                        _bind(data, succ, fail);
                    },
                    clear: function (key, succ, fail) {
                        var tran = db.transaction(key, 'readwrite'),
                            store = tran.objectStore(key),
                            data = store.clear();
                        _bind(data, succ, fail);
                    }
                };
            });
        };
        request.onupgradeneeded = function () {
            var db = this.result;
            db.createObjectStore(MODULE_CACHE_KEY, { keyPath: 'path' });
            db.createObjectStore(CGI_CACHE_KEY, { keyPath: 'path' });
        };
    }();

    root.define = define;
    root.require = require;

})(window);