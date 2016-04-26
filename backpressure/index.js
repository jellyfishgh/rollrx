(function(Rx, $){
    function main(){
        var fromEvent = Rx.Observable.fromEvent;
        function isChecked(x){return x.checked;}
        function notChecked(x){return !x.checked;}
        var $llr = $("#losslessResults"), $llt = $("#losslessToggle");
        function logInput(text){
            $llr.append($("<li>").text(text));
        }
        var mousemove = fromEvent(document, 'mouseup').map(function(e){
            return 'clientX: ' + e.clientX + ', clientY: ' + e.clientY;
        }).pausableBuffered();
        fromEvent($llt, 'click').map(function(e){
            return e.target.checked;
        }).subscribe(function(checked){
            if(checked)mousemove.resume();
            else mousemove.pause();
        });
        mousemove.subscribe(function(text){
            logInput(text);
        });
    }
    $(main);
}(window.Rx, window.jQuery));