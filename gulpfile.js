var gulp = require('gulp');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var jsFiles = ['*.js', 'src/**/*.js'];
var nodemon = require('gulp-nodemon');
var Candyman = require('candyman');

var candyman = new Candyman({
   targetDevices: [
       { devicename: 'housemouse', hostname: 'housemouse.local' }
   ],
   projectName: 'housemouse',
   user: 'pi',
   password: 'pandora',
   startFile: 'app.js' 
});

gulp.task('default', function () {
    console.log('running the default gulp task');
});

gulp.task('dev', function() {
    var options = {
        script: 'app.js',
        delayTime: 1,
        args: ['-f','./certs'],
        watch: jsFiles  
    };
    return nodemon(options)
        .on('restart', function(ev) {
            console.log('Restarting...');
        });
});

gulp.task('start', function() {
    var options = {
        script: 'app.js',
        delayTime: 1,
        watch: jsFiles  
    };
    return nodemon(options)
        .on('restart', function(ev) {
            console.log('Restarting...');
        });
});

gulp.task('style', function(){
   return gulp.src(jsFiles)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish', {
        verbose: true
    }))
    .pipe(jscs()); 
});

gulp.task('deploy', function () {
    return candyman.deploy();
});
