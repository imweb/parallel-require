    !function () {
        var request = indexedDB.open('ke', 1);
        _initCache(STORAGE_MODULE_NAME);
        request.onerror = function (e) {
            console.error(e);
        };
        request.onsuccess = function () {
            var db  = this.result;
            function _bind(data, succ, fail) {
                data.onsuccess = succ;
                data.onerror = fail;
            }
            _runFactory(STORAGE_MODULE_NAME, function () {
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
            [MODULE_CACHE_KEY, CGI_CACHE_KEY].forEach(function (key) {
                db.createObjectStore(key, { keyPath: 'path' });
            });
        };
    }();