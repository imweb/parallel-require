define(['require', 'exports'], function (require, exports) {
    exports.say = 'world';
    exports.sayHello = function (name) {
        return 'Hello, ' + name + '!';
    };
});