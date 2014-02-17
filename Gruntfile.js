module.exports = function (grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		watch: {
			scripts: {
				files: '**/*.js',
				tasks: ['requirejs'],
				options: {
					interrupt: true
				}
			}
		},

		requirejs: {
			compile: {
				options: {
					baseUrl: 'src/',
					name: '../node_modules/almond/almond',
					include: ['ox'],
					out: 'ox.js',
					wrap: {
						start: "ox = (function() {",
						end: "\n\treturn require('ox');\n}());"
					},
					optimize: 'none'
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['requirejs']);

};