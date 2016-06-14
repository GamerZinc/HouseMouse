var fs = require('fs');
var RSVP = require('rsvp');
require('chromedriver');
var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;
var driver = new webdriver.Builder()
    .forBrowser('chrome')    
    .build();


module.exports = {
    randomIntInc: function (low, high) {
        return Math.floor(Math.random() * (high - low + 1) + low);
    },
    loadFile: function(filePath) {
        return new RSVP.Promise(function(resolve, reject) {
                fs.readFile(filePath, function(error, data)
                {
                    if(error){
                        reject(error);
                    }
                    resolve(data);
                });      
        });
    },
    createFile: function(path) {
        return new RSVP.Promise(function(resolve, reject) {

            fs.open(path, 'w+', function(error, data) {
                if (error) {
                    reject(error);
                } else {
                    fs.close(data, function() {
                        resolve(fs);
                    });
                }
            });
               
        });
    },
    appendFile: function(path, data) {
        return new RSVP.Promise(function(resolve, reject) {

            fs.open(path, 'a', function( e, id ) {
                if(e) {
                    reject(e);
                }
                fs.write( id, data, null, 'utf8', function(){
                    fs.close(id, function(){
                        resolve("true");
                    });
                });
            });
        });
    },
    deleteFile: function(path) {
        return new RSVP.Promise(function(resolve, reject) {
            fs.exists(path, function(exists) {
                if(exists){
                    fs.unlink(path);
                }    
                resolve("true");
            });
        });
    },
    clearFile: function(path) {
        return new RSVP.Promise(function(resolve, reject) {
            fs.exists(path, function(exists) {
                if(exists){
                    fs.truncate(path,0);
                }    
                resolve("true");
            });
        });
    },
    fileExists: function(path, found) {
        return new RSVP.Promise(function(resolve, reject) {
            fs.exists(path, function(exists) {
                resolve(exists);
            });
        });
    },
    callBrowser: function(path) {
        return new RSVP.Promise(function(resolve, reject) {
          driver.get(path);
          resolve();
        });
    }    
};