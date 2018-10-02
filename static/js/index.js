var myMap;
var geoJson;
var data;
var info = L.control();

function createChart(features){

    var dwelling = 0;
    var food= 0;
    var leisure = 0;
    var mobility = 0;

    features.forEach(function(d){
        dwelling += d["dwelling"] || 0;
        food += d["food"] || 0;
        leisure += d["leisure"] || 0;
        mobility += d["mobility"] || 0;
    });

    var chartData = [
        ['DWELLING', dwelling],
        ['FOOD', food],
        ['LEISURE', leisure],
        ['MOBILITY', mobility]
    ];

    var dataSum = 0;
    for (var i=0;i<4;i++) {
        dataSum += chartData[i][1]
    }

    Highcharts.chart('chart', {
        chart: {
            type: 'bar'
        },
        title: {
            text: null
        },
        xAxis: {
            categories: ['DWELLING', 'FOOD', 'LEISURE', 'MOBILITY'],
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
        tooltip: {
            formatter:function() {
                var percentage = (this.y / dataSum) * 100;
                return '<b>' + Highcharts.numberFormat(percentage) +'%</b>';
            }
            // pointFormat: '<b>{point.y:.1f}%</b>'
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
            type: 'bar',
            name: 'Count of related social media posts',
            innerSize: '50%',
            data: chartData,
            color:'#ff7043'
        }]
    });
}

function create_map(){

    var center = $("#map").data("centroid");

    var temp = center[0];
    center[0] = center[1];
    center[1] = temp;

    // myMap = L.map('map').setView(center, 11);

    myMap = L.map('map', {
        // zoom: 11,
        // center: center,
        // timeDimension: true,
        // timeDimensionOptions: {
        //     timeInterval: "2018-06-01/2018-08-01",
        //     period: "PT1H"
        // },
        // timeDimensionControl: true
    }).setView(center, 11);

    var OpenStreetMap_Mapnik = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
	    maxZoom: 18,
	    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
    }).addTo(myMap)

    // Create and add a TimeDimension Layer to the map
    // var timeDimensionLayer = L.timeDimension().addTo(myMap);
}

function show_post_count(start,end){

    $('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));


    $.get("/get_geo_post_count?start="+start+"&end="+end,function(res){
        data=res;
         if(geoJson) {
             geoJson.clearLayers();
             geoJson.addData(data);
             geoJson.setStyle(style)
         } else {
            geoJson = L.geoJson(data,{style:style,onEachFeature:onEachFeature}).addTo(myMap)
         }

        createChart(data.features)

    })

}

function init(){

    create_map();

    console.log(myMap.timeDimension);

    category = $("#map").data("category");
    var start = moment('2018-06-01');
    var end =  moment();

    $('#reportrange').daterangepicker({
        startDate: start,
        endDate: end,
        ranges: {
            'Today': [moment(), moment()],
            'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            'Last 7 days': [moment().subtract(7, 'days'),  moment()],
            'Last 30 days': [moment().subtract(29, 'days'), moment()],
            'This month': [moment().startOf('month'), moment().endOf('month')],
            'Last month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        }
    }, show_post_count);

    show_post_count(start, end);

    var socket = io.connect();
    socket.on('connect', function() {
        console.log("Connected!");
    });

    socket.on('error',function(e){
        console.log(e)
    });
}


init();


// Map functions
// Style functions
function getColor(d) {

    var colors = [ "#FBE9E7", "#FFCCBC", "#FFAB91", "#FF8A65",  "#FF7043", "#FF5722", "#F4511E", "#E64A19", "#D84315", "#BF360C" ];

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
    var name = e.target.feature.properties.name;
    $("#area").text(name);

    var selected = data.features.find(function(a){
        return a.properties.name === name
    });
    createChart([selected])
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}