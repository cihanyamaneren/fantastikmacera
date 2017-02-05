/* global Ani */

/**
 * Tile Map Engine 
 **/

var Map = {
    width: 640,
    height: 480,
    baseDiv: $()
};

Map.groupFragment = $("<div class='map_group'></div>");
Map.tilemapFragment = $("<div class='map_tilemap'></div>");
Map.callbacks = [];

Map.init = function ($options) {

    $.extend(Map, $options);

};



Map.addGroup = function ($parent, $divId, $options) {
    
    var _options = $.extend({
        x: 0,
        y: 0,
        flipH: false,
        flipV: false,
        rotate: 0,
        scale: 1
    }, $options),
    
    _group = Map.groupFragment.clone().css({
        left: _options.x,
        top: _options.y
    }).attr("id", $divId).data("Map", _options);
    
    $parent.append(_group);
    
    return _group;

};

Map.rampsect = function($a, b, $c, $d, $e, $f, $g, $h, $i) {
    var _j = $a + $c,
        _k = $e + $g,
        _l = b + $d;
    return _j > $e && _j < _k + ($c / 2 - 10) && _l - 1 >= $f + $h - (_j - $e) || $a < _k && $a > $e + ($c / 2 - 10) && _l - 2 >= $f + $h - (_k - $a)
};

Map.intersect = function ($a1, $a2, $b1, $b2) {
    var _i1 = Math.min(Math.max($a1, $b1), $a2);
    var _i2 = Math.max(Math.min($a2, $b2), $a1);
    return [_i1, _i2];
};

Map.tilemapBox = function ($tilemapOptions, $boxOptions) {
    
    var _tmX  = $tilemapOptions.x;
    var _tmXW = $tilemapOptions.x + $tilemapOptions.width * $tilemapOptions.tileWidth;
    var _tmY  = $tilemapOptions.y;
    var _tmYH = $tilemapOptions.y + $tilemapOptions.height * $tilemapOptions.tileHeight;
    
    var _bX  = $boxOptions.x;
    var _bXW = $boxOptions.x + $boxOptions.width;
    var _bY  = $boxOptions.y;
    var _bYH = $boxOptions.y + $boxOptions.height;
    
    var _x = Map.intersect(_tmX, _tmXW, _bX, _bXW);
    var _y = Map.intersect(_tmY, _tmYH, _bY, _bYH);
    
    return {
        x1: Math.floor((_x[0] - $tilemapOptions.x) / $tilemapOptions.tileWidth),
        y1: Math.floor((_y[0] - $tilemapOptions.y) / $tilemapOptions.tileHeight),
        x2: Math.ceil((_x[1] - $tilemapOptions.x) / $tilemapOptions.tileWidth),
        y2: Math.ceil((_y[1] - $tilemapOptions.y) / $tilemapOptions.tileHeight)
    };
    
};

Map.setTileBox = function($div, $options) {
    var _set = $div.find(".map_line_" + $options.line + ".map_column_" + $options.column),
        _options = $.extend({
            top: _set.css("top"),
            left: _set.css("left"),
            width: _set.css("width"),
            height: _set.css("height")
        }, $options),
        _newOption = {
            x: parseInt(_options.left),
            y: parseInt(_options.top),
            width: parseInt(_options.width),
            height: parseInt(_options.height)
        };
    return _set.css(_options).data("Map", _newOption), _set
};

Map.offset = function ($div) {

    var _options = $div.data("Map");
    var _x = _options.x;
    var _y = _options.y;
    var _parent = $($div.parent());

    _options = _parent.data("Map");

    while(!_parent.is(Map.baseDiv) && _options !== undefined) {
        _x += _options.x;
        _y += _options.y;
        _parent = $(_parent.parent());
        _options = _parent.data("Map");
    }

    return {x: _x, y: _y};

};

Map.addTilemap = function ($parent, $divId, $options) {

    var _options = $.extend({
        x: 0,
        y: 0,
        tileWidth: 32,
        tileHeight: 32,
        width: 0,
        height: 0,
        map: [],
        animations: [],
        logic: false
    }, $options);

    var _tilemap = Map.tilemapFragment.clone().css({
            zIndex: _options.zIndex
    }).attr("id", $divId).data("Map", _options);

    if (!_options.logic) {
        var _offset = Map.offset($parent);
        var _visible = Map.tilemapBox(_options, {
            x: -_options.x - _offset.x,
            y: -_options.x - _offset.y,
            width: Map.baseDiv.width(),
            height: Map.baseDiv.height()
        });

        _options.visible = _visible;

        for (var i = _visible.y1; i < _visible.y2; i++) {
            for (var j = _visible.x1; j < _visible.x2; j++) {
                var _animationIndex = _options.map[i][j];
                
                if (_animationIndex > 0) {
                    
                    var _tileOptions = {
                        x: _options.x + j * _options.tileWidth,
                        y: _options.y + i * _options.tileHeight,
                        width: _options.tileWidth,
                        height: _options.tileHeight
                    };
                    
                    var _tile = Ani.spriteFragment.clone().css({
                        left: _tileOptions.x,
                        top: _tileOptions.y,
                        width: _tileOptions.width,
                        height: _tileOptions.height
                    }).addClass("map_line_" + i).addClass("map_column_" + j).data("Map", _tileOptions);
                    
                    Ani.setAnimation(_tile, _options.animations[_animationIndex-1]);
                    
                    _tilemap.append(_tile);
                    
                }
                
            }
        }

    }

    $parent.append(_tilemap);

    return _tilemap;

};

Map.importTilemap = function ($url, $parent, $divIdPrefix) {
  
    var _animations = [];
    var _tilemaps = [];
    
    $.getJSON($url, function (json) {

        var _tilesetGID = [];
        for (var i = 0; i < json.tilesets.length; i++) {
            _tilesetGID[i] = json.tilesets[i].firstgid;
        }
        
        var _getTilesetIndex = function ($index) {

            var _i = 0;
            
            while ($index >= _tilesetGID[_i] && _i < _tilesetGID.length) {
                _i++;
            }
            
            return _i-1;
            
        };
        
        var _height = json.height;
        var _width  = json.width;
        var _tileHeight = json.tileheight;
        var _tileWidth = json.tilewidth;
        
        var _layers = json.layers;
        var _usedTiles = [];
        var _animationCounter = 0;
        var _tilemapArrays = [];
        
        for (var i = 0; i < _layers.length; i++) {

            if (_layers[i].type === "tilelayer") {

                var _tilemapArray = new Array(_height);
                
                for (var j = 0; j < _height; j++) {
                    _tilemapArray[j] = new Array(_width);
                }
                
                for (var j = 0; j < _layers[i].data.length; j++) {
                    
                    var _tile = _layers[i].data[j];

                    if (_tile === 0) {
                        _tilemapArray[Math.floor(j / _width)][j % _width] = 0;
                    } else if (_layers[i].name === "logic") {
                        _tilemapArray[Math.floor(j / _width)][j % _width] = _tile - _tilesetGID[_getTilesetIndex(_tile)] + 1;
                    } else {
                        if (!_usedTiles[_tile]) {

                            _animationCounter++;
                            _usedTiles[_tile] = _animationCounter;
                            _animations.push(new Ani.animation({
                                url: json.tilesets[_getTilesetIndex(_tile)].image,
                                offsetx: ((_tile - 1) % Math.floor(json.tilesets[_getTilesetIndex(_tile)].imagewidth / _tileWidth)) * _tileWidth,
                                offsety: Math.floor((_tile - 1) / Math.floor(json.tilesets[_getTilesetIndex(_tile)].imagewidth / _tileWidth)) * _tileHeight
                            }));
                        }
                        _tilemapArray[Math.floor(j / _width)][j % _width] = _usedTiles[_tile];
                    }
                    
                }
                
                _tilemapArrays.push(_tilemapArray);
                
            }
        }

        for (var i = 0; i < _tilemapArrays.length; i++) {
            _tilemaps.push(Map.addTilemap($parent, $divIdPrefix + i, {
                x: 0,
                y: 0,
                tileWidth: _tileWidth,
                tileHeight: _tileHeight,
                width: _width,
                height: _height,
                map: _tilemapArrays[i],
                animations: _animations,
                zIndex: _layers[i].layer ? _layers[i].layer : 3,
                logic: (_layers[i].name === "logic")
            }));
        }
    });

    return {
        animations: _animations,
        tilemaps: _tilemaps
    };
    
};

Map.createTile = function ($div, $i, $j, $options) {
    
    var _animationIndex = $options.map[$i][$j];
    
    if (_animationIndex > 0 && $div.find(".map_line_" + $i + ".map_column_" + $j).length === 0) {
        
        var _tileOptions = {
            x: $options.x + $j * $options.tileWidth,
            y: $options.y + $i * $options.tileHeight,
            width: $options.tileWidth,
            height: $options.tileHeight
        };
        
        var _tile = Ani.spriteFragment.clone().css({
            left: _tileOptions.x,
            top: _tileOptions.y,
            width: _tileOptions.width,
            height: _tileOptions.height
        }).addClass("map_line_" + $i).addClass("map_column_" + $j).data("Map", _tileOptions);
        
        Ani.setAnimation(_tile, $options.animations[_animationIndex-1]);
        
        $div.append(_tile);
        
    }
    
};

Map.updateVisibility = function ($div) {
    
    var _options = $div.data("Map");

    if (!_options.logic) {
        
        var _oldVisibility = _options.visible;
        var _parent = $div.parent();
        var _offset = Map.offset($div);
        var _newVisibility = Map.tilemapBox(_options, {
            x: -_offset.x,
            y: -_offset.y,
            width: Map.baseDiv.width(),
            height: Map.baseDiv.height()
        });   
        
        if (_oldVisibility.x1 !== _newVisibility.x1 ||
            _oldVisibility.x2 !== _newVisibility.x2 ||
            _oldVisibility.y1 !== _newVisibility.y1 ||
            _oldVisibility.y2 !== _newVisibility.y2) {
            
            $div.detach();
            
            // Eski tileler siliniyor
            
            for(var i = _oldVisibility.y1; i < _newVisibility.y1; i++) {
                for (var j = _oldVisibility.x1; j < _oldVisibility.x2; j++) {
                    $div.find(".map_line_" + i + ".map_column_" + j).remove();
                }
            }
            
            for (var i = _newVisibility.y2; i < _oldVisibility.y2; i++) {
                for (var j = _oldVisibility.y1; j < _oldVisibility.x2; j++) {
                    $div.find(".map_line_" + i + ".map_column_" + j).remove();
                }
            }
            
            for (var j = _oldVisibility.x2; j < _newVisibility.x2; j++) {
                for (var i = _oldVisibility.y1; i < _oldVisibility.y2; i++) {
                    $div.find(".map_line_" + i + ".map_column_" + j).remove();
                }
            }
            
            for (var j = _newVisibility.x2; j < _oldVisibility.x2; j++) {
                for (var i = _oldVisibility.y1; i < _oldVisibility.y2; i++) {
                    $div.find(".map_line_" + i + ".map_column_" + j).remove();
                }
            }
            
            // Yeni tileler kuruluyor
            
            for (var i = _oldVisibility.y2; i < _newVisibility.y2; i++) {
                for (var j = _oldVisibility.x1; j < _oldVisibility.x2; j++) {
                    Map.createTile($div, i, j, _options);
                }
            }
            
            for (var i = _newVisibility.y1; i < _oldVisibility.y1; i++) {
                for (var j = _oldVisibility.x1; j < _oldVisibility.x2; j++) {
                    Map.createTile($div, i, j, _options);
                }
            }
            
            for (var j = _oldVisibility.x2; j < _newVisibility.x2; j++) {
                for (var i = _oldVisibility.y1; i < _oldVisibility.y2; i++) {
                    Map.createTile($div, i, j, _options);
                }
            }
            
            for (var j = _newVisibility.x1; j < _oldVisibility.x1; j++) {
                for (var i = _oldVisibility.y1; i < _oldVisibility.y2; i++) {
                    Map.createTile($div, i, j, _options);
                }
            }
            
            $div.appendTo(_parent);
            
        }
        
        _options.visible = _newVisibility;
        
    }
    
};

Map.tilemapCollide = function ($tilemap, $box) {
    
    var _options = $tilemap.data("Map");
    var _collisionBox = Map.tilemapBox(_options, $box);
    var _divs = [];
    
    for (var i = _collisionBox.y1; i < _collisionBox.y2; i++) {
        for (var j = _collisionBox.x1; j < _collisionBox.x2; j++) {
            var _index = _options.map[i][j];
            if (_index > 0) {
                if (_options.logic) {
                    _divs.push({
                        type: _index,
                        x: j * _options.tileWidth,
                        y: i * _options.tileHeight,
                        width: _options.tileWidth,
                        height: _options.tileHeight
                    });
                } else {
                    _divs.push($tilemap.find(".map_line_" + i + ".map_column_" + j));
                }
            }
        }
    }
    
    return _divs;
    
};

Map.spriteCollide = function ($sprite1, $sprite2) {
    
    var _option1 = $sprite1.data("Map");
    var _option2 = $sprite2.data("Map");
    
    var _offset1 = Map.offset($sprite1);
    var _offset2 = Map.offset($sprite2);
    
    var _x = Map.intersect(
         _offset1.x,
         _offset1.x + _option1.width,
         _offset2.x,
         _offset2.x + _option2.width 
    );
    
    var _y = Map.intersect(
         _offset1.y,
         _offset1.y + _option1.height,
         _offset2.y,
         _offset2.y + _option2.height 
    );
    
    if (_x[0] === _x[1] || _y[0] === _y[1]) {
        return false;
    } else {
        return true;
    }
    
};

Map.x = function ($div, $position) {
    
    if ($position !== undefined) {
        
        $div.css("left", $position);
        $div.data("Map").x = $position;

        if ($div.find(".map_tilemap").length > 0) {
            $div.find(".map_tilemap").each(function () {
                Map.updateVisibility($(this));
            });
        }
        if ($div.hasClass("map_tilemap")) {
            
            Map.updateVisibility($($div));
        }
        
    } else {
        return $div.data("Map").x;
    }
    
};

Map.y = function ($div, $position) {
    
    if ($position !== undefined) {
        
        $div.css("top", $position);
        $div.data("Map").y = $position;
        
        if ($div.find(".map_tilemap").length > 0) {
            $div.find(".map_tilemap").each(function () {
                Map.updateVisibility($(this));
            });
        }
        
        if ($div.hasClass("map_tilemap")) {
            Map.updateVisibility($($div));
        }
        
    } else {
        return $div.data("Map").y;
    }
    
};

Map.transform = function ($div, $options) {
    
    var _map = $div.data("Map");
    
    if ($options.flipH !== undefined) {
        _map.flipH = $options.flipH;
    }
    
    if ($options.flipV !== undefined) {
        _map.flipV = $options.flipV;
    }
    
    if ($options.rotate !== undefined) {
        _map.rotate = $options.rotate + "deg";
    }
    
    if ($options.scale !== undefined) {
        _map.scale = $options.scale;
    }
    
    var _factorH = _map.flipH ? -1 : 1;
    var _factorV = _map.flipV ? -1 : 1;
    
    $div.css("transform", "rotate(" + _map.rotate + ") scale(" + (_map.scale * _factorH) + "," + (_map.scale * _factorV) + ")");
    
};

Map.w = function ($div, $dimension) {
    
    if ($dimension) {
        $div.css("width", $dimension);
        $div.data("Map").width = $dimension;
    } else {
        if ($div.hasClass("map_tilemap")) {
            var _data = $div.data("Map");
            return _data.width * _data.tileWidth;
        } else {
            return $div.data("Map").width;
        }
    }
    
};

Map.h = function ($div, $dimension) {
    
    if ($dimension) {
        $div.css("height", $dimension);
        $div.data("Map").height = $dimension;
    } else {
        if ($div.hasClass("map_tilemap")) {
            var _data = $div.data("Map");
            return _data.height * _data.tileHeight;
        } else {
            return $div.data("Map").height;
        }
    }
    
};

Map.addCallback = function ($callback, $rate) {
    Map.callbacks.push({
        callback: $callback,
        rate: Math.round($rate / Ani.baseRate),
        counter: 0
    });
};