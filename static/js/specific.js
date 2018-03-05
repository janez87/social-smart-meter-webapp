var myMap;
var geoJson;
var data;
var wordCountData;

function getWordCount(category,start,end){

    $.get("/get_words_count?start="+start+"&end="+end+"&category="+category,function(data){

        wordCountData = data
        createChart(data)
    })
}

function createChart(data,area){

    var chartData = _.chain(data)

    if(area){
        console.log(area)
        chartData = chartData.filter(function(d){
            return d.area_name === area
        })
    }

    chartData = chartData.groupBy("token")
    .map(function(value, key) {
        return [key, _.reduce(value, function(result, currentObject) {
            return {
                count: result.count + currentObject.count,
            }
        }, {
            count: 0,
        })];
    })
    .sortBy(function(d){
        return -d[1].count
    })
    .value();

    chartData = chartData.slice(0,10)

    var x = []
    var y = []

    for(var i=0;i<chartData.length;i++){
        x.push(chartData[i][0])
        y.push(chartData[i][1].count)
    }



    Highcharts.chart('chart', {
        chart: {
            type: 'bar',
            backgroundColor: "#eaeaea",

        },
        title: {
            text: 'Top 10 Frequent Terms'
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
            name: 'Frequency',
            data: y
        }]
    });
}


function create_map(){

    var center = $("#map").data("centroid")

    var temp = center[0]
    center[0] = center[1]
    center[1] = temp

    myMap = L.map('map').setView(center, 11);

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiamFuZXo4NyIsImEiOiJjaW9rNnN6dW4wMDlqdW5reDVnMmZtMW85In0.zA4QBENdLvkqK69ELa74_A', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoiamFuZXo4NyIsImEiOiJjaW9rNnN6dW4wMDlqdW5reDVnMmZtMW85In0.zA4QBENdLvkqK69ELa74_A'
    }).addTo(myMap);

}

function show_tweet_count(category, start,end){

    $('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));


    $.get("/get_geo_tweet_count?start="+start+"&end="+end+"&category="+category,function(res){
        console.log(res)
        data=res
         if(geoJson){
             geoJson.clearLayers()
             geoJson.addData(data)
             geoJson.setStyle(style)
         }else{
            geoJson = L.geoJson(data,{style:style,onEachFeature:onEachFeature}).addTo(myMap)
         }

    })

     getWordCount(category,start,end);

}
function init(){

    create_map()

    category = $("#map").data("category")
    var start = moment().subtract(29, 'days');
    var end =  moment()

    $('#reportrange').daterangepicker({
        startDate: start,
        endDate: end,
        ranges: {
            'Today': [moment(), moment()],
            'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            'Last 7 Days': [moment().subtract(11, 'days'),  moment().subtract(5, 'days')],
            'Last 30 Days': [moment().subtract(29, 'days'), moment()],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        }
    }, show_tweet_count.bind(null,category));

    show_tweet_count(category,start, end);
}


init()

// Map functions
// Style functions


function getColor(d) {
    return d > 500 ? '#800026' :
           d > 200  ? '#BD0026' :
           d > 100  ? '#E31A1C' :
           d > 50  ? '#FC4E2A' :
           d > 20   ? '#FD8D3C' :
           d > 10   ? '#FEB24C' :
           d > 5   ? '#FED976' :
                      '#FFEDA0';
}

function style(feature) {
    var count = feature.count || 0
    return {
        fillColor: getColor(count),
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
    var name = e.target.feature.properties.name
    $("#area").text(name+" - "+$("#map").data("category")+" Energy Consumption")

    var selected = data.features.find(function(a){
        return a.properties.name === name
    })
    createChart(wordCountData,selected.properties.name)
}
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}