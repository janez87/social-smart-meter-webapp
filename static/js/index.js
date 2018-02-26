
$.get("/area?name=amsterdam",function(data){

    var myMap = L.map('map').setView([52.3663589, 4.8680607], 11);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiamFuZXo4NyIsImEiOiJjaW9rNnN6dW4wMDlqdW5reDVnMmZtMW85In0.zA4QBENdLvkqK69ELa74_A', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoiamFuZXo4NyIsImEiOiJjaW9rNnN6dW4wMDlqdW5reDVnMmZtMW85In0.zA4QBENdLvkqK69ELa74_A'
    }).addTo(myMap);
    L.geoJson(data).addTo(myMap)


})

function get_tweet_count(start,end){

     $('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
     $.get("get_tweet_count?start="+start+"&end="+end,function(data){

        console.log(data)

     })

}
function initDate(){

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
    }, get_tweet_count);

    get_tweet_count(start, end);
}


initDate()