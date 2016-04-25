(function() {
    Rx.Observable.random = function(low, high, intervalLow, intervalHigh, howMany, scheduler) {
        if (!scheduler) scheduler = Rx.Scheduler['default'];
        if (!howMany) howMany = -1;
        if (!intervalLow) intervalLow = 1;
        if (!intervalHigh) intervalHigh = 1;
        return Rx.Observable.create(function(observer) {
            var delta = high - low,
                intervalDelta = intervalHigh - intervalLow;
            var iFunc = (intervalDelta === 0) ? function() {
                return intervalLow;
            } : function() {
                return Math.floor(Math.random() * intervalDelta + intervalLow);
            };
            return scheduler.scheduleRecursiveFuture(0, iFunc(), function(ticks, recurse) {
                if (++ticks <= howMany) {
                    observer.onNext(Math.floor(Math.random() * delta + low));
                    recurse(ticks, iFunc());
                } else {
                    observer.onCompleted();
                }
            });
        });
    };
    var GameState = {
        playing: 'playing',
        paused: 'paused',
        stopped: 'stopped'
    };
    var AlphabetInvasion = (function() {
        function AlphabetInvasion() {
            this.enemies = [];
            this.modalBox = document.querySelector('#modalmessages');
            this.message = document.querySelector('#message');
            this.score = document.querySelector('#score');
            this.playfield = document.querySelector('#playfield');
            this.level = document.querySelector("#level");
            this.remainingEnemies = document.querySelector("#remaining");
            this.highScore = document.querySelector("#highscore");
        }
        var CURRENT_SPEED = 0;
        var LAUNCH_RATE = 1;
        var HIGH_SCORE_STORAGE_KEY = '_alphabet_attack_high_score_';
        var playfieldheight = 0;
        var lookup = "abcdefghijklmnopqrstuvwxyz";
        var levels = {
            "Level 1 - Rookies": [60, 1300],
            "Level 2 - Tenderfoots": [55, 1200]
            // "Level 3 - Militia": [50, 1100],
            // "Level 4 - Privates": [50, 1000],
            // "Level 5 - Corporals": [45, 800],
            // "Level 6 - Sergeants": [40, 650],
            // "Level 7 - Master Sergeants": [35, 500],
            // "Level 8 - Lieutenants": [30, 450],
            // "Level 9 - Captains": [25, 400],
            // "Level 10 - Majors": [20, 400],
            // "Level 11 - Colonels": [15, 350],
            // "Level 12 - Generals": [11, 350],
            // "Level 13 - Special Forces": [9, 350],
            // "Level 14 - Black Ops": [7, 350],
            // "Level 15 - Ninjas": [5, 350]
        };
        AlphabetInvasion.prototype.showMessage = function(msg) {
            if (msg && msg.length === 0) {
                this.message.text = '';
                return;
            }
            this.modalBox.style.opacity = 1;
            function f(i) {
                var self = this;
                Rx.Observable.just(i).delay(30 * i).subscribe(function(x) {
                    self.message.textContent = msg.substring(0, x + 1);
                });
            }
            for (var i = 0, len = msg.length; i < len; i++) {
                f.call(this, i);
            }
        };
        AlphabetInvasion.prototype.clearPlayfield = function() {
            for (var i = 0, len = this.enemies.length; i < len; i++)
                this.playfield.removeChild(this.enemies[i]);
            this.enemies = [];
        };
        AlphabetInvasion.prototype.resetGame = function() {
            this.gameState = GameState.paused;
            this.showMessage('');
            this.currentLevel = 1;
            this.score.textContent = '0';
            this.level.textContent = '1';
            this.remainingEnemies.textContent = '-';
            this.clearPlayfield();
            // if (this.windowHeight) this.windowHeight.dispose();
            // if (this.matcher) this.matcher.dispose();
            if (this.generator) this.generator.dispose();
            if (this.gameloop) this.gameloop.dispose();
            if (this.keyboard) this.keyboard.dispose();
            this.showMessage('PRESS ANY KEY TO START');
        };
        AlphabetInvasion.prototype.hideMessage = function() {
            this.modalBox.style.opacity = 0;
        };
        AlphabetInvasion.prototype.youLose = function() {
            for (var i = 0, len = this.enemies.length; i < len; i++) {
                var enemy = this.enemies[i];
                if (enemy !== this.enemies[0]) {
                    enemy.textContent = ':P';
                    enemy.className += ' rotate';
                    enemy.style.fontSize = '72px';
                }
            }
            this.finish('You Lose Earthing. Prepare to be alphabetized!');
        };
        AlphabetInvasion.prototype.updatePlayfield = function() {
            playfieldheight = this.playfield.clientTop + this.playfield.clientHeight;
            var factor = playfieldheight / 200;
            var self = this;
            Rx.Observable.fromArray(this.enemies).subscribe(function(enemy) {
                var newPos = enemy.offsetTop + factor;
                if (newPos >= playfieldheight + 44) self.youLose();
            });
        };
        AlphabetInvasion.prototype.finish = function(msg) {
            if (this.gameState === GameState.stopped) return;
            this.gameState = GameState.stopped;
            this.gameloop.dispose();
            this.generator.dispose();
            this.keyboard.dispose();
            this.showMessage(msg);
            var self = this;
            Rx.Observable.timer(5500).subscribe(function() {
                self.resetGame();
            });
        };
        AlphabetInvasion.prototype.youWin = function() {
            this.finish("You win this time Earthing! We'll be back soon!");
        };
        AlphabetInvasion.prototype.nextLevel = function() {
            if (this.currentLevel === 2) this.youWin();
            this.gameState = GameState.stopped;
            this.gameloop.dispose();
            this.generator.dispose();
            this.keyboard.dispose();
            this.showMessage('Level ' + this.currentLevel + ' Completed');
            this.currentLevel++;
            var self = this;
            Rx.Observable.timer(4000).subscribe(function() {
                self.playLevel();
            });
        };
        AlphabetInvasion.prototype.addToScore = function(amount) {
            var newScore = parseInt(this.score.textContent) + amount;
            this.score.textContent = newScore;
            if (newScore > parseInt(this.highScore.textContent)) {
                this.highScore.textContent = newScore;
                window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, newScore);
            }
        };
        AlphabetInvasion.prototype.killEnemy = function(enemy) {
            enemy.style.color = 'red';
            enemy.style.fontSize = '48px';
            enemy.textContent = '@';
            var v = enemy.offsetTop;
            this.addToScore((this.playfield.clientHeight - v) * this.currentLevel);
            var self = this;
            Rx.Observable.timer(750).subscribe(function() {
                self.playfield.removeChild(enemy);
            });
        };
        AlphabetInvasion.prototype.launchNewEnemy = function(v) {
            var r = Math.floor(Math.random() * 100 + 155),
                g = Math.floor(Math.random() * 100 + 155),
                b = Math.floor(Math.random() * 100 + 155),
                enemy = document.createElement('div');
            enemy.style.color = 'rgb(' + r + ',' + g + ',' + b + ')';
            enemy.style.position = 'absolute';
            enemy.style.top = this.playfield.offsetTop + 'px';
            enemy.style.left = (Math.random() * (this.playfield.clientWidth - 25)) + 'px';
            enemy.className = 'enemy';
            enemy.textContent = v;
            this.enemies.push(enemy);
            this.playfield.appendChild(enemy);
        };
        AlphabetInvasion.prototype.playLevel = function() {
            if (this.generator) this.generator.dispose();
            var title, found = false;
            for (var level in levels) {
                if (level.indexOf(this.currentLevel) !== -1) found = true;
                if (found) {
                    title = level;
                    break;
                }
            }
            var config = levels[level];
            this.gameState = GameState.playing;
            this.level.textContent = this.currentLevel;
            this.showMessage(title);
            var self = this;
            var play = function() {
                self.hideMessage();
                var enemiesThisLevel = self.currentLevel * 2 + 2;
                self.remainingEnemies.textContent = enemiesThisLevel;
                var capitalLetterProbability = 1 - ((self.currentLevel * 2.5) / 100);
                var killed = 0;
                var allEnemiesLaunched = false;
                self.gameloop = Rx.Observable.interval(config[CURRENT_SPEED]).subscribe(function() {
                    self.updatePlayfield();
                });
                self.keyboard = self.keyboardObservable.subscribe(function(e) {
                    if (self.enemies.length === 0 && !allEnemiesLaunched) return;
                    if (self.enemies.length === 0 && allEnemiesLaunched) {
                        self.nextLevel();
                        return;
                    }
                    var key = e.shiftKey ? String.fromCharCode(e.keyCode) : String.fromCharCode(e.keyCode).toLowerCase();
                    console.log('key pressed: ' + key + ' enemy text: ' + self.enemies[0].textContent);
                    if (key === self.enemies[0].textContent) {
                        var enemy = self.enemies.shift();
                        self.killEnemy(enemy);
                        self.remainingEnemies.textContent = enemiesThisLevel - ++killed;
                        if (self.enemies.length === 0 && allEnemiesLaunched) self.nextLevel();
                    }
                });
                self.generator = Rx.Observable.random(0, 25, config[LAUNCH_RATE], config[LAUNCH_RATE], enemiesThisLevel).select(function(v) {
                    return Math.random() <= capitalLetterProbability ? lookup.charAt(v) : lookup.charAt(v).toUpperCase();
                }).subscribe(function(v) {
                    self.launchNewEnemy(v);
                }, function(e) {
                    throw e;
                }, function() {
                    allEnemiesLaunched = true;
                });
            };
            Rx.Observable.timer(2500).subscribe(function() {
                play();
            });
        };
        AlphabetInvasion.prototype.run = function() {
            this.resetGame();
            this.keyboardObservable = Rx.Observable.fromEvent(document, 'keyup');
            var self = this;
            this.keyboardObservable.subscribe(function() {
                if (self.gameState === GameState.paused) {
                    self.hideMessage();
                    self.playLevel();
                }
            });
            if (window.localStorage) {
                var hs = window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
                if (hs !== null) {
                    this.highScore.textContent = hs;
                }
            }
        };
        return AlphabetInvasion;
    })();
    var game = new AlphabetInvasion();
    game.run();
})();
