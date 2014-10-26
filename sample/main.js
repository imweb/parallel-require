define('./main', ['./mod/lib'], function (require, exports, module) {
    module.exports = {
        init: function () {
            document.getElementById('test').innerHTML = require('./mod/lib').word;
        },
        render: function (data) {
            document.getElementById('test').innerHTML += data.name;
            console.log(performance.now() - T[0]);
        }
    }
});