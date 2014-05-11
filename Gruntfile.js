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
                    out: 'mps.js',
                    min: 'mps.min.js',
                    files: [
                        'mps.begin.js',
                        'mps.log.js',
                        'mps.dialog.js',
                        'mps.geolocation.js',
                        'mps.users.js',
                        'mps.user.js',
                        'mps.main.js',
                    ]
                },
            },
            meetup: {
                js: {
                    out: 'meetup.js',
                    //min: 'meetup.min.js',
                    files: [
                        'meetup.main.js',
                    ]
                },
            },
        },
        release: {
            js: "public/js/", 
            css: "public/css/", 
        },
    };

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                ignores: [path.src.js + 'mps.begin.js'],
            },
            all: ['Gruntfile.js', path.src.js + '**/*.js']
        },
        concat: {
            options: {
                separator: ';',
            },
            index: {
                src: (function() {
                    var list = [];
                    path.src.index.js.files.forEach(function(file) {
                        list.push(path.src.js + file);
                    });
                    return list;
                })(),
                dest: path.release.js + path.src.index.js.out,
            },
            meetup: {
                src: (function() {
                    var list = [];
                    path.src.meetup.js.files.forEach(function(file) {
                        list.push(path.src.js + file);
                    });
                    return list;
                })(),
                dest: path.release.js + path.src.meetup.js.out,
            },
            signalmaster: {
                src: [
                    path.src.js + 'signalmaster.main.js',
                ],
                dest: 'signalmaster.js'
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
                    r[path.release.css + 'index.css'] = path.src.css + 'index.scss';
                    r[path.release.css + 'meetup.css'] = path.src.css + 'meetup.scss';
                    return r;
                })()
            }
        },
        copy: {
            meetupjs: {
                files: [{
                    expand: true,
                    flatten: true,
                    src: ['meetup.js/release/**'],
                    dest: 'public/libs/meetup.js/',
                    filter: 'isFile'
                }]
            }
        },
        watch: {
            scripts: {
                files: [
                    'Gruntfile.js',
                    path.src.js + '**/*.js',
                    'meetup.js/build/**/*.js',
                ],
                tasks: [
                    'jshint',
                    'sass',
                    'concat',
                ],
                options: {
                    interrupt: true,
                },
            },
            css: {
                files: [
                    path.src.css + '**/*.scss',
                ],
                tasks: [
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
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('indexjs', [
                       'jshint',
                       'concat',
                       //'uglify',
                       'sass',
                       'copy:meetupjs',
    ]);
    grunt.registerTask('release', [
                       'jshint',
                       'concat',
                       //'uglify',
                       'sass',
                       'copy:meetupjs',
    ]);
};
