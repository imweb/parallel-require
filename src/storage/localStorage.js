    !function () {
        _initCache(STORAGE_MODULE_NAME);
        _runFactory(STORAGE_MODULE_NAME, function () {
            return {
                get: function (key, name, succ) {
                    var value = localStorage[key + ':' + name];
                    succ && succ.call({ result: value });
                },
                set: function (key, value, succ) {
                    var name = value['path'];
                    localStorage[key + ':' + name] = value;
                    succ && succ();
                },
                clear: function (key) {
                    localStorage.clear();
                }
            }
        });
    }();