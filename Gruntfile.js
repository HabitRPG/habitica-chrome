/*global module:false*/
module.exports = function(grunt) {
  var fs = require('fs');

  var core = [
      'common/js/else/defaults.js', 
      'common/js/core/utilies.js', 
      'common/js/core/activators.js', 
      'common/js/core/sitewatcher.js', 
      'common/js/core/todos.js', 
      'common/js/core/tomatoes.js', 
      'common/js/core/habitrpg.js'
  ];
    
  // Project configuration.
  grunt.initConfig({

    jshint: {
      opera: ['opera/*.js'],
      safari: ['safari/*.js'],
      chrome: ['chrome/*.js', 'common/js/else/*.js'],
      firefox: ['firefox/*.js'],
      core: core,
      binds: ['common/js/binds/*.js'],
      test: ['common/js/test/*/*.js']
    },

    concat: {
      chrome: {
        files: attachBindConcats('chrome', {
            'builds/chrome/background.js': core.concat(['chrome/app.js']),
            'builds/chrome/popup.js': ['chrome/popup.js', 'common/js/else/popup.js'],
            'builds/chrome/options.js': ['common/js/else/defaults.js', 'common/js/else/options.js']
          })
      }
    },

    watch: {
      core: {
        files: core.concat(['common/js/test/core/*.js']),
        tasks: 'test_core'
      },
      chrome: {
        files: ['common/**', 'chrome/**'],
        tasks: 'chrome'
      },
      chromeLint: {
        files: ['common/**', 'chrome/**'],
        tasks: ['jshint:core', 'jshint:chrome']
      }
    },

    jasmine : {
       core: {
        src: core,
        options: {
          specs: ['common/js/test/core/utilies_test.js', 'common/js/test/core/activators_test.js', 'common/js/test/core/sitewatcher_test.js', 'common/js/test/core/habitrpg_test.js'],
          timeout: 1000
        }
      }
    },

    clean: {
      chrome: ['builds/chrome'],
      test: ['_SpecRunner.html']
    },

    copy: {
      chrome: {
        files: [
          { src: ['common/img/*'], dest: 'builds/chrome/img/', expand: true, flatten: true },
          { src: ['common/css/*'], dest: 'builds/chrome/css/', expand: true, flatten: true },
          { src: ['common/js/vendor/*'], dest: 'builds/chrome/vendor/', expand: true, flatten: true },
          { src: ['common/html/*', 'chrome/data/*'], dest: 'builds/chrome/', expand: true, flatten: true },
        ]
      }
    }

  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-jasmine');

  // Tasks 
  grunt.registerTask('default', 'jshint');

  grunt.registerTask('test_core', ['jshint:core', 'jshint:test', 'jasmine:core', 'clean:test']);

  grunt.registerTask('chrome',  [
      'jshint:core', 'jshint:chrome', 'clean:chrome', 'copy:chrome', 'concat:chrome'
      ]);



  function attachBindConcats(type, obj) {
    files = fs.readdirSync('common/js/binds');

    for (var i=0,len=files.length; i<len; i++) {
      obj['builds/'+type+'/bind_'+files[i]] = [type+'/bind.js', 'common/js/binds/'+files[i]];
    }

    return obj;
  }

};
