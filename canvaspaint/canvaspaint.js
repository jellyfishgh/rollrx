(function (window, document, Rx) {
    Rx.DOM = {};
    ['mousemove', 'mouseup', 'mousedown', 'click'].forEach(function (name) {
        Rx.DOM[name] = function (element, selector) {
            return Rx.Observable.fromEvent(element, name, selector);
        }
    });
    Rx.DOM.ready = function () {
        return Rx.Observable.create(function (o) {
            function handler() {
                o.onNext();
                o.onCompleted();
            }
            var added = false;
            if (document.readyState === 'completed') {
                handler();
            } else {
                document.addEventListener('DOMContentLoaded', handler, false);
                added = true;
                return Rx.Disposable.create(function () {
                    if (added) document.removeEventListener('DOMContentLoaded', handler, false);
                });
            }
        }).take(1);
    };
    function getOffset(event) {
        return {
            offsetX: event.offsetX === undefined ? event.layerX : event.offsetX,
            offsetY: event.offsetY === undefined ? event.layerY : event.offsetY
        };
    }
    Rx.DOM.ready().subscribe(function () {
        var canvas = document.getElementById("tutorial");
        var colorchart = document.querySelectorAll("#colorchart tr td");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        var mouseMoves = Rx.DOM.mousemove(canvas),
            mouseDowns = Rx.DOM.mousedown(canvas),
            mouseUps = Rx.DOM.mouseup(canvas);
        var colorValues = Rx.DOM.click(colorchart).tap(function () {
            ctx.beginPath();
        }).map(function (e) {
            return e.target.bgColor;
        }).startWith('#000000');
        var mouseDiffs = mouseMoves.zip(mouseMoves.skip(1), function (x, y) {
            return {
                first: getOffset(x),
                second: getOffset(y)
            };
        });
        var mouseButton = mouseDowns.map(true).merge(mouseUps.map(false));
        var paint = mouseButton.flatMapLatest(function (down) {
            return down ? mouseDiffs : Rx.Observable.never();
        }).combineLatest(colorValues, function (pos, color) {
            return {
                pos: pos,
                color: color
            };
        });
        paint.subscribe(function (x) {
            ctx.strokeStyle = x.color;
            ctx.moveTo(x.pos.first.offsetX, x.pos.first.offsetY);
            ctx.lineTo(x.pos.second.offsetX, x.pos.second.offsetY);
            ctx.stroke();
        });
    });
} (window, document, window.Rx));