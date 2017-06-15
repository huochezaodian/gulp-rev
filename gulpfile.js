const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();
const rev = require('gulp-rev');
const revCollector = require('gulp-rev-collector');
const gulpSync = require('gulp-sync')(gulp);
const cfg = require('./gulp-config.js');
const browsersync = require("browser-sync").create();

//清理文件
gulp.task('clean',function(){
	return gulp.src(cfg.clean.src)
		.pipe(plugins.clean());
});

//处理less文件
gulp.task('less',function(){
	return gulp.src(cfg.less.src)
		.pipe(plugins.less(cfg.less.settings))
        .pipe(plugins.autoprefixer({ 
        		browsers: ['> 0.2%', 'last 3 versions', 'last 5 Android versions'],
        		cascade: true, 
	            remove:true 
        	}))
        .pipe(plugins.minifyCss())
        .pipe(rev())  
        .pipe(gulp.dest(cfg.less.dest))
        .pipe(rev.manifest()) 
        .pipe(gulp.dest(cfg.less.rev));
});

//替换html里面的css
gulp.task('rev',function(){
	return gulp.src([cfg.rev.revJson, cfg.rev.src])
        .pipe(revCollector({replaceReved: true}))
        .pipe(gulp.dest(cfg.rev.dest));
        //.pipe(plugins.connect.reload());
});

//实时监控
gulp.task('lessWatch', function () {
	//plugins.livereload.listen(8081);
    gulp.watch(cfg.less.all, gulpSync.sync(['clean', 'less', 'rev','browsersync'])); 
});

//本地服务
 
// gulp.task('server', function () {
//     plugins.connect.server({
//     	root:'F:/gulp-rev/index.html',
//         port:8083,
//         livereload:true,
//     });
// });

gulp.task("browsersync",function(){
    browsersync.init({
        files:"./index.html",
        server:{baseDir:'./'}
        //proxy:"localhost:8083" //代理
    });
});

gulp.task('default', gulpSync.sync(['browsersync', 'clean', 'less', 'rev', 'lessWatch']));