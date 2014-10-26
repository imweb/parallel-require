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
        foo: 'libs/foo-1.1.3'
    }
});

```