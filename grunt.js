module.exports = function(grunt) {

	grunt.initConfig({
		lint: {
			background: ['test/*.js', 'habitrpg.js', 'activators.js', 'app.js']

		},
		concat: {
		background: {
			src: ['activators.js', 'sitewatcher.js', 'habitrpg.js', 'app.js'],
			dest: 'background.js'
			}
		},
		watch: {
			background: {
				files: ['activators.js', 'sitewatcher.js', 'habitrpg.js', 'app.js', 'test/*.js'],
				tasks: ['lint', 'jasmine', 'concat:background', 'clean:test']
			},
			options: {
				files: ['options.js', 'options.html'],
				tasks: ['copy:extension']
			}
		},
		jasmine : {
			src : ['activators.js', 'sitewatcher.js', 'habitrpg.js'],
			specs : 'test/*.js',
			timeout : 1000
		},
		clean: {
			test: ['_SpecRunner.html']
		},
		copy: {
			extension: {
				files: {
					'../chromExtension/': ['img/*', 'vendor/*', 'background.html', 'options.html', 'background.js', 'options.js', 'manifest.json']
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-jasmine-runner');

	grunt.registerTask('cpExt', 'copy:extension');

	grunt.registerTask('default', ['lint', 'jasmine', 'clean:test']);
	

};