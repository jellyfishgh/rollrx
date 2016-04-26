(function () {
    function random(low, high) {
        return Math.floor(Math.random() * (high + 1)) - low;
    }
    function Box(point, parent) {
        this.parent = parent;
        this.id = "box_" + Date.now();
        this.point = {
            x: point[0],
            y: point[1]
        };
        this.buildBox();
    }
    Box.prototype.buildBox = function () {
        this.parent.append($("<div class='box' id = '" + this.id + "'>").css({
            height: 20,
            width: 20,
            position: 'absolute',
            top: this.point.y - 10,
            left: this.point.x - 10,
            display: 'none',
            backgroundColor: "rgb(" + (random(0, 255)) + ", " + (random(0, 255)) + ", " + (random(0, 255)) + ")"
        }));
        return this;
    };
    Box.prototype.showBox = function () {
        return this.parent.find("#" + this.id).fadeIn('fast');
    };
    Box.prototype.hideBox = function () {
        return this.parent.find("#" + this.id).fadeOut('fast', function () {
            return $(this).remove();
        });
    };
    $(function () {
        Rx.Observable.prototype.movingWindow = function (size, selector, onShift) {
            var source = this;
            return Rx.Observable.create(function (o) {
                var arr = [];
                return source.subscribe(function (x) {
                    var item = selector(x);
                    arr.push(item);
                    if (arr.length > size) {
                        var i = arr.shift();
                        onShift(i);
                    }
                }, function (e) {
                    o.onError(e);
                }, function () {
                    o.onComplted();
                });
            });
        };
        Rx.Observable.fromEvent($("#drawing"), 'mousemove').movingWindow(25, function (x) {
            var b = new Box([x.clientX, x.clientY], $("#drawing"));
            b.showBox();
            return b;
        }, function (b) {
            b.hideBox();
        }).subscribe();
    });
})();