module.exports = function(grunt) {

	var baseFiles = ['src/defaults.js', 'src/utilies.js', 'src/activators.js', 'src/sitewatcher.js', 'src/todos.js', 'src/tomatoes.js', 'src/habitrpg.js'];

	grunt.initConfig({
		lint: {
			test: ['test/*.js'],
			src: ['src/*.js', 'tomatoes_bind.js']
		},
		concat: {
			background: {
				src: baseFiles.concat(['src/app.js']),
				dest: 'background.js'
			},
			options: {
				src: ['src/defaults.js', 'src/options.js'],
				dest: 'options.js'
			}
		},
		watch: {
			baseDev: {
				files: ['src/*.js', 'test/*.js'],
				tasks: ['lint', 'jasmine', 'concat:background', 'clean:test']
			},
			extDev: {
				files: ['src/*.js', 'tomatoes_bind.js', 'options.html', 'background.html'],
				tasks: ['lint:src', 'concat:background', 'concat:options', 'copy:extension']
			},
		},
		jasmine : {
			src : baseFiles,
			specs : ['test/utilies_test.js', 'test/activators_test.js', 'test/sitewatcher_test.js', 'test/habitrpg_test.js'],
			timeout : 1000
		},
		clean: {
			test: ['_SpecRunner.html']
		},
		copy: {
			extension: {
				files: {
					'../chromExtension/': ['img/*', 'vendor/*', 'background.html', 'options.html', 'background.js', 'options.js', 'tomatoes_bind.js', 'manifest.json']
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-jasmine-runner');

	grunt.registerTask('create', ['concat:options', 'concat:background', 'copy:extension']);

	grunt.registerTask('default', 'create');
	

};