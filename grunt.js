module.exports = function(grunt) {

	grunt.initConfig({
	  lint: {
	  	background: ['habitrpg.js', 'activators.js', 'app.js']
		
	  },
	  concat: {
		background: {
	      src: ['activators.js', 'habitrpg.js', 'app.js'],
	      dest: 'background.js'
	    }
	  },
	  watch: {
	  	background: {
	  		files: ['activators', 'habitrpg.js', 'app.js'],
	  		tasks: ['lint', 'concat:background']
	  	}
	  }
	});

	grunt.registerTask('default', 'lint');

};