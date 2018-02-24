



//getFile("2.3_Employment_by_sector.txt", onDataLoaded );
//getFile("geojson_data.json", onGeoJsonLoaded);


function SectorData(){
    this.male = { "2000" : 0, "2016" : 0  };
    this.female = { "2000" : 0, "2016" : 0  };
}

function CountryData(){
    this.agriculture = new SectorData();
    this.industry = new SectorData();
    this.services = new SectorData();
}

CountryData.fromDataArray = function(dataArray){
    var newObj = new CountryData();
    var idx = 1;
    loadFromArray(newObj, idx, dataArray);
    return newObj;
}

function loadFromArray(obj, firstIdx, dataArray){
    var idx = firstIdx;
    for(var key in obj){
        if( obj[key] === Object(obj[key]) ){
            idx = loadFromArray(obj[key], idx, dataArray);
        }
        else{
            obj[key] = Number(dataArray[idx]);
            if( isNaN( obj[key] ) ){
                obj[key] = 0.0;
            }
            idx++;
        }
    }
    return idx;
}

var countries = {};
function onDataLoaded(data){

    var parsedData = $.csv.toArrays(data, {separator : ";"});
    console.log(parsedData);
    var beginData = 4;

    for( var i = beginData; i < parsedData.length; ++i){
        var countryData = parsedData[i];
        countries[countryData[0]] = CountryData.fromDataArray(countryData);
    }

    console.log(countries);



    google.charts.load('current', {
        'packages':['geochart'],
        // Note: you will need to get a mapsApiKey for your project.
        // See: https://developers.google.com/chart/interactive/docs/basic_load_libs#load-settings
        'mapsApiKey': 'AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY'
      });
      google.charts.setOnLoadCallback(drawRegionsMap);
    
        var displayedData = [['Country', 'Agriculture Male 2016', 'Agriculture Female 2016' ]];
        for( var country in countries ){
            displayedData.push( [country, countries[country].agriculture.male["2016"],
            countries[country].agriculture.female["2016"]
        ] );
        }


      function drawRegionsMap() {
        var data = google.visualization.arrayToDataTable(displayedData);
      
        var options = {};
    
        var chart = new google.visualization.GeoChart(document.getElementById('regions_div'));
    
        chart.draw(data, options);
      }
}
//https://experiments.withgoogle.com/chrome/globe
var geojson = {};
var countryGeometry = {};
function onGeoJsonLoaded(data){
    geojson = JSON.parse(data);
    for(var feature of geojson.features){
        countryGeometry[feature.properties.sovereignt] = feature.geometry;
    }
    console.log(countryGeometry);
}

var promiseDatabase = new Promise(function(resolve){
    getFile("2.3_Employment_by_sector.txt", function(data){
        onDataLoaded(data);
        resolve(countries);
    }.bind(this) );
}.bind(this));

var promiseGeometry = new Promise(function(resolve){
    getFile("geojson_data.json", function(data){
        onGeoJsonLoaded(data);
        resolve(countryGeometry);
    }.bind(this));
}.bind(this));

var all = Promise.all([promiseDatabase, promiseGeometry]).then(function([database, geometry]){
    
});
