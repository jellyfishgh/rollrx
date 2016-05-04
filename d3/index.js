(function (window, d3, Rx) {
    "use strict";
    var fromEvent = Rx.Observable.fromEvent;
    var updatesOverTime = [];
    var width = 960, height = 600, margins = {
        top: 20,
        bottom: 50,
        left: 70,
        right: 20
    };
    var svg = d3.select("svg").attr("width", width).attr("height", height);
    var xRange = d3.time.scale().range([margins.left, width - margins.right]).domain([new Date(), new Date()]);
    var yRange = d3.scale.linear().range([height - margins.bottom, margins.top]).domain([0, 0]);
    var xAxis = d3.svg.axis().scale(xRange).tickSize(5).tickSubdivide(true).tickFormat(d3.time.format("%X"));
    var yAxis = d3.svg.axis().scale(yRange).tickSize(5).orient("left").tickSubdivide(true);

    var xAxisElement = svg.append('g').attr('class', 'x axis')
        .attr('transform', 'translate(0,' + (height - margins.bottom) + ')').call(xAxis);
    var xAxisWidth = ((width - margins.right) - margins.left);
    xAxisElement.append("text").attr("x", margins.left + xAxisWidth).attr("y", 0).attr("dy", "3em").
        style("text-anchor", "middle").text("Time");

    var yAxisElement = svg.append('g').attr('class', 'y axis').
        attr('transform', 'translate(' + (margins.left) + ',0)').
        call(yAxis);
    var yAxisHeight = ((height - margins.bottom) - margins.top) / 2;
    yAxisElement.append('text').attr('transform', 'rotate(-90)').attr('y', 0).
        attr('x', -(margins.top + yAxisHeight)).attr('dy', '-3.5em').style('text-anchor', 'middle').
        text('Updates per secons');

    var lineFunc = d3.svg.line().x(function (d) {
        return xRange(d.x);
    }).y(function (d) {
        return yRange(d.x)
    }).interpolate('linear');

    svg.append('defs').append('clipPath').attr('id', 'clip').
        append('rect').attr('x', margins.left).
        attr('y', margins.top).
        attr('width', width).
        attr('height', height);
    var line = svg.append('g').attr('clip-path', 'url(#clip)').
        append('path').attr('stroke', 'blue').attr('fill', 'none');
    svg.append('text').attr('class', 'edit-text').
        attr('transform', 'translate(' + margins.left + ',' + (height + 20) + ')').
        attr('width', width - margins.left);

    var newUserTextWidth = 150;
    svg.append('text').
        attr('class', 'new-use-text').
        attr('fill', 'green').
        attr('transform', 'translate(' + (width - margins.right - newUserTextWidth) + ',' + (height + 20) + ')').
        attr('width', newUserTextWidth);

    var samplingTime = 2000;
    var maxNumberOfDataPoints = 20;

    function update(updates) {
        if (updates.length > 0) {
            xRange.domain(d3.extent(updates, function (d) {
                return d.x;
            }));
            yRange.domain([d3.min(updates, function (d) {
                return d.y;
            }), d3.max(updates, function (d) {
                return d.y
            })]);
        }
        if (updates.length < maxNumberOfDataPoints) {
            line.transition().ease('linear').attr('d', lineFunc(updates));
            svg.selectAll('g.x.axis').transition().ease('linear').call(xAxis);
        } else {
            var xTranslation = xRange(updates[0].x - updates[1].x);
            line
                .attr('d', lineFunc(updates))
                .transition()
                .duration(samplingTime - 20)
                .ease('linear')
                .attr('transform', 'translate(' + xTranslation + ',0)');
            svg
                .selectAll('g.x.axis')
                .transition()
                .duration(samplingTime - 20)
                .ease('linear')
                .call(xAxis);
        }
        svg
            .selectAll('g.x.axis')
            .transition()
            .call(yAxis);
    }
    var textUpdateTransitionDuration = 550;
    var updateNewUser = function (newUser) {
        var text = svg.selectAll('text.new-user-text').data(newUser);
        text
            .transition()
            .style('fill-opacity', 1e-6)
            .transition()
            .duration(textUpdateTransitionDuration)
            .style('fill-opacity', 1)
            .text(function (d) {
                return d;
            })
    }
    var updateEditText = function (latestEdit) {
        var text = svg.selectAll('text.edit-text').data(latestEdit);
        text
            .transition()
            .style('fill-opacity', 1e-6)
            .transition()
            .duration(textUpdateTransitionDuration)
            .style('fill-opacity', 1)
            .text(function (d) {
                return d;
            });
    }
    var ws = new window.WebSocket('ws://wiki-update-sockets.herokuapp.com/');
    var openStream = fromEvent(ws, 'open');
    var closeStream = fromEvent(ws, 'close');
    var messageStream = fromEvent(ws, 'message').delaySubscription(openStream).takeUntil(closeStream);
    openStream.subscribe(function () {
        console.log('Connection Opened.');
    });
    closeStream.subscribe(function () {
        console.log('Connection is closed...');
    });
    var updateStream = messageStream.map(function (event) {
        var dataString = event.data;
        return JSON.parse(dataString);
    });
    var newUserStream = updateStream.filter(function (update) {
        return update.type === 'newuser';
    });
    newUserStream.subscribe(function () {
        var format = d3.time.format('%X');
        updateNewUser(['New user at: ' + format(new Date())]);
    });
    var editStream = updateStream.filter(function (update) {
        return update.type === 'unspecified';
    });
    editStream.subscribe(function (results) {
        updateEditText(['Last edit: ' + results.content]);
    });
    var updateCount = updateStream.scan(function (value) {
        return ++value;
    }, 0);
    var sampledUpdates = updateCount.sample(samplingTime);
    var totalUpdatesBeforeLastSample = 0;
    sampledUpdates.subscribe(function (value) {
        updatesOverTime.push({
            x: new Date(),
            y: (value - totalUpdatesBeforeLastSample) / (samplingTime - 1000)
        });
        if (updatesOverTime.lenght > maxNumberOfDataPoints) updatesOverTime.shift();
        totalUpdatesBeforeLastSample = value;
        update(updatesOverTime);
    });
})(window, window.d3, window.Rx);