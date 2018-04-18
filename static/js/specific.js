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

function getUsersDisplacement(start,end){
      $.get("/displacement?start="+start+"&end="+end,function(data){

        displacementData = data
        console.log(data)
        createDisplacementChart(data)
    })
}

var chartColor = {
    "mobility": '#6baed6',
    "dwelling": '#74c476',
    "food": '#fe9929',
    "leisure": '#f768a1'
}

function createDisplacementChart(data){

    var category  = $("#map").data("category")

    if(category!="mobility"){
        return
    }

    var x = []
    var y = []
    for(k in data){
        x.push(k)
        y.push(data[k])
    }

    Highcharts.chart('displacement', {
        chart: {
            type: 'bar',
            backgroundColor: "#eaeaea",

        },
        title: {
            text: 'Users Displacement'
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
            name: 'Displacement',
            data: y,
            color:chartColor[category]
        }]
    });
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




    var category  = $("#map").data("category")

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
            data: y,
            color:chartColor[category]
        }]
    });
}


function create_map(){

    var center = $("#map").data("centroid")

    var temp = center[0]
    center[0] = center[1]
    center[1] = temp

    myMap = L.map('map').setView(center, 11);

    var OpenStreetMap_Mapnik = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
	    maxZoom: 18,
	    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    }).addTo(myMap)

    //L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiamFuZXo4NyIsImEiOiJjaW9rNnN6dW4wMDlqdW5reDVnMmZtMW85In0.zA4QBENdLvkqK69ELa74_A', {
    //    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
     //   maxZoom: 18,
     //   id: 'mapbox.streets',
    //    accessToken: 'pk.eyJ1IjoiamFuZXo4NyIsImEiOiJjaW9rNnN6dW4wMDlqdW5reDVnMmZtMW85In0.zA4QBENdLvkqK69ELa74_A'
    //}).addTo(myMap);

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
     getUsersDisplacement(start,end);


}
function init(){

    create_map()

    var category = $("#map").data("category")
    var start = moment().subtract(29, 'days');
    var end =  moment()

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
    }, show_tweet_count.bind(null,category));

    show_tweet_count(category,start, end);
}


init()

// Map functions
// Style functions
function getColor(d,category) {

    var colorsMap = {
        "mobility": ['#f7fbff','#deebf7','#c6dbef','#9ecae1','#6baed6','#4292c6','#2171b5','#08519c','#08306b'],
        "dwelling": ['#f7fcf5','#e5f5e0','#c7e9c0','#a1d99b','#74c476','#41ab5d','#238b45','#006d2c','#00441b'],
        "food": ['#ffffe5','#fff7bc','#fee391','#fec44f','#fe9929','#ec7014','#cc4c02','#993404','#662506'],
        "leisure": ['#fff7f3','#fde0dd','#fcc5c0','#fa9fb5','#f768a1','#dd3497','#ae017e','#7a0177','#49006a']
    }

    var colors = colorsMap[category]

    return d >= 1 ? colors[8] :
           d > 0.9  ? colors[7] :
           d > 0.8  ? colors[6] :
           d > 0.7  ? colors[5] :
           d > 0.6   ? colors[4] :
           d > 0.5   ? colors[3] :
           d > 0.4  ? colors[2] :
           d > 0.3  ? colors[1] :
                      colors[0];
}

function style(feature) {
    var count = feature.count || 0
    var category = $("#map").data("category")
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
    var name = e.target.feature.properties.name
    var category = $("#map").data("category").replace(/\b\w/g, l => l.toUpperCase())
    $("#area").text(name+" - "+ category+" Energy Consumption")

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