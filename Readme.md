#parallel-require

> 基于async-parallel模型的require扩展实现。

### 奇葩场景

我要并行加载一个main.js和一个jsonp数据data，但是运行顺序是：
* main.init()
* main.render(data)

很显然，通常的require解决不了这个问题，所以就有了parallel-require。

### async-parallel

并发地运行多个异步task，并在所有task完成后回调，经典例子：

``` javascript
parallel([
  function (callback) {
    setTimeout(function () {
      callback(null, 'one')
    }, 200)
  },
  function (callback) {
    setTimeout(function () {
      callback(null, 'two')
    }, 100)
  }
],
// 可选回调
function (err, results) {
  // results 将会是 ['one','two']
})
```

有趣，这模型和require本身非常像，所以parallel-require就是把这两个模型搅在一起了。

### parallel-require

上面的奇葩场景怎么执行呢？看看下面的例子：

``` javascript
// 外部并行两个task
require([function (done) {
    // 一个task是require了main.js，并运行mian.init()
	require(['./main'], function (main) {
		main.init();
		done(null, main);
	});
}, function (done) {
    // 第二个task是require了jsonp
	require(['http://localhost/data?jsonpcallback=define'], function (data) {
		done(null, data);
	})
}], function (main, data) {
    // 所有task结束了回调main.render(data)
	main.render(data);
})
```

Good，我们成功解决了奇葩场景的问题。

### 再来个例子

比如我们想用XMLHTTPRequest弄点东东回来，再和main.js一起运行

```
require(['./main', function (done) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            var sta = xhr.status;
            if (sta == 200 || sta == 304) {
                done(null, xhr.dataType !== 'xml' ? xhr.responseText : xhr.responseXML);
            }else{
                done(new Error('' + sta));
            }
        }
    };
    xhr.open('GET', 'http://localhost/data?id=1', true);
    xhr.send();
}], function (main, data) {
    main.init(data);
});
```

### 编写规范

基于简化版的AMD规范：

```javascript

// 同步加载模块
require('./myMod');

// 异步加载模块
require(['./myMod'], function (myMod) {
  console.log(myMod);
});

// 模块定义
define(['./dep'], function (dep) {
  function init() {
    // 初始化
  }
  // 返回
  return init;
});

define(['require', 'exports', 'module', './dep'], function (require, exports, module) {
  var dep = require('./dep');

  function init() {
    // 初始化
  }

  // 返回
  module.exports = init;
});

// 设置命名库
require.config({
  paths: {
    // 当没有.js?时候会自动添加.js
    foo: 'libs/foo-1.1.3'
    // 当存在.js?时，则不会添加，别问我为什么，腾讯的需求＝ ＝
    mqq: 'http://1.url.cn/mqq.js?bid=123'
  }
});

// 设置shim
require.config({
  paths: {
    zepto: 'http://pub.idqqimg.com/guagua/qiqimobile/js/libs/zepto.min-e0859e89'
  },
  shim: {
    zepto: {
      // 目前只提供exports，暂不考虑提供其他能力
      exports: 'Zepto'
    }
  }
});
```

### 使用指南
> 由于是AMD的简化版，所以parallel-require有自己的适用场景，超出适用场景便不建议使用了。

* 较复杂的`Web APP`或`Hybrid APP`
* HTML非直出，甚至HTML可能利用浏览器或APP缓存机制缓存起来
* 加载器被inline到HTML中