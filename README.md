### gulp-rev 模块解决静态缓存浅析

- #### 问题的起源

    这应该关系到浏览器的加载机制，当页面第一次加载的时候，页面上的资源也会随着加载，以后浏览器为了避免过多的性能损耗就不会再次加载，会把这些资源放在缓存中，下次加载的时候直接从缓存中加载进来，具体见下图：
    ```
    Status Code:200  (from disk cache)
    
    ```
    ```
    Status Code:200  (from memory cache)
    ```
    这个可以在***chrome***浏览器控制台中看到，这就是两种缓存的方式，具体是什么，有兴趣的同学可以自行研究（因为我也不懂，哈哈哈）。
    
- #### gulp-rev 和 gulp-rev-collector的引入
    
    具体的gulp配置就略过了，直接上目录：
    ```
    ├── src
    │   ├── js
    │   │   └── main.js
    │   └── less
    │       └── main.less
    ├── gulp-config.js
    ├── gulpfile.js
    ├── package.json
    └── index.html
    ```
    其中```index.html```中的内容是：
    ```
    <!DOCTYPE html>
    <html lang="zh">
    <head>
    	<meta charset="UTF-8">
    	<title>Document</title>
    	<link rel="stylesheet" href="./build/css/main.css">
    </head>
    <body>
    	<div class="box">
    		<div class="child">left11</div>
    		<div class="child">right2</div>
    	</div>
    <script src="./src/js/main.js"></script>
    </body>
    </html>
    ```
    ```package.json```中用到的模块有：
    ```
    "devDependencies": {
        "browser-sync": "^2.18.12",
        "gulp": "^3.9.1",
        "gulp-autoprefixer": "^4.0.0",
        "gulp-clean": "^0.3.2",
        "gulp-less": "^3.3.0",
        "gulp-load-plugins": "^1.5.0",
        "gulp-minify-css": "^1.2.4",
        "gulp-rename": "^1.2.2",
        "gulp-rev": "^7.1.2",
        "gulp-rev-collector": "^1.2.2",
        "gulp-sync": "^0.1.4"
    }
    ```
    首先，我们现在```gulpfile.js```中引入这两个模块，
    ```
    const rev = require('gulp-rev');
    const revCollector = require('gulp-rev-collector');
    ```
    其中第一个的作用是修改文件后缀名的，第二个的作用是替换目标文件中对应的路径。
    
- #### 模块的使用
    
    在```gulpfile.js```中编写用到这两个模块的任务，第一个是```less```任务：
    ```
    gulp.task('less',function(){
        return gulp.src(cfg.less.src)
        	    .pipe(plugins.less(cfg.less.settings))
                .pipe(plugins.autoprefixer({ 
                	browsers: ['> 0.2%', 'last 3 versions', 'last 5 Android versions'],
                	cascade: true, 
        	        remove:true 
                }))
                .pipe(plugins.minifyCss())
                //以上可以忽略
                .pipe(rev())  //应用rev模块改变编译生成的文件名字
                .pipe(gulp.dest(cfg.less.dest))//生成文件存储位置
                .pipe(rev.manifest()) //生成rev-manifest.json文件
                .pipe(gulp.dest(cfg.less.rev));//json文件存放位置
    });
    ```
    其中生成的```rev-manifest.json```文件内容：
    ```
    {
        "main.css": "main-e89992e5b6.css"
    }
    ```
    注意，此时编译生成的文件名字就是这个名字,比如：
    ```
    ├── build
    │   └── css
    │       └──main-e89992e5b6.css
    ```
    接下来就是要改变```index.html```中的引用路径：
    ```
    gulp.task('rev',function(){
        return gulp.src([cfg.rev.revJson, cfg.rev.src])//引入json文件和要替换的资源所在文件的路径
            .pipe(revCollector({replaceReved: true}))//替换
            .pipe(gulp.dest(cfg.rev.dest));//把替换好的文件重新生成
    });
    ```
    重新生成的```html```文件如下：
    ```
    <link rel="stylesheet" href="./build/css/main-e89992e5b6.css">
    ```
    到这里就算完成了。
    
    其中***gulp***的大致进程如下：
    ```
    [10:51:00] Finished 'clean' after 331 ms
    [10:51:00] Finished 'sync group1:1' after 332 ms
    [10:51:00] Starting 'sync group1:2'...
    [10:51:00] Starting 'less'...
    [10:51:01] Finished 'less' after 1.2 s
    [10:51:01] Finished 'sync group1:2' after 1.2 s
    [10:51:01] Starting 'sync group1:3'...
    [10:51:01] Starting 'rev'...
    [10:51:01] Finished 'rev' after 24 ms
    [10:51:01] Finished 'sync group1:3' after 25 ms
    ```
    可以看出，任务进程是有条理的在进行。

- #### 生成版本号
    
    在某些情况下是要我们在文件名后面生成版本号的，具体流程和上面是一样的，主要区别就是生成的名字变了下，所以要更改一下这个两个模块中的代码。具体如下：
    ```
    1. 打开node_modules\gulp-rev\index.js
        第133行 manifest[originalFile] = revisionedFile;
        更新为: manifest[originalFile] = originalFile + '?v=' + file.revHash;
    2. 打开node_modules\rev-path\index.js
        10行 return filename + '-' + hash + ext;
        更新为: return filename + ext;
    3. 打开node_modules\gulp-rev-collector\index.js
        40行 path.basename(json[key]).replace(new RegExp( opts.revSuffix ), '' )
        更新为: path.basename(json[key]).split('?')[0]
    4. 打开node_modules\gulp-rev-collector\index.js
        163行 prefixDelim + pattern , 'g' 
        更新为: prefixDelim + pattern + '(\\?v=\\w{10})?', 'g' 
    ```
    更改了这些之后，你会发现便已生成的文件名字不会变，这是正常的，因为我们实在文件后面以传参数的形式增加版本号，所以浏览器加载资源的时候是不识别的，只会读到 **?** 号之前的路径，所以编译生成的文件名不会变。
    
    项目地址：[gulp-rev](https://github.com/huochezaodian/gulp-rev)
