module.exports = function (grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		requirejs: {
			compile: {
				options: {
					baseUrl: 'src/',
					name: '../node_modules/almond/almond',
					include: ['ox'],
					insertRequire: ['ox'],
					out: 'ox.js',
					wrap: true,
					optimize: 'none'
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-requirejs');

	grunt.registerTask('default', ['requirejs']);

};