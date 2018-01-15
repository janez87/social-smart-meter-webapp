
$.get("/area?name=amsterdam",function(data){

    console.log(data)
    
    var mymap = L.map('map').setView([52.3663589, 4.8680607], 11);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiamFuZXo4NyIsImEiOiJjaW9rNnN6dW4wMDlqdW5reDVnMmZtMW85In0.zA4QBENdLvkqK69ELa74_A', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoiamFuZXo4NyIsImEiOiJjaW9rNnN6dW4wMDlqdW5reDVnMmZtMW85In0.zA4QBENdLvkqK69ELa74_A'
    }).addTo(mymap);
    L.geoJson(data).addTo(mymap)
})
