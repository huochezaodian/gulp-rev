const src = './src';     
const dest = './build';  

module.exports = {
    less: {
    	all: src + "/less/**/*.less",
        src: src + "/less/*.less",     
        dest: dest + "/css",          
        rev: dest + "/rev/css",
        settings: {                      

        }
    },
    clean:{
        src: dest
    },
    rev:{
        revJson: dest + "/rev/**/*.json",
        src: "*.html",
        dest: ""
    }
}