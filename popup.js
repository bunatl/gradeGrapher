chrome.runtime.sendMessage({ type: "popup" }, (response) => {
    document.getElementById("ident").innerHTML = "No data to be shown";
    if (response.graphData !== "") {
        document.getElementById("ident").innerHTML = response.courseIdent;
        document.getElementById("semester").innerHTML = response.semester;
        showGraph(response.graphData);
    }
});


chrome.tabs.executeScript(null, {
    code: "console.log(document.getElementById('src1'));"
});
chrome.tabs.executeScript(null, {
    code: "document.getElementById('src1').setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/d3/5.0.0/d3.min.js');"
});
chrome.tabs.executeScript(null, {
    code: "document.getElementById('src2').setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/nvd3/1.8.1/nv.d3.min.js');"
});

/*
* parse recieved object into data and given semester
* data are text and has to convert into an array for d3
* in the function print is called
* print containt d3 functions to print final graph
*/
const showGraph = (data) => {

    data = data.replace(/[\r\n]+/gm, "");
    data = data.replace(/\t/g, '');
    data = data.replace(/ /g, '');

    var tmp = data.split("values:[{");
    var tmp2 = tmp[ 1 ].split("},{");

    var values = [];
    for (var i = 0; i < tmp2.length; i++) {
        var xx = tmp2[ i ].split("'");
        var xxx = xx[ 2 ].split(":");
        if (i == tmp2.length - 1) {
            var tt = xxx[ 1 ].split("}");
            xxx[ 1 ] = tt[ 0 ];
        }

        values.push({
            x: xx[ 1 ],
            y: xxx[ 1 ]
        });
    }

    var final = [];
    final.push({ values });
    print(final);
};

const print = (dt) => {
    var chart = nv.models.discreteBarChart();
    chart.showValues(true);
    chart.valueFormat(d3.format('d'));
    chart.noData('Žádná data k zobrazení');
    chart.margin({ top: 15, right: 10, bottom: 50, left: 40 });

    chart.tooltip.enabled(false);

    chart.xAxis.axisLabel('Hodnocení');

    chart.yAxis.showMaxMin(false);
    chart.yAxis.tickFormat(d3.format('d'));
    chart.yAxis.axisLabelDistance(-20);
    chart.yAxis.axisLabel('Výsledek');

    d3.select('svg')
        .datum(dt)
        .call(chart);

    nv.utils.windowResize(chart.update);

    return chart;
};
