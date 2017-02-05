var FantastikMacera = {};

FantastikMacera.pause = false;

FantastikMacera.keyBoard = [];

FantastikMacera.keyBoard["jump38"] = true;

FantastikMacera.muted = false;

FantastikMacera.tilemap = "#level2";

FantastikMacera.time = function ($time) {
    var _min = Math.floor($time / 60);
    var _sec = $time % 60;
    return _min + ":" + _sec;
};

FantastikMacera.init = function (e) {
    
    var gameState = "level";//"start";
    var group, container;
    var coins = [];
    var enemies = [];
    var flybox = [];
    var climb = false;
    var climbDirection = -1;
    var jumpEffect;
    var puffEffect;
    var coinSound;
    var deadSound;
    
    var backSound = new Sound("audio/land_2.ogg");
    backSound.volume = 0.2;

    var itemBoxSound;

    var jumpSound = new Sound("audio/jump_big.ogg");
    jumpSound.volume = 0.5;



    var dieFly = new Sound("audio/die_fly.ogg");
    dieFly.volume = 0.5;
    
    Map.init({baseDiv: $("#fantastikMacera-container")});
    
    var backgroundFrontAnim = new Ani.animation({
        url: "assets/background_front.png"
    });
    
    var backgroundMiddleAnim = new Ani.animation({
        url: "assets/background_middle.png"
    });
    
    var backgroundBackAnim = new Ani.animation({
        url: "assets/background_back.png"
    });
    
    var playerAnim = {
        normal: new Ani.animation({
            url: "assets/player.png",
            offsetx: 0
        }),
        walk: new Ani.animation({
            url: "assets/player.png",
            offsetx: 150,
            width: 75,
            numberOfFrames: 10,
            rate: 90
        }),
        jump: new Ani.animation({
            url: "assets/player.png",
            offsetx: 900
        }),
        climb: new Ani.animation({
            url: "assets/player.png",
            offsetx: 975,
            width: 75,
            numberOfFrames: 2,
            rate: 180
        })
    };
    
    var coinAnim = {
        play: new Ani.animation({
            url: "assets/coin.png",
            offsetx: 0,
            width: 32,
            numberOfFrames: 6,
            rate: 110
        })
    };
    
    var effectAnim = {
        puff: new Ani.animation({
            url: "assets/smoke.png",
            offsetx: 0,
            width: 42,
            numberOfFrames: 10,
            rate: 60
        }),
        jump: new Ani.animation({
            url: "assets/smoke.png",
            offsetx: 420,
            width: 42,
            numberOfFrames: 10,
            rate: 70
        })
    };
    
    var player = new (function () {

        var _status = "normal";
        var _speed = 20;
        var _dieSound = true;
        var _acceleration = 9;
        var _horizontalMove = 0;

        this.update = function () {

          switch (_status) {
 
            case "drowned":

                var _newY = Map.y(this.div) + 2;

                if (_newY > 700 + 100) { // - 100
                    if(!_dieSound){
                        deadSound.stopClip();
                        deadSound.remove();
                        backSound.playClip(true);
                        _dieSound = true;
                        Map.x(this.div, 0);
                        Map.y(this.div, 0);
                        _status = "normal";
                        Ani.setAnimation(this.div, playerAnim.jump);
                        getEnemies();
                    }
                } else {
                    if (_dieSound) {
                        backSound.stopClip();
                        deadSound = new Sound("audio/dead.ogg");
                        deadSound.volume = 0.3;
                        deadSound.playClip();
                        _dieSound = false;
                    }
                    Map.y(this.div, _newY);
                }

            break;

            default:

               var _delta = Ani.baseRate;
               _speed = Math.min(100, Math.max(-100, _speed + _acceleration * _delta / 100.0));
               
               var _newY = Map.y(this.div) + _speed * _delta / 100.0;
               var _newX = Map.x(this.div) + _horizontalMove;
               var _newW = Map.w(this.div);
               var _newH = Map.h(this.div);

               var _collisions = Map.tilemapCollide($(FantastikMacera.tilemap), {x: _newX, y: _newY, width: _newW, height: _newH});
                    
               var i = 0;
               
               climb = false;
               
               while (i < _collisions.length > 0) {
                   
                   var _collision = _collisions[i];
                   i++;

                   var _collisionBox = {
                       x1: _collision.x,
                       y1: _collision.y,
                       x2: _collision.x + _collision.width,
                       y2: _collision.y + _collision.height
                   };

                   switch (_collision.type) {

                       case 1:
                               
                            var _x = Map.intersect(_newX, _newX + _newW, _collisionBox.x1, _collisionBox.x2);
                            var _y = Map.intersect(_newY, _newY + _newH, _collisionBox.y1, _collisionBox.y2);

                            var _diffx = (_x[0] === _newX) ? _x[0] - _x[1] : _x[1] - _x[0];
                            var _diffy = (_y[0] === _newY) ? _y[0] - _y[1] : _y[1] - _y[0];

                            if (Math.abs(_diffx) > Math.abs(_diffy)) {

                                _newY -= _diffy;
                                _speed = 0;

                                if (_status === "jump" && _diffy > 0) {
                                    _status = "normal";
                                }

                            } else {

                                _newX -= _diffx;

                            }

                       break;
                       
                       case 2:
                       case 3:
                       
                            _collisionBox.y1 += _collision.type === 2 ? 30 : 46;

                            var _x = Map.intersect(_newX, _newX + _newW, _collisionBox.x1, _collisionBox.x2);
                            var _y = Map.intersect(_newY, _newY + _newH, _collisionBox.y1, _collisionBox.y2);

                            var _diffx = (_x[0] === _newX) ? _x[0] - _x[1] : _x[1] - _x[0];
                            var _diffy = (_y[0] === _newY) ? _y[0] - _y[1]: _y[1] - _y[0];

                            if (Math.abs(_diffx) > Math.abs(_diffy-4)) {
                                if (_collisionBox.y1 < Math.round(_newY + 93)) {
                                    _newY -= _diffy;
                                    _speed = 0;
                                }

                                if (_status === "jump" && _diffy > 0) {
                                    _status = "normal";
                                }

                                if (_newY == _collisionBox.y2 && _status === "jump") {
                                    puffEffect.show();
                                    Map.x(puffEffect, Map.x(this.div) + (Map.w(this.div) - 40) / 2);
                                    Map.y(puffEffect, Map.y(this.div) - 10);
                                    Ani.setAnimation(puffEffect, effectAnim.puff, false, function () {
                                        puffEffect.stop().fadeOut(100);
                                    });
                                    if (itemBoxSound !== undefined) {
                                        itemBoxSound.remove();
                                    }
                                    itemBoxSound = new Sound("audio/wall_hit.ogg");
                                    itemBoxSound.volume = 0.4;
                                    itemBoxSound.playClip();
                                }

                            } else {

                                _newX -= _diffx;

                            }
                       
                       break;

                       case 4:
                       case 5:

                            _newY = Map.y(this.div);

                            if (_collision.type === 5 && _newY + _newH <= _collisionBox.y1 && climbDirection === -1) {
                               _status = "normal";
                               Ani.setAnimation(this.div, playerAnim.normal);
                               climb = false;
                               _speed = 0;
                            }
                            
                            if (_newX > _collisionBox.x1 - 20 && _newX + 40 < _collisionBox.x2) {
                                if (_status === "jump") {
                                    Ani.setAnimation(this.div, playerAnim.climb);
                                }
                                if (_status === "climb") {
                                    _newY += climbDirection * 3;
                                }
                                climb = true; 
                            } else {
                                _newY = Map.y(this.div) + _speed * _delta / 100.0;
                                climb = false;
                            }

                       break;

                       case 7:
                            
                            if (Map.rampsect(_newX, _newY, _newW, _newH, _collisionBox.x1, _collisionBox.y1, _collisionBox.x2 - _collisionBox.x1, _collisionBox.y2 - _collisionBox.y1, _horizontalMove)) {

                                _speed = 0;

                                if (_horizontalMove == 0) {
                                   _newY = Map.y(this.div);
                                    _status = "normal";
                                    Ani.setAnimation(this.div, playerAnim.normal);
                                }
                                
                                _newY -= _horizontalMove;

                            }

                       break;

                       case 8:

                            if (Map.rampsect(_newX, _newY, _newW, _newH, _collisionBox.x1, _collisionBox.y1, _collisionBox.x2 - _collisionBox.x1, _collisionBox.y2 - _collisionBox.y1, _horizontalMove)) {

                                _speed = 0;

                                if (_horizontalMove === 0) {
                                    _newY = Map.y(this.div);
                                    _status = "normal";
                                    Ani.setAnimation(this.div, playerAnim.normal);
                                }
                                
                                _newY += _horizontalMove;

                            }

                       break;

                       case 6:

                          var _y = Map.intersect(_newY, _newY + _newH, _collisionBox.y1, _collisionBox.y2);
                          var _diffy = (_y[0] === _newY) ? _y[0] - _y[1] : _y[1] - _y[0];

                          if (_diffy > 40) {
                              _status = "drowned";
                          }

                       break;

                   }

               }
               
               // Paralar eklenecek
               
                for (var i = 0; i < coins.length; i++) {
                    if (Map.spriteCollide(player.div, coins[i])) {
                        coinSound = new Sound("audio/coin.ogg");
                        coinSound.volume = 0.6;
                        coinSound.playClip();
                        coins[i].remove();
                        coins.splice(i, 1);
                    }
                }
                
                //düşmanlar eklenecek
                
                for (var i = 0; i < enemies.length; i++) {
                    if (enemies[i].remove) {
                        enemies[i].div.remove();
                        enemies.splice(i, 1);
                        continue;
                    } else {
                        enemies[i].update();
                        if (Map.spriteCollide(player.div, enemies[i].div)) {
                            enemies[i].kill();
                            _speed = -32;
                        }   
                    }
                }
                
                // uçan kutular eklenecek
                
                for (var i = 0; i < flybox.length; i++) {
                    if (flybox[i].remove) {
                        flybox[i].div.remove();
                        flybox.splice(i, 1);
                        continue;
                    } else {
                        flybox[i].update();
                        if (Map.spriteCollide(this.div, flybox[i].div)) {
                            // burası kutunun üzerinde durubilme kısmı
                            
                            
                            var _x = Map.intersect(_newX, _newX + _newW, Map.x(flybox[i].div), (Map.x(flybox[i].div) + 70));
                            var _y = Map.intersect(_newY, _newY + _newH, (Map.y(flybox[i].div) + 46), (Map.y(flybox[i].div) + 70));

                            var _diffx = (_x[0] === _newX) ? _x[0] - _x[1] : _x[1] - _x[0];
                            var _diffy = (_y[0] === _newY) ? _y[0] - _y[1] : _y[1] - _y[0];

                            if (Math.abs(_diffx) > Math.abs(_diffy-5)) {

                                if ((Map.y(flybox[i].div) + 46) < Math.round(_newY + 93)) {
                                    if (_horizontalMove > 0) {
                                        _newX += flybox[i].direction + (flybox[i].speed * _delta) / 100.0;
                                    }
                                    if (_newX < Map.x(flybox[i].div) || _newX > Map.x(flybox[i].div)) {
                                          _newX = _newX + flybox[i].direction * flybox[i].speed;    
                                    }
                                    _newY -= _diffy;
                                    _speed = 0;
                                }

                                if (_status === "jump" && _diffy > 0) {
                                    _status = "normal";
                                }
                                
                                if (_newY === (Map.y(flybox[i].div) + 70) && _status === "jump") {
                                    puffEffect.show();
                                    Map.x(puffEffect, Map.x(this.div) + (Map.w(this.div) - 40) / 2);
                                    Map.y(puffEffect, Map.y(this.div) - 10);
                                    Ani.setAnimation(puffEffect, effectAnim.puff, false, function () {
                                        puffEffect.stop().fadeOut(100);
                                    });
                                    if (itemBoxSound !== undefined) {
                                        itemBoxSound.remove();
                                    }
                                    itemBoxSound = new Sound("audio/wall_hit.ogg");
                                    itemBoxSound.volume = 0.4;
                                    itemBoxSound.playClip();
                                }

                            } else {

                                _newX -= _diffx;

                            }
                            
                            
                        }   
                    }
                }

               if (_newX < 0) {
                   _newX = 0;
               }

               if (_newX > 6930) {
                   _newX = 6930;
               }

               Map.x(this.div, _newX);
               Map.y(this.div, _newY);
               _horizontalMove = 0;

            break;
                
          }
            
        };
        
        this.left = function () {
            switch (_status) {
                case "normal":
                    Ani.setAnimation(this.div, playerAnim.walk, true);
                    _status = "walk";
                    _horizontalMove -= 7;
                break;
                case "jump":
                    _horizontalMove -= 6;
                break;
                case "walk":
                    _horizontalMove -= 7;
                break;
            }
            Map.transform(this.div, {flipH: true});
        };
        
        this.right = function () {
            switch (_status) {
                case "normal":
                    Ani.setAnimation(this.div, playerAnim.walk, true);
                    _status = "walk";
                    _horizontalMove += 7;
                break;
                case "jump":
                    _horizontalMove += 6;
                break;
                case "walk":
                    _horizontalMove += 7;
                break;
            }
            Map.transform(this.div, {flipH: false});
        };

        this.climb = function ($direction) {
            switch(_status) {
                case "normal":
                case "walk":
                case "jump":
                    Ani.setAnimation(this.div, playerAnim.climb, true);
                    climbDirection = $direction;
                    _speed = 0;
                    _status = "climb";
                break;
            }
        };
        
        this.jump = function () {
          if (!climb && _speed === 0 && FantastikMacera.keyBoard["jump38"]) {
            FantastikMacera.keyBoard["jump38"] = false;
            $(document).trigger("keyup");
            switch (_status) {
                case "normal":
                case "walk":
                    jumpSound.playClip();
                    jumpEffect.show();
                    Map.x(jumpEffect, Map.x(this.div) + (Map.w(this.div) - 40) / 2);
                    Map.y(jumpEffect, Map.y(this.div) + (Map.h(this.div) + 20) / 2);
                    Ani.setAnimation(jumpEffect, effectAnim.jump, false, function () {
                        jumpEffect.fadeOut(180);
                    });
                    _speed = -52;
                    Ani.setAnimation(this.div, playerAnim.jump);   
                   _status = "jump";
                break;
            }
          } else if (_speed === 0 && !FantastikMacera.keyBoard["jump38"]) {
              switch(_status) {
                  case "normal":
                  case "jump":
                    _status = "normal";
                    Ani.setAnimation(this.div, playerAnim.normal);
                  break;
              }
          }
        };
        
        this.idle = function () {
            switch (_status) {
                case "climb":
                case "normal":
                case "walk":
                    _status = "normal";
                    Ani.setAnimation(this.div, playerAnim[climb ? "climb" : "normal"]);
                break;
            }
        };
        
    });
    
    var flyAnim = {
        normal: new Ani.animation({
            url: "assets/fly.png"
        }),
        walk: new Ani.animation({
            url: "assets/fly.png",
            width: 69,
            numberOfFrames: 2,
            rate: 90
        }),
        dead: new Ani.animation({
            url: "assets/fly.png",
            offsetx: 130
        })
    };
    
    var beeAnim = {
        normal: new Ani.animation({
            url: "assets/bee.png"
        }),
        walk: new Ani.animation({
            url: "assets/bee.png",
            width: 61,
            numberOfFrames: 2,
            rate: 90
        }),
        dead: new Ani.animation({
            url: "assets/bee.png"
        })
    };
    
    var flyBox = {
        box: new Ani.animation({
            url: "assets/tiles.png",
            width: 70,
            offsetx: 910
        })
    };
    
    var FlyBox = function () {
        
        this.init = function ($div, $type, $dir1, $dir2, $speed, $anim) {
            this.div = $div;
            this.type = $type;
            this.dir1 = $dir1;
            this.dir2 = $dir2;
            this.anim = $anim;
            this.direction = 1;
            this.speed = $speed;
            this.remove = false;
            Ani.setAnimation($div, $anim.box);
        };
        
        this.update = function () {
            if (!this.remove) {
              
              switch (this.type) {
                  
                  case "horizontal":
                  
                    var _positionX = Map.x(this.div);
                    
                    if (_positionX < this.dir1) {
                        this.direction = 1;
                    }
                    
                    if (_positionX > this.dir2) { 
                        this.direction = -1; 
                    }
                    
                    Map.x(this.div, Map.x(this.div) + this.direction * this.speed);
                  
                  break;
                  
              }

            } 
        };
        
    };
    
    var Enemy = function () {

        this.init = function ($div, $x1, $x2, $speed, $anim) {
            this.div = $div;
            this.x1 = $x1;
            this.x2 = $x2;
            this.anim = $anim;
            this.direction = 1;
            this.speed = $speed;
            this.dead = false;
            this.sound = true;
            this.remove = false;
            Map.transform($div, {flipH: true});
            Ani.setAnimation($div, $anim.walk, true);
        };

        this.update = function () {
            if (this.dead) {
                this.dies();
            } else {
              if (!this.remove) {
                var _position = Map.x(this.div);
                if (_position < this.x1) {
                    this.direction = 1;
                    Map.transform(this.div, {flipH: true});
                }
                if (_position > this.x2) {
                    this.direction = -1;
                    Map.transform(this.div, {flipH: false});
                }
                Map.x(this.div, Map.x(this.div) + this.direction * this.speed);
              }  
            }
        };

        this.kill = function () {
            this.dead = true;
            Ani.setAnimation(this.div, this.anim.dead);
        };

        this.dies = function () {};

    };

    var Fly = function () {};
    Fly.prototype = new Enemy();
    Fly.prototype.dies = function () {

        if (this.sound) {
            dieFly.playClip();
            this.sound = false;
        }

        Map.transform(this.div, {flipV: true});

        Map.y(this.div, Map.y(this.div) + 10);
        if (Map.y(this.div) > 700) {
            this.remove = true;
        }

    };

    Map.addCallback(function () {
      
      if (!FantastikMacera.pause) {  
        
        switch (gameState) {
            
            case "start":break;
            
            case "map":break;
            
            case "level":

                var _idle = true;
                
                if (FantastikMacera.keyBoard[37]) {
                    player.left();
                    _idle = false;
                }

                if (FantastikMacera.keyBoard[38]) {
                    if (climb) {
                         player.climb(-1);
                    } else {
                       player.jump();
                    }
                    _idle = false;
                }

                if (FantastikMacera.keyBoard[39]) {
                    player.right();
                    _idle = false;
                }
                
                if (FantastikMacera.keyBoard[40]) {
                    if (climb) {
                       if (Map.y(player.div) < 465) {
                            player.climb(1);
                            _idle = false;
                       } else {
                            Ani.setAnimation(player.div, playerAnim.normal);
                            climb = false;
                            _idle = true;
                       }  
                    }
                }
                
                if (_idle) {
                    player.idle();
                }

                player.update();
                
                var _margin = {x: 200, y: (600 - 192) / 2};
                var _playerPos = {x: Map.x(player.div), y: Map.y(player.div)};
                var _offset = _margin.x - Math.min(Math.max(_playerPos.x, _margin.x), Map.w($(FantastikMacera.tilemap)) - 800 + _margin.x);

                Map.x(group, _offset);
                
                // Bazı kutuları düzenliyoruz

                Map.setTileBox(group, {line: 3, column: 17, top: 240});
                Map.setTileBox(group, {line: 6, column: 79, top: 466, left: 5540});

                $("#backgroundBack").css("backgroundPosition", (_offset * 0.22) + "px 0px");
                $("#backgroundFront").css("backgroundPosition", (_offset * 0.44) + "px 0px");
                $("#backgroundMiddle").css("backgroundPosition", (_offset * 0.66) + "px 0px");

            break;
            
        }
        
      }  
        
    }, Ani.baseRate);

    var getFlyBox = function () {
        
        var box1 = new FlyBox();
        box1.init(
            Ani.addSprite(group, "box1", {width: 70, height: 70, x: 1300, y: 380, zIndex: 4}),
            "horizontal", 1300, 1600, 3.4,
            flyBox
        );
        flybox.push(box1);
        
    };

    var getEnemies = function() {

        for(var i = 0; i < enemies.length; i++){
            enemies[i].div.remove();
        }

        enemies = [];

        var fly1   = new Fly();
        fly1.init(
          Ani.addSprite(group, "fly1", {width: 65, height: 45, x: 220, y: 260, zIndex: 5}),
          260, 490, 5,
          flyAnim
        );
        enemies.push(fly1);

        var bee1   = new Fly();
        bee1.init(
          Ani.addSprite(group, "bee1", {width: 61, height: 48, x: 1020, y: 250, zIndex: 5}),
          780, 1020, 7,
          beeAnim
        );
        enemies.push(bee1);

    };
    
    var getCoins = function () {
        
        var coin1 = Ani.addSprite(group, "coin1", {width: 32, height: 32, x: 100, y: 350, zIndex: 5});
        coins.push(coin1);
        
        var coin2 = Ani.addSprite(group, "coin2", {width: 32, height: 32, x: 100, y: 300, zIndex: 5});
        coins.push(coin2);
        
        var coin3 = Ani.addSprite(group, "coin3", {width: 32, height: 32, x: 100, y: 250, zIndex: 5});
        coins.push(coin3);
        
        
        
        var coin4 = Ani.addSprite(group, "coin4", {width: 32, height: 32, x: 650, y: 250, zIndex: 5});
        coins.push(coin4);
        


        var coin5 = Ani.addSprite(group, "coin5", {width: 32, height: 32, x: 850, y: 390, zIndex: 5});
        coins.push(coin5);
        
        var coin6 = Ani.addSprite(group, "coin6", {width: 32, height: 32, x: 900, y: 390, zIndex: 5});
        coins.push(coin6);

        var coin7 = Ani.addSprite(group, "coin7", {width: 32, height: 32, x: 950, y: 390, zIndex: 5});
        coins.push(coin7);
        
        var coin8 = Ani.addSprite(group, "coin8", {width: 32, height: 32, x: 1000, y: 390, zIndex: 5});
        coins.push(coin8);

        
        
        var coin9 = Ani.addSprite(group, "coin9", {width: 32, height: 32, x: 1345, y: 110, zIndex: 5});
        coins.push(coin9);
        
        var coin10 = Ani.addSprite(group, "coin10", {width: 32, height: 32, x: 1395, y: 110, zIndex: 5});
        coins.push(coin10);

        var coin11 = Ani.addSprite(group, "coin11", {width: 32, height: 32, x: 1445, y: 110, zIndex: 5});
        coins.push(coin11);
        
        var coin12 = Ani.addSprite(group, "coin12", {width: 32, height: 32, x: 1495, y: 110, zIndex: 5});
        coins.push(coin12);      
        
        
        
        var coin13 = Ani.addSprite(group, "coin13", {width: 32, height: 32, x: 1650, y: 220, zIndex: 5});
        coins.push(coin13);
        
        var coin14 = Ani.addSprite(group, "coin14", {width: 32, height: 32, x: 1650, y: 270, zIndex: 5});
        coins.push(coin14);

        var coin15 = Ani.addSprite(group, "coin15", {width: 32, height: 32, x: 1650, y: 320, zIndex: 5});
        coins.push(coin15);
        
        var coin16 = Ani.addSprite(group, "coin16", {width: 32, height: 32, x: 1650, y: 370, zIndex: 5});
        coins.push(coin16); 
        
        var coin17 = Ani.addSprite(group, "coin17", {width: 32, height: 32, x: 1700, y: 220, zIndex: 5});
        coins.push(coin17);
        
        var coin18 = Ani.addSprite(group, "coin18", {width: 32, height: 32, x: 1700, y: 270, zIndex: 5});
        coins.push(coin18);

        var coin19 = Ani.addSprite(group, "coin19", {width: 32, height: 32, x: 1700, y: 320, zIndex: 5});
        coins.push(coin19);
        
        var coin20 = Ani.addSprite(group, "coin20", {width: 32, height: 32, x: 1700, y: 370, zIndex: 5});
        coins.push(coin20); 
        
        
        
        var coin21 = Ani.addSprite(group, "coin21", {width: 32, height: 32, x: 2300, y: 300, zIndex: 5});
        coins.push(coin21);
        
        var coin22 = Ani.addSprite(group, "coin22", {width: 32, height: 32, x: 2400, y: 300, zIndex: 5});
        coins.push(coin22);

        var coin23 = Ani.addSprite(group, "coin23", {width: 32, height: 32, x: 2500, y: 300, zIndex: 5});
        coins.push(coin23);
        
        var coin24 = Ani.addSprite(group, "coin24", {width: 32, height: 32, x: 2600, y: 300, zIndex: 5});
        coins.push(coin24); 
        
        var coin25 = Ani.addSprite(group, "coin25", {width: 32, height: 32, x: 2350, y: 350, zIndex: 5});
        coins.push(coin25);
        
        var coin26 = Ani.addSprite(group, "coin26", {width: 32, height: 32, x: 2450, y: 350, zIndex: 5});
        coins.push(coin26);

        var coin27 = Ani.addSprite(group, "coin27", {width: 32, height: 32, x: 2550, y: 350, zIndex: 5});
        coins.push(coin27);
        
        var coin28 = Ani.addSprite(group, "coin28", {width: 32, height: 32, x: 2650, y: 350, zIndex: 5});
        coins.push(coin28); 
        
        
        
        var coin29 = Ani.addSprite(group, "coin29", {width: 32, height: 32, x: 3090, y: 400, zIndex: 5});
        coins.push(coin29);

        var coin30 = Ani.addSprite(group, "coin30", {width: 32, height: 32, x: 3170, y: 350, zIndex: 5});
        coins.push(coin30);
        
        var coin31 = Ani.addSprite(group, "coin31", {width: 32, height: 32, x: 3250, y: 400, zIndex: 5});
        coins.push(coin31); 
        
        for (var i = 0; i < coins.length; i++) {
         
            Ani.setAnimation(coins[i], coinAnim.play, true);
            
        }

        
    };

    /**
     * Oyunu Çalıştırıyoruz 
     */

    var startGame = function () {

      Map.baseDiv.append("<div id='game-container'></div>");

      container = $("#game-container");

      var backgroundBack = Ani.addSprite(container, "backgroundBack", {width: 800, height: 700, zIndex: 1});
      var backgroundMiddle = Ani.addSprite(container, "backgroundMiddle", {width: 800, height: 700, zIndex: 2});
      var backgroundFront = Ani.addSprite(container, "backgroundFront", {width: 800, height: 700, zIndex: 3});

      group = Map.addGroup(container, "group");

      Map.importTilemap("levels/level1.json", group, "level");

      player.div = Ani.addSprite(group, "player", {width: 75, height: 93, zIndex: 5});

      jumpEffect = Ani.addSprite(group, "jumpEffect", {width: 42, height: 41, zIndex: 5});

      puffEffect = Ani.addSprite(group, "puffEffect", {width: 42, height: 41, zIndex: 5});

      Ani.setAnimation(player.div, playerAnim.normal);
      Ani.setAnimation(backgroundBack, backgroundBackAnim);
      Ani.setAnimation(backgroundMiddle, backgroundMiddleAnim);
      Ani.setAnimation(backgroundFront, backgroundFrontAnim);

      backSound.playClip(true);

      //Map.x(player.div, 3000);

      // Paralar eklenecek

      getCoins();

      getEnemies();
      
      getFlyBox();

      container.css("display", "block");

      Map.baseDiv.append("<div id='play'></div>");
      Map.baseDiv.append("<div id='pause'></div>");

      $("#play").on("click", function (e) {
        FantastikMacera.pause = false;
        backSound = new Sound("audio/land_2.ogg");
        backSound.volume = 0.2;
        backSound.playClip(true);
        Map.baseDiv.find("#pause-effect").remove();
        $(this).hide();
        $("#pause").show();
      });

      $("#pause").on("click", function (e) {
        
        if (!FantastikMacera.pause) {

            FantastikMacera.pause = true;
            backSound.stopClip();
            Map.baseDiv.append("<div id='pause-effect'><span>Pause</span></div>");
            $(this).hide();
            $("#play").show();              
              
        }

      });

    };

    var startGamePreload = function (p) {

        $("#progress").html("Yükleniyor " + p);

    };

    FantastikMacera.startGame(startGame, startGamePreload);

};

FantastikMacera.refreshGame = function () {

    var _finishedAnimations = [];
    
    for (var i = 0; i < Ani.animations.length; i++) {
        var _animate = Ani.animations[i];
        _animate.counter++;
        
        if (_animate.counter === _animate.animation.rate) {
            _animate.counter = 0;
            _animate.animation.currentFrame++;
            
            if (!_animate.loop && _animate.animation.currentFrame >= _animate.animation.numberOfFrames) {
                _finishedAnimations.push(i);
                if (_animate.callback) {
                    _animate.callback();
                }
            } else {
                _animate.animation.currentFrame %= _animate.animation.numberOfFrames;
                Ani.setFrame(_animate.div, _animate.animation);
            }
        }
    }
    
    for (var i = _finishedAnimations.length - 1; i >= 0; i--) {
        Ani.animations.splice(_finishedAnimations[i], 1);
    }
    
    for (var i = 0; i < Map.callbacks.length; i++) {
        var _call = Map.callbacks[i];
        
        _call.counter++;
        if (_call.counter === _call.rate) {
            var _currentTime = (new Date()).getTime();
            _call.counter = 0;
            _call.callback(_currentTime - Ani.time);
        }
    }

    Ani.time = (new Date()).getTime();

};

FantastikMacera.startGame = function ($endCallback, $progressCallback) {
    
    var _images = [];
    var _total = Ani.imagesToPreload.length;
    
    for (var i = 0; i < _total; i++) {
        var _img = new Image();
        _images.push(_img);
        _img.src = Ani.imagesToPreload[i];
    }
    
    var _preloadingPoller = setInterval(function () {
        
        var _counter = 0;
        var _total = Ani.imagesToPreload.length;
        
        for (var i = 0; i < _total; i++) {
            if (_images[i].complete) {
                _counter++;
            }
        }

        if (_counter === _total) {
            clearInterval(_preloadingPoller);
            $endCallback();
            setInterval(FantastikMacera.refreshGame, Ani.baseRate);
            Ani.time = (new Date()).getTime();
        } else {
            if ($progressCallback) {
                _counter++;
                $progressCallback((_counter / _total) * 100);
            }
        }
        
    }, 100);
    
};

$(document).on("keydown", function (e) {
   FantastikMacera.keyBoard[e.keyCode] = true; 
});

$(document).on("keyup", function (e) {
   FantastikMacera.keyBoard["jump" + e.keyCode] = true;
   FantastikMacera.keyBoard[e.keyCode] = false;
});

$(window).on("load", FantastikMacera.init);

// $(window).on("focus blur", function (e) {
    // $("#pause").trigger("click");
// });