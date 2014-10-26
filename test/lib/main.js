define(['./say', './data'], function (mod, data) {
    return function () {
        return mod.sayHello(data.name);
    };
});