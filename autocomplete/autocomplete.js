(function (global, $, Rx) {
    function searchWikipedia(term) {
        return $.ajax({
            url: 'http://en.wikipedia.org/w/api.php',
            dataType: 'jsonp',
            data: {
                action: 'opensearch',
                format: 'json',
                search: term
            }
        }).promise();
    }
    function main() {
        var $input = $("#textInput"),
            $results = $("#results"),
            keyup = Rx.Observable.fromEvent($input, 'keyup').map(function (e) {
                return e.target.value;
            }).filter(function (text) {
                return text.length > 2;
            }).debounce(750).distinctUntilChanged();
        var searcher = keyup.flatMapLatest(searchWikipedia);
        searcher.subscribe(function(data){
            $results.empty().append($.map(data[1], function(v){
                return $("<li>").text(v);
            }));
        }, function(error){
            $results.empty().append($("<li>").text('Error: ' + error))
        });
    }
    $(main);
} (window, window.jQuery, window.Rx));