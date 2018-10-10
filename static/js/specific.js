var myMap;
var geoJson;
var data;
var wordCountData;

function getWordCount(category,start,end){

    $.get("/get_words_count?start="+start+"&end="+end+"&category="+category,function(data){

        wordCountData = data;
        createTextChart(data);
        createImageChart(data);
        createPlaceChart(data);
    })
}

function getUsersDisplacement(start,end){
      $.get("/displacement?start="+start+"&end="+end,function(data){

        displacementData = data;
        console.log(data);
        createDisplacementChart(data)
    })
}

var chartColor = {
    "mobility": '#00838F',
    "dwelling": '#74c476',
    "food": '#fe9929',
    "leisure": '#f768a1'
};

function createDisplacementChart(data){

    var category  = $("#map").data("category")

    if(category!="mobility"){
        return
    }

    var x = [];
    var y = [];
    for(k in data){
        x.push(k);
        y.push(data[k]);
    }

    Highcharts.chart('displacement', {
        chart: {
            type: 'bar',
            height: '600px'

        },
        title: {
            text: 'DISPLACEMENT',
            style: {
                fontSize: '14px'
            }
        },
        xAxis: {
            categories: x,
            title: {
                text: 'Displacement (km)'
            }
        },
        yAxis: {
            // min: 0,
            type: 'logarithmic',
            title: {
                text: 'Frequency',
                align: 'high'
            },
            labels: {
                overflow: 'justify'
            }
        },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: true
                }
            }
        },
        credits: {
            enabled: false
        },
        series: [{
            name: 'Displacement',
            data: y,
            color:chartColor[category]
        }]
    });
}


function createTextChart(data,area){

    var chartData = _.chain(data);

    console.log(chartData);

    chartData = chartData.filter(function(d){
        return d.type === "text"
    });

    console.log(chartData);

    if(area){
        console.log(area);
        chartData = chartData.filter(function(d){
            return d.area_name === area
        })
    }

    chartData = chartData.groupBy("term")
    .map(function(value, key) {
        return [key, _.reduce(value, function(result, currentObject) {
            return {
                count: result.count + currentObject.count
            }
        }, {
            count: 0
        })];
    })
    .sortBy(function(d){
        return -d[1].count
    })
    .value();

    chartData = chartData.slice(0,10);

    var x = [];
    var y = [];

    for(var i=0;i<chartData.length;i++){
        x.push(chartData[i][0]);
        y.push(chartData[i][1].count)
    }

    var category  = $("#map").data("category");

    Highcharts.chart('text_chart', {
        chart: {
            type: 'bar'
        },
        title: {
            text: 'TOP 10 FREQUENT TEXT TERMS',
            style: {
                fontSize: '14px'
            }
        },
        xAxis: {
            categories: x,
            title: {
                text: null
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: null
            },
            labels: {
                overflow: 'justify'
            }
        },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: true
                }
            }
        },
        credits: {
            enabled: false
        },
        series: [{
            name: 'Frequency',
            data: y,
            color:chartColor[category]
        }]
    });
}

function createImageChart(data,area){

    var chartData = _.chain(data);

    chartData = chartData.filter(function(d){
        return d.type === "image"
    });

    if(area){
        console.log(area);
        chartData = chartData.filter(function(d){
            return d.area_name === area
        })
    }

    chartData = chartData.groupBy("term")
    .map(function(value, key) {
        return [key, _.reduce(value, function(result, currentObject) {
            return {
                count: result.count + currentObject.count
            }
        }, {
            count: 0
        })];
    })
    .sortBy(function(d){
        return -d[1].count
    })
    .value();

    chartData = chartData.slice(0,10);

    var x = [];
    var y = [];

    for(var i=0;i<chartData.length;i++){
        x.push(chartData[i][0]);
        y.push(chartData[i][1].count)
    }

    var category  = $("#map").data("category");

    Highcharts.chart('image_chart', {
        chart: {
            type: 'bar'
        },
        title: {
            text: 'TOP 10 FREQUENT IMAGE TERMS',
            style: {
                fontSize: '14px'
            }
        },
        xAxis: {
            categories: x,
            title: {
                text: null
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: null
            },
            labels: {
                overflow: 'justify'
            }
        },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: true
                }
            }
        },
        credits: {
            enabled: false
        },
        series: [{
            name: 'Frequency',
            data: y,
            color:chartColor[category]
        }]
    });
}

function createPlaceChart(data,area){

    var chartData = _.chain(data);

    chartData = chartData.filter(function(d){
        return d.type === "place"
    });

    if(area){
        console.log(area);
        chartData = chartData.filter(function(d){
            return d.area_name === area
        })
    }

    chartData = chartData.groupBy("term")
    .map(function(value, key) {
        return [key, _.reduce(value, function(result, currentObject) {
            return {
                count: result.count + currentObject.count
            }
        }, {
            count: 0
        })];
    })
    .sortBy(function(d){
        return -d[1].count
    })
    .value();

    chartData = chartData.slice(0,10);

    var x = [];
    var y = [];

    for(var i=0;i<chartData.length;i++){
        x.push(chartData[i][0]);
        y.push(chartData[i][1].count)
    }

    var category  = $("#map").data("category");

    Highcharts.chart('place_chart', {
        chart: {
            type: 'bar'
        },
        title: {
            text: 'TOP 10 FREQUENT PLACE TERMS',
            style: {
                fontSize: '14px'
            }
        },
        xAxis: {
            categories: x,
            title: {
                text: null
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: null
            },
            labels: {
                overflow: 'justify'
            }
        },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: true
                }
            }
        },
        credits: {
            enabled: false
        },
        series: [{
            name: 'Frequency',
            data: y,
            color:chartColor[category]
        }]
    });
}

function create_map(){

    var center = $("#map").data("centroid");

    var temp = center[0];
    center[0] = center[1];
    center[1] = temp;

    myMap = L.map('map').setView(center, 11);

    var OpenStreetMap_Mapnik = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
	    maxZoom: 18,
	    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    }).addTo(myMap)

}

function show_post_count(category, start,end){

    $('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));


    $.get("/get_geo_post_count?start="+start+"&end="+end+"&category="+category,function(res){
        console.log(res)
        data=res;
         if(geoJson) {
             geoJson.clearLayers();
             geoJson.addData(data);
             geoJson.setStyle(style)
         } else {
            geoJson = L.geoJson(data,{style:style,onEachFeature:onEachFeature}).addTo(myMap)
         }

    });

     getWordCount(category,start,end);
     getUsersDisplacement(start,end);

}

function init(){

    create_map();

    var category = $("#map").data("category");
    var start = moment('2018-01-01');
    var end =  moment();

    $('#reportrange').daterangepicker({
        startDate: start,
        endDate: end,
        ranges: {
            'Today': [moment(), moment()],
            'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            'Last 7 Days': [moment().subtract(7, 'days'),  moment()],
            'Last 30 Days': [moment().subtract(29, 'days'), moment()],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        }
    }, show_post_count.bind(null,category));

    show_post_count(category,start, end);
}

init();

// Map functions
// Style functions
function getColor(d,category) {

    var colorsMap = {
        "dwelling": ['#F1F8E9', '#DCEDC8','#C5E1A5','#AED581','#9CCC65','#8BC34A','#7CB342','#689F38','#558B2F','#33691E'],
        "food": ['#FFF3E0', '#FFE0B2','#FFCC80','#FFB74D','#FFA726','#FF9800','#FB8C00','#F57C00','#EF6C00','#E65100'],
        "leisure": ['#FCE4EC', '#F8BBD0','#F48FB1','#F06292','#EC407A','#E91E63','#D81B60','#C2185B','#AD1457','#880E4F'],
        "mobility": ['#E0F7FA', '#B2EBF2','#80DEEA','#4DD0E1','#26C6DA','#00BCD4','#00ACC1','#0097A7','#00838F','#006064']
    };

    var colors = colorsMap[category];

    return d >= 1 ? colors[9] :
           d > 0.9 ? colors[8] :
           d > 0.8 ? colors[7] :
           d > 0.7 ? colors[6] :
           d > 0.6 ? colors[5] :
           d > 0.5 ? colors[4] :
           d > 0.4 ? colors[3] :
           d > 0.3 ? colors[2] :
           d > 0.2 ? colors[1] :
                     colors[0];
}

function style(feature) {
    var count = feature.count || 0;
    var category = $("#map").data("category");
    return {
        fillColor: getColor(count, category),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

// Interaction functions

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: 'white',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}

function resetHighlight(e) {
    geoJson.resetStyle(e.target);
}

function zoomToFeature(e) {
    myMap.fitBounds(e.target.getBounds());
    var name = e.target.feature.properties.name;
    var category = $("#map").data("category").replace(/\b\w/g, l => l.toLowerCase())

    $("#area").text(name);

    var selected = data.features.find(function(a){
        return a.properties.name === name
    });
    createTextChart(wordCountData,selected.properties.name);
    createImageChart(wordCountData,selected.properties.name);
    createPlaceChart(wordCountData,selected.properties.name);
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}
