var myMap;
var geoJson;

function createChart(data){

    var mobility = 0
    var dwelling = 0
    var food = 0
    var leisure = 0

    data.features.forEach(function(d){
        mobility+= d["MOBILITY"] || 0
        dwelling+= d["DWELLING"] || 0
        leisure+= d["LEISURE"] || 0
        food+= d["FOOD"] || 0
    })

    var chartData = [
        ["Food",food],
        ["Mobility",mobility],
        ["Leisure",leisure],
        ["Dwelling",dwelling]
    ]
    console.log(chartData)



    Highcharts.chart('chart', {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: 0,
            plotShadow: false
        },
        title: {
            text: 'Distribution of Energy Consumption Types',
            align: 'center',
            verticalAlign: 'middle',
            y: 110
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
            pie: {
                dataLabels: {
                    enabled: true,
                    distance: -50,
                    style: {
                        fontWeight: 'bold',
                        color: 'white'
                    }
                },
                startAngle: -90,
                endAngle: 90,
                center: ['50%', '75%']
            }
        },
        series: [{
            type: 'pie',
            name: 'Energy Consumption Types',
            innerSize: '50%',
            data: chartData
        }]
    });


}
function create_map(){

    myMap = L.map('map').setView([52.3663589, 4.8680607], 11);

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiamFuZXo4NyIsImEiOiJjaW9rNnN6dW4wMDlqdW5reDVnMmZtMW85In0.zA4QBENdLvkqK69ELa74_A', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoiamFuZXo4NyIsImEiOiJjaW9rNnN6dW4wMDlqdW5reDVnMmZtMW85In0.zA4QBENdLvkqK69ELa74_A'
    }).addTo(myMap);

}

function show_tweet_count(start,end){


    $('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));


    $.get("/get_geo_tweet_count?start="+start+"&end="+end,function(res){
        console.log(res)
        data=res
         if(geoJson){
             geoJson.clearLayers()
             geoJson.addData(data)
             geoJson.setStyle(style)
         }else{
            geoJson = L.geoJson(data,{style:style,onEachFeature:onEachFeature}).addTo(myMap)
         }

        createChart(data)

    })

}
function init(){

    create_map()

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
    }, show_tweet_count);

    show_tweet_count(start, end);
}


init()

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
    $("#area").text(name+" - Overall Energy Consumption")
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}