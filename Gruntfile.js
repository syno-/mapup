module.exports = function(grunt) {
    "use strict";

    var path = {
        src: {
            // dirs
            js: "src/js/", 
            css: "src/css/", 

            // files
            index: {
                js: {
                    out: 'index.js',
                    min: 'index.min.js',
                    files: [
                        'index.begin.js',
                        'index.geolocation.js',
                    ]
                },
                css: {
                    out: 'index.css',
                    file: 'index.scss',
                }
            },
        },
        release: {
            js: "release/js/", 
            css: "release/css/", 
        },
    };

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            all: ['Gruntfile.js', path.src.js + '**/*.js']
        },
        concat: {
            options: {
                separator: ';',
            },
            index: {
                src: path.src.index.js.files,
                dest: path.release.js + path.src.index.js.out,
            },
        },
        uglify: {
//            build: {
//                src: buildPath + '<%= pkg.name %>.js',
//                dest: releasePath + '<%= pkg.name %>.min.js'
//            },
            debug: {
                options: {
//                    banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                    //beautify: true,
                    //compress: true,
                },
                files: (function() {
                    var r = {};
                    r[path.release.js + path.src.index.js.min] = path.release.js + path.src.index.js.out;
                    return r;
                })()
            }
        },
        sass: {
            index: {
                options: {
                    style: 'expanded',
                },
                files: (function() {
                    var r = {};
                    r[path.release.css + path.src.index.css.out] = path.src.css + path.src.index.css.file;
                    return r;
                })()
            }
        },
        watch: {
            scripts: {
                files: [
                    'Gruntfile.js',
                    path.src.js + '**/*.js',
                    path.src.css + '**/*.scss',
                ],
                tasks: [
                    'jshint',
                    'concat',
                    //'uglify',
                    'sass',
                ],
                options: {
                    interrupt: true,
                },
            },
        },
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('indexjs', [
                       'jshint',
                       'concat',
                       'uglify',
                       'sass',
    ]);
    grunt.registerTask('release', [
                       'indexjs',
    ]);
};
