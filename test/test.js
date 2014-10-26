describe('require', function () {
    require.config({
         paths: {
            'jquery': 'http://7.url.cn/edu/jslib/jquery/1.9.1/jquery.min.js'
        }
    })

    it('should able to require a js module', function (done) {
        require(['./lib/say'], function (mod) {
            console.dir(mod);
            mod.say.should.equal('world');
            mod.sayHello('Daniel').should.equal('Hello, Daniel!');
            done();
        });
    });

    it('should able to define a task', function (done) {
        require([function (cb) {
            setTimeout(function () {
                cb(null, 'world');
            }, 20);
        }], function (word) {
            word.should.equal('world');
            done();
        });
    });

    it('should able to load dependence', function (done) {
        require(['./lib/main'], function (main) {
            main().should.equal('Hello, Daniel!');
            done();
        });
    });

    it('should able to get a name module', function (done) {
        require(['jquery'], function ($) {
            console.log($);
            done();
        })
    });
});