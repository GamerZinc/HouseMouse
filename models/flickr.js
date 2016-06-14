var fs = require('fs');
var RSVP = require('rsvp');
var utils = require('./utilities');
var flickrConfig = {};
var flickrCollection = {};
var photoCollection = {};
var flickrCollectionFile = 'flickrCollection.json';
var Flickr;
var flickrTotalPhotos = 0;
var flickrTotalPages = 0;
var flickrPage = 0;
var totalLocal = 0;

utils.loadFile('plugins.json')
.then(function (data) {
    loadConfig(JSON.parse(data),'flickr');
});

function promiseWhile(condition, body) {
    return new RSVP.Promise(function(resolve,reject){
    
        function loop() {
            RSVP.Promise.resolve(condition()).then(function(result){
                // When the result of calling `condition` is no longer true, we are done.
                if (!result){
                    resolve();
                } else {
                    // When it completes loop again otherwise, if it fails, reject
                    RSVP.Promise.resolve(body()).then(loop,reject);
                }
            });
        }
    
        // Start running the loop
        loop();
    });
}

function getPhotoPageFromFlickr(page){
    return new RSVP.Promise(function(resolve, reject) {
        Flickr.tokenOnly(flickrOptions, function(error, flickr) {
            flickr.photos.search({
                user_id: flickrOptions.user_id,
                page: page,
                extras: 'original_format,date_taken,o_dims'
                }, function(err, result) {
                    if(err) {
                        reject(err);
                    }else{
                        resolve(result);
                    }
            });
        });  
    });
}

function loadConfig(config,name) {
    var plugins = config.plugins;
    for(var plugin in plugins){
        if(plugins[plugin].name.toUpperCase() == name.toUpperCase()){
            Flickr = require("flickrapi"),
            flickrOptions = {
                api_key: plugins[plugin].key,
                secret: plugins[plugin].secret,
                user_id: plugins[plugin].userId,
                access_token: plugins[plugin].accessToken,
                access_token_secret: plugins[plugin].accessTokenSecret
            };
        }
    }
}

function loadCollectionFile() {
    return new RSVP.Promise(function(resolve, reject) {
        utils.fileExists(flickrCollectionFile) 
        .then(function(fileExists){
            if(fileExists === false) {
                utils.createFile(flickrCollectionFile)
                .then(function(){
                    utils.loadFile(flickrCollectionFile)
                    .then(function (data) {
                        flickrCollection = data;
                        resolve(flickrCollection);
                    });   
                });
            }else{
                utils.loadFile(flickrCollectionFile)
                .then(function (data) {
                    flickrCollection = data;
                    resolve(flickrCollection);
                });            
            }
        });
    });
}

function updateCollectionFile() {
    return new RSVP.Promise(function(resolve, reject) {
        flickrCollection = '';
        var i = 0;
        promiseWhile(function(){
            return i < (flickrTotalPages + 1);
        },function(){
            return new RSVP.Promise(function(resolve, reject){
                getPhotoPageFromFlickr(i)
                .then(function(result) {
                    if(i === 1){
                        flickrCollection = JSON.stringify(result.photos.photo).replace('[','').replace(']',''); 
                    }else{
                        flickrCollection += JSON.stringify(result.photos.photo).replace('[',',').replace(']','');
                    }
                    i++;
                    console.log(i);
                    resolve();
                });
            });
        }).then(function(){
            var c = '{ "photo":[' + flickrCollection + '] }';
            flickrCollection = c;
            utils.appendFile(flickrCollectionFile, flickrCollection)
            .then(function() {
                resolve();
            });
        });
    });
}

function getCollection(collection) {
    return new RSVP.Promise(function(resolve, reject) {
        var obj = JSON.parse(flickrCollection);
        var collDate = collection + "-01-01";
       
        photoCollection = obj.photo.filter(function(x) {
            if(Date.parse(x.datetaken) >= Date.parse(collDate)) {
                return x;
            }
        });
        resolve();
    });
}

module.exports = {
    setCollection: function(collection) {
        return new RSVP.Promise(function(resolve, reject) {
            getCollection(collection)
            .then(function() {
                resolve();
            });
        });
    },
    updatePhotos: function() {
        //get total number of photos in flickr account
        //verify flickrCollection.js file has the same amount of photos as reported
        //if they are not the same... clear the file and rebuild it
        return new RSVP.Promise(function(resolve, reject) {
            loadCollectionFile()
            .then(function(data){
                try{
                    totalLocal = JSON.parse(data).photo.length;    
                }catch(e){
                    totalLocal = 0;
                }
                                
                getPhotoPageFromFlickr(1)
                .then(function(result){
                    flickrTotalPhotos = result.photos.total;
                    flickrTotalPages = result.photos.pages;
                
                if(totalLocal != flickrTotalPhotos){
                    console.log("updating photos...");
                    utils.deleteFile(flickrCollectionFile)
                    .then(updateCollectionFile)
                    .then(function (){
                        console.log("completed photo update");
                        resolve();    
                    });
                }else{
                    resolve();
                }
              });
            });
        });
    },
    showPhotos: function() {
        return new RSVP.Promise(function(resolve, reject) {
            var url = '';
            var id = '';
            var secret = '';
            var server = '';
            var farm = '';
            var imgType = '';
            
            if(photoCollection.length === 0){
                url = "index?title=Photo Album&msg=No Photos Found";
                reject(url);
            }else{
                var rndNum = utils.randomIntInc(0,photoCollection.length);
                id = photoCollection[rndNum].id;
                server = photoCollection[rndNum].server;
                farm = photoCollection[rndNum].farm;
                if(photoCollection[rndNum].o_width > 1024) {
                    imgType = "b";
                    secret = photoCollection[rndNum].secret;
                }else{
                    imgType = "o";
                    secret = photoCollection[rndNum].originalsecret;
                }
                url = 'photo?farm=' + farm + '&server=' + server + '&id=' + id + '&secret=' + secret + '&imgType=' + imgType;
                resolve(url);
            }
      });
    }
};
