describe('require', function () {
    it('should able to require a js module', function (done) {
        require(['./lib/say'], function (mod) {
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
});