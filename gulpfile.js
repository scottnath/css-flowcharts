'use strict';
var gulp = require('gulp');
var path = require('path');
var fs = require('fs');

global.$ = require('gulp-load-plugins')({
  pattern: [
    'gulp-*',
    'browser-sync',
    'chalk',
    'map-stream'
  ]
});

global.reload = $.browserSync.reload;


global.onError = function (err) {
  beep([0, 0, 0]);
  $.util.log($.util.colors.green(err));
};

// chalk config
global.errorLog  = $.chalk.red.bold;
global.hintLog   = $.chalk.blue;
global.changeLog = $.chalk.red;


global.server = {
  host: 'localhost',
  devPort: '8001',
  prodPort: '9001'
};
global.SETTINGS = {
  src: {
    app: '', // dev application folder
    css: 'styles/', // compiled css folder
    cssMain: 'styles/styles.css', // main compiled css file
    styles: [ // SASS files
      'styles/styles.scss'], // calls main style sass file, which imports the others
    build: 'build', // build folder
    htmlMain: 'index.html'
   }
};

gulp.task('help', $.taskListing);

/*********************************************
Compass compilation
*/
gulp.task('dev:compass', function() {
  console.log('-------------------------------------------------- DEVELOPMENT: Compass .scss conversion');

  return gulp.src(SETTINGS.src.styles)
  	.pipe($.print())
    .pipe($.compass({
      config_file: 'config.rb',
      css: 'styles',
      sass: 'styles',
      bundle_exec: true
    }))
    .on('error', function(err) {
      // Nath: compass errors happen multiple times - need to controll this
    })
    .pipe(gulp.dest(SETTINGS.src.css))
    .pipe(reload({stream:true}));
});

/*********************************************
Browser-Sync Server
*/
gulp.task('serve', ['dev:watch'], function () {

  console.log('------------------>>>> firing DEV server  <<<<-----------------------');
  $.browserSync.init(null, {
    server: {
      baseDir: '.'
    },
    debugInfo: false,
    open: true,
    host: server.host,
    port: server.devPort
  }, function (err, bs) {
    console.log('Started connect web server on ' + server.host + ':' + server.devPort);
  });
});
/*********************************************
WATCH Tasks specific to development
*/
gulp.task('dev:watch', function(){
  gulp.watch(SETTINGS.src.styles, ['dev:compass']);
});

/*********************************************
CLEAN Build folder and sub-parts
*/
var cleanFiles = function (files, logMessage) {
  console.log('-------------------------------------------------- CLEAN :' + logMessage);
  return gulp.src(files, {read: false}).pipe($.rimraf({force: true}));
};

gulp.task('build:clean', function () {
  return cleanFiles([SETTINGS.src.build], 'all files');
});
/*********************************************
BUILD: Production Version of system
*/
gulp.task('build', ['build:clean'], function(){


  console.log('-------------------------------------------------- BUILD: Production-Ready ');
  var assets = $.useref.assets();
  return gulp.src(SETTINGS.src.htmlMain)
    .pipe(assets) // useref is looking for all the assets in our build blocks in main html file
    .pipe($.rev()) // creates out file revision names of those assets

    // START: Process css files
    .pipe($.print())
    .pipe($.minifyCss({keepSpecialComments: '*'}))
    // END: Process css files

    .pipe(assets.restore())
    .pipe($.useref()) // looks for build blocks
    .pipe($.revReplace()) // replaces pointers to our new, revision-named assets
    .pipe(gulp.dest(SETTINGS.src.build)); // uses our new html file to build the /build main html file
});

/*********************************************
Deploy to GitHub Pages
Places /build directory into gh-pages branch, pushes branch to github
*/
gulp.task('deploy:ghPages', ['build'], function () {
  console.log('-------------------------------------------------- BUILD: Deploy to GitHub Pages ');
    return gulp.src(SETTINGS.src.build + '/**/*')
      .pipe($.print())
      .pipe($.ghPages());
});


gulp.task('default', ['serve']);

