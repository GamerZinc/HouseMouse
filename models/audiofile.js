var player = require('play-sound-v12')(opts = {});

module.exports = {
    play: function (soundFile) {
        var filePath = "./audio/" + soundFile + ".mp3";
        player.play(filePath);
    }
};
