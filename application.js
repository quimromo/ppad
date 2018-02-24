



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

function parseDatabaseData(data){
    
    var countries = {};
    var parsedData = $.csv.toArrays(data, {separator : ";"});
    console.log(parsedData);
    var beginData = 4;

    for( var i = beginData; i < parsedData.length; ++i){
        var countryData = parsedData[i];
        countries[countryData[0]] = CountryData.fromDataArray(countryData);
    }

    return countries;



    // google.charts.load('current', {
    //     'packages':['geochart'],
    //     // Note: you will need to get a mapsApiKey for your project.
    //     // See: https://developers.google.com/chart/interactive/docs/basic_load_libs#load-settings
    //     'mapsApiKey': 'AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY'
    //   });
    //   google.charts.setOnLoadCallback(drawRegionsMap);
    
    //     var displayedData = [['Country', 'Agriculture Male 2016', 'Agriculture Female 2016' ]];
    //     for( var country in countries ){
    //         displayedData.push( [country, countries[country].agriculture.male["2016"],
    //         countries[country].agriculture.female["2016"]
    //     ] );
    //     }


    //   function drawRegionsMap() {
    //     var data = google.visualization.arrayToDataTable(displayedData);
      
    //     var options = {};
    
    //     var chart = new google.visualization.GeoChart(document.getElementById('regions_div'));
    
    //     chart.draw(data, options);
    //   }
}
//https://experiments.withgoogle.com/chrome/globe

function parseGeoJsonData(data){
    var countryGeometry = {};
    var geojson = JSON.parse(data);
    for(var feature of geojson.features){
        countryGeometry[feature.properties.sovereignt] = feature.geometry;
    }
    return countryGeometry;
}

var promiseDatabase = new Promise(function(resolve){
    getFile("2.3_Employment_by_sector.txt", function(data){
        resolve(parseDatabaseData(data));
    }.bind(this) );
}.bind(this));

var promiseGeometry = new Promise(function(resolve){
    getFile("geojson_data.json", function(data){
        resolve(parseGeoJsonData(data));
    }.bind(this));
}.bind(this));

var countryData = {};
var all = Promise.all([promiseDatabase, promiseGeometry]).then(function([database, geometry]){
    var numEntriesInDB = Object.keys(database).length;
    var numEntriesInGeometry = Object.keys(geometry).length;
    console.log( "Num entries DB: " + numEntriesInDB);
    console.log( "Num entries Geom: " + numEntriesInGeometry);
    for( var geo in geometry){
        if( database[geo]){
            countryData[geo] = { "data" : database[geo], "geometry" : geometry[geo], "points" : [] };
        }
        else{
            var geoLC = geo.toLowerCase();
            var geoLCParts = geoLC.split(" ");
            var found = false;
            for(var name in database){
                var nameLC = name.toLowerCase();
                if(nameLC.includes(geoLC) || geoLC.includes(nameLC) ){
                    found = true;
                    countryData[name] = {"data" : database[name], "geometry" : geometry[geo], "points" : [] };
                    break;
                }
                // var allParts = true;
                // for( var geoPart of geoLCParts){
                //     if(!name.includes(geoPart)){
                //         allParts = false;
                //         break;
                //     }
                // }
                // if(!allParts){
                //     allParts = true;
                //     var nameParts = name.split(" ");
                //     for( var part of nameParts){
                //         if(!geoLC.includes(part)){
                //             allParts = false;
                //             break;
                //         }
                //     }
                // }
                // found = allParts;

            }
            if( !found ){
                console.log( "Not found country: " + geo + " in DB");
            }
        }
    }

    var latitudeSamples = 180;
    var longitudeSamples = 360;
    var minLat = -90.0;
    var maxLat = 90.0;
    var minLong = 0.0;
    var maxLong = 360.0;

    var points = [];
    for( var i = 0; i <= latitudeSamples; ++i){
        var lat = minLat + (maxLat - minLat) * (i/latitudeSamples);
        for( var j = 0; j < longitudeSamples; ++j){
            var long = minLong + (maxLong - minLong) * (j/longitudeSamples);
            points.push( [long, lat] );
        }
    }

    for(var p of points){
        for( var country in countryData){
            if( gju.pointInPolygon({"type":"Point","coordinates":p}, countryData[country].geometry ) ){
                countryData[country].points.push(p);
                break;
            }
        }
    }
    console.log(countryData);
    //console.log(points);

});
