var myMap;
var geoJson;
var data;
var tweetsId = []

function handleTweetNotification(t){

    var MAX = 20

    if(tweetsId.length === MAX){
        var deleteId = tweetsId.shift()
        var $delete  = $("#"+deleteId)
        $delete.remove()
    }


    $container = $("#tweets")
    var $tweet = $("<div></div>")
    $tweet.addClass("tweet_container")
    $tweet.attr("id",t.id)
    $tweet.prependTo($container)
    twttr.widgets.createTweet(
    t.id.toString(), $tweet[0],
      {
        dnt:true,
        width:550,
        conversation : 'none',    // or all
        cards        : 'visible',  // or visible
        linkColor    : '#cc0000', // default is blue
        theme        : 'light'    // or dark
      })

     tweetsId.push(t.id)
    twttr.widgets.load()


}

function createTweets(start,end,category){

    $.get("/tweets?start="+start+"&end="+end,function(data){
        $container = $("#tweets")
        data.forEach(function(t){
             var id = t.id
             var $tweet = $("<div></div>")
             $tweet.addClass("tweet_container")
             $tweet.attr("id",id)
             $tweet.appendTo($container)
             twttr.widgets.createTweet(
                id, $tweet[0],
                  {
                    dnt:true,
                    width:550,
                    conversation : 'none',    // or all
                    cards        : 'hidden',  // or visible
                    linkColor    : '#cc0000', // default is blue
                    theme        : 'light'    // or dark
                  })
        })
    })
  }

function createChart(features){

    var mobility = 0
    var dwelling = 0
    var food = 0
    var leisure = 0

    features.forEach(function(d){
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

    Highcharts.chart('chart', {
        credits: {
            enabled: false
        },
        chart: {
            borderColor:"#eaeaea",
            backgroundColor: "#eaeaea",
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
                center: ['50%', '75%'],
            }
        },
        series: [{
            type: 'pie',
            name: 'Percentage',
            innerSize: '50%',
            data: chartData,
            colors:["#fe9929","#6baed6","#f768a1","#74c476"]
        }]
    });


}
function create_map(){

    //myMap = L.map('map').setView([52.3663589, 4.8680607], 11);
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

function show_tweet_count(start,end){


    $('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));


    $.get("/get_geo_tweet_count?start="+start+"&end="+end,function(res){
        data=res
         if(geoJson){
             geoJson.clearLayers()
             geoJson.addData(data)
             geoJson.setStyle(style)
         }else{
            geoJson = L.geoJson(data,{style:style,onEachFeature:onEachFeature}).addTo(myMap)
         }

        createChart(data.features)

    })

}
function init(){

    create_map()

    category = $("#map").data("category")
    var start = moment("2018-01-01")
    var end = moment()

    //var end =  moment().subtract(2, 'month')

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
    }, show_tweet_count);

    show_tweet_count(start, end);
    //createTweets(start,end)

}


init()


// Map functions
// Style functions
function getColor(d) {

    //var colors = ['#ffffff','#f0f0f0','#d9d9d9','#bdbdbd','#969696','#737373','#525252','#252525','#000000']

    var colors = ["#fcfbfd", "#efedf5", "#dadaeb",  "#bcbddc", "#9e9ac8", "#807dba", "#6a51a3", "#54278f", "#3f007d" ]
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

    var selected = data.features.find(function(a){
        return a.properties.name === name
    })
    createChart([selected])
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}