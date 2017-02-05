var Sound = function($url) {
    var audio = document.createElement("audio"),
    type = {
            mp3: "audio/mpeg",
            ogg: "audio/ogg"
    };
    if (audio.canPlayType) {
        var source = document.createElement("source");
        source.setAttribute("src", $url);
	if ($url.match(/\.(\w+)$/i)) {
	    source.setAttribute("type", type[RegExp.$1]);
	}
	audio.appendChild(source); 
	audio.load(); 
	audio.playClip = function($loop) {
            audio.pause(); 
	    audio.preload = "auto"; 
	    audio.muted = FantastikMacera.muted; 
	    audio.currentTime = 0; 
	    audio.volume = this.volume;
	    audio.loop = $loop; 
	    audio.play();
        }; 
	audio.stopClip = function() {
            audio.pause();
	    audio.currentTime = 0; 
	    audio.loop = false;
        };
	return audio;
    }
};