(function(){
    'use strict';

    // add your script here
    var map = L.map('map').setView([37.804363, -122.271111], 13);
    var marker1 = L.marker([37.804363, -122.254713]).addTo(map);
    var marker2 = L.marker([37.814363, -122.354753]).addTo(map);
    var circle1 = L.circle([37.799108, -122.261713], {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: 500
    }).addTo(map);
    var circle2 = L.circle([37.784250, -122.417731], {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: 500
    }).addTo(map);

    marker1.bindPopup("this is the lake i grew up going to!").openPopup();
    marker2.bindPopup("the bridge between my two homes!").openPopup();

    circle1.bindPopup("my dad's <b>HOUSE</b>");
    circle2.bindPopup("my mom's <b>HOUSE</b>");


    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    
}());