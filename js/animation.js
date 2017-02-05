var Ani = {
    baseRate: 30,
    time: 0
};

Ani.animations = [];
Ani.imagesToPreload = [];
Ani.spriteFragment = $("<div class='ani_sprite'></div>");

Ani.animation = function ($options) {

    var _defaultOptions = {
        url: false,
        width: 32,
        numberOfFrames: 1,
        currentFrame: 0,
        rate: 1,
        offsetx: 0,
        offsety: 0
    };

    $.extend(this, _defaultOptions, $options);

    if ($options.rate) {
        this.rate = Math.round(this.rate / Ani.baseRate);
    }

    if (this.url) {
        Ani.addImage(this.url);
    }

};

Ani.setFrame = function ($div, $animation) {
    $div.css("backgroundPosition", (-$animation.currentFrame * $animation.width - $animation.offsetx) + "px " + (-$animation.offsety) + "px");
};

Ani.setAnimation = function ($div, $animation, $loop, $callback) {

    var _animate = {
        animation: $.extend({}, $animation),
        div: $div,
        loop: $loop,
        callback: $callback,
        counter: 0
    };

    if ($animation.url) {
        $div.css("backgroundImage", "url('" + $animation.url + "')");
    }

    var divFound = false;

    for (var i = 0; i < Ani.animations.length; i++) {
        if (Ani.animations[i].div.is($div)) {
            divFound = true;
            Ani.animations[i] = _animate;
        }
    }

    if (!divFound) {
        Ani.animations.push(_animate);
    }

    Ani.setFrame($div, $animation);

};

Ani.addSprite = function ($parent, $divId, $options) {

    var _options = $.extend({
        x: 0,
        y: 0,
        width: 32,
        height: 32,
        flipH: false,
        flipV: false,
        rotate: 0,
        scale: 1,
        zIndex: 1
    }, $options),

    _sprite = Ani.spriteFragment.clone().css({
        left: _options.x,
        top: _options.y,
        width: _options.width,
        height: _options.height,
        zIndex: _options.zIndex
    }).attr("id", $divId).data("Map", _options);

    $parent.append(_sprite);

    return _sprite;

};

Ani.addImage = function($url) {
    if ($.inArray($url, Map.imagesToPreload) < 0) {
        Ani.imagesToPreload.push();
    }
    Ani.imagesToPreload.push($url);
};