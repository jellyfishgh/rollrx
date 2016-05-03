(function (Rx) {
    var boundingBox, handles = [], handleNodes, overlay, ctx;
    function loadImage() {
        var buffer = document.getElementById("buffer"),
            img = new Image();
        img.src = './crop.png';
        return Rx.Observable.fromEvent(img, 'load').map(function () {
            overlay.width = img.width;
            overlay.height = img.height;
            buffer.width = img.width;
            buffer.height = img.height;
            buffer.getContext('2d').drawImage(img, 0, 0);
            return {
                width: img.widgh,
                height: img.height
            };
        });
    }
    function initBoundingBox(size) {
        boundingBox = {
            x: 0,
            y: 0,
            x2: size.width,
            y2: size.height
        }
    }
    function createHandles() {
        var container = document.querySelector('#container');
        function createHandle(id, render, updateModel) {
            var handle = document.createElement("div");
            handle.className += ' handle';
            handle.setAttribute('id', id);
            container.appendChild(handle);
            handle['render'] = render;
            handle['updateModel'] = updateModel;
            handles.push(handle);
        }
        createHandle('tl', function () {
            this.style.top = boundingBox.y + 'px';
            this.style.left = boundingBox.x + 'px';
        }, function (x, y) {
            boundingBox.x = x;
            boundingBox.y = y;
        });
        createHandle('tr', function () {
            this.style.top = boundingBox.y + 'px';
            this.style.left = boundingBox.x2 + 'px';
        }, function (x, y) {
            boundingBox.y = y;
            boundingBox.x2 = x;
        });
        createHandle('bl', function (s) {
            this.style.top = boundingBox.y2 + 'px';
            this.style.left = boundingBox.x + 'px';
        }, function (x, y) {
            boundingBox.x = x;
            boundingBox.y2 = y;
        });
        createHandle('br', function (s) {
            this.style.top = boundingBox.y2 + 'px';
            this.style.left = boundingBox.x2 + 'px';
        }, function (x, y) {
            boundingBox.y2 = y;
            boundingBox.x2 = x;
        });
        handles.forEach(function (element) { element['render'](); });
        handleNodes = document.querySelectorAll('.handle');
    }
    function respondToGestures() {
        var moves = 'mousemove', downs = 'mousedown', ups = 'mouseup';
        if (window.navigator.pointerEnabled) {
            moves = 'pointermove';
            downs = 'pointerdown';
            ups = 'poiterup';
        }
        var fromEvent = Rx.Observable.fromEvent;
        var move = fromEvent(overlay, moves),
            up = fromEvent(document, ups),
            down = fromEvent(handleNodes, downs);
        return down.flatMap(function (handle) {
            handle.preventDefault();
            return move.map(function (pos) {
                return {
                    element: handle.target,
                    offsetX: pos.offsetX,
                    offsetY: pos.offsetY
                }
            }).takeUntil(up);
        });
    }
    function drawOverlay() {
        var x = boundingBox.x,
            y = boundingBox.y,
            w = boundingBox.x2 - x,
            h = boundingBox.y2 - y;
            
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, overlay.width, overlay.height);
        
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(x, y, w, h);
        ctx.fill();
        
        handles.forEach(function (tool) { tool['render'](); });
    }
    function main() {
        overlay = document.getElementById("overlay");
        ctx = overlay.getContext("2d");
        loadImage().flatMap(function (size) {
            initBoundingBox(size);
            createHandles();
            return respondToGestures();
        }).subscribe(function (data) {
            data.element.updateModel(data.offsetX, data.offsetY);
            Rx.Scheduler.requestAnimationFrame.schedule(null, drawOverlay);
        });
    }
    main();
})(window.Rx);