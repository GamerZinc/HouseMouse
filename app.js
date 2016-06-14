var mqttConn = require('./models/mqttConnection');
var utils = require('./models/utilities');
var RSVP = require('rsvp');
var activePlugins = {};
var generalTimer;
var photoTimer = 15000;
var rootUrl = 'http://localhost:3000/';

utils.callBrowser(rootUrl + 'index');

//Connect to cloud
var q = new mqttConn();
q.on("connect", function() {
      console.log("connected to qmtt");
});
q.on("message", function(topic, payload) {
    executeMessage(topic, payload);
});

//Load Settings
utils.loadFile('plugins.json')
.then(function (data) {
      loadPlugins(JSON.parse(data));
});

//Process Messages
function executeMessage(topic, message) {
   var msg = JSON.parse(message);
   clearInterval(generalTimer); 
   switch(msg.type.toUpperCase())
   {
         case "AUDIO":
            utils.callBrowser(rootUrl + 'audio?file=' + msg.file)
            .then(function() {
                activePlugins.audiofile.play(msg.file);
            });
         break;
         case "CLOCK":
            utils.callBrowser(rootUrl + 'clock')
            .then(function(){});
         break;
         case "PHOTO":
            //if(msg.service.toUpperCase() == "FLICKR"){
                  utils.callBrowser(rootUrl + 'index?title=Photo Album&msg=updating photos...')
                  .then(activePlugins.flickr.updatePhotos)
                  .then(function(){
                        activePlugins.flickr.setCollection(msg.collection)
                        .then(activePlugins.flickr.showPhotos)
                        .then(function(resolve) {
                              utils.callBrowser(rootUrl + resolve);
                              generalTimer = setInterval(function() {
                              activePlugins.flickr.showPhotos()
                              .then(function(resolve) {
                                    utils.callBrowser(rootUrl + resolve);
                              });   
                              }, photoTimer);
                        }).catch(function(err) {
                              utils.callBrowser(rootUrl + err);
                        });
                  });
            //}
         break;
         case "WEATHER":
            utils.callBrowser(rootUrl + 'weather');
            //showWeather(msg.zipcode);
         break;
         default:
            utils.callBrowser(rootUrl + 'index');
            //showTitle();
         break;
   }
}

function loadPlugins(config) {
      var plugins = config.plugins;
      
      for(var plugin in plugins) {
            if(plugins[plugin].enabled == 'true') {
                  var path = './models/' + plugins[plugin].name;
                  activePlugins[plugins[plugin].name] = require(path);     
                  console.log("loading: " + plugins[plugin].name);
            }
      }
}