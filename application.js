



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

    var maxArea = 0;
    for( var countryName in countryData ){
        var country = countryData[countryName];
        country.area = turf.area(country.geometry);
        maxArea = Math.max(maxArea, country.area);
    }
    var agricultureMen2016 = [];
    var agricultureWomen2016 = [];

    var datas = new CountryData();
    var sectors = ["agriculture", "industry", "services"];
    var genres = ["male", "female"];
    var colors = {
        // "agriculture":{
        //     "male": new THREE.Color(0.0, 0.8, 0.0),
        //     "female": new THREE.Color(0.5, 1.0, 0.5)
        // },
        // "industry":{
        //     "male": new THREE.Color(0.8, 0.0, 0.0),
        //     "female": new THREE.Color(1.0, 0.5, 0.5)
        // },
        // "services":{
        //     "male": new THREE.Color(0.1, 0.4, 1.0),
        //     "female": new THREE.Color(0.3, 0.9, 1.0)
        // },
        "agriculture":{
            "male": new THREE.Color(0.05, 0.9, 0.3),
            "female": new THREE.Color(0.1, 1.0, 0.5)
        },
        "industry":{
            "male": new THREE.Color(0.75, 0.6, 0.15),
            "female": new THREE.Color(1.0, 0.8, 0.3)
        },
        "services":{
            "male": new THREE.Color(0.7, 0.1, 0.1),
            "female": new THREE.Color(1.0, 0.15, 0.15)

        },
    }
    console.log(countryData);

    for( var countryName in countryData ){
        var country = countryData[countryName];

        // var bbox = turf.bbox(country.geometry);
        // var numPoints = Math.max( Math.round( 500 * country.area / maxArea ), 6 );
        // var pointsPerSectorGenre = {};
        // for( var sector of sectors ){
        //     pointsPerSectorGenre[sector] = {};
        //     for (var genre of genres ){
        //         pointsPerSectorGenre[sector][genre] = Math.max( Math.round(numPoints * 0.5 * country.data[sector][genre]["2016"] * 0.01), 1);
        //         for(var i = 0; i < pointsPerSectorGenre[sector][genre];){
        //             var point = turf.randomPosition(bbox);
        //             var pf = turf.pointsWithinPolygon( turf.points([point]), country.geometry );
        //             if( pf.features.length > 0 ){
        //                 country.points.push(point);
        //                 var dataIdx = i % 6;
                        
        //                 if( datas[sector][genre]["2016"] == 0 ){
        //                     datas[sector][genre]["2016"] = [];
        //                 }
        //                 datas[sector][genre]["2016"].push(point[1]);
        //                 datas[sector][genre]["2016"].push(point[0]);
        //                 datas[sector][genre]["2016"].push( country.data[sector][genre]["2016"] * 0.0002 );
        //                 ++i;
        //             }
        //         }
        //     }
        // }

        var center = null; 
        if(country.geometry.type == "MultiPolygon"){
            var biggestArea = 0;
            var biggestPoly = null;
            for( var polyCoords of country.geometry.coordinates){
                var poly = turf.polygon(polyCoords);
                var area = turf.area(poly);
                if( area > biggestArea){
                    biggestArea = area;
                    biggestPoly = poly;
                }
            }
            center = turf.pointOnFeature(biggestPoly);
        }
        else{
            center = turf.pointOnFeature(country.geometry);
        }


        var delta = 0.3 / Math.abs(Math.cos(center.geometry.coordinates[1] * Math.PI / 180.0 ));
        var offset = -delta * 5.0 / 2.0;
        for( var sector of sectors ){
            for (var genre of genres ){
                if( datas[sector][genre]["2016"] == 0 ){
                    datas[sector][genre]["2016"] = [];
                }
                datas[sector][genre]["2016"].push(center.geometry.coordinates[1]);
                datas[sector][genre]["2016"].push(center.geometry.coordinates[0] + offset);
                datas[sector][genre]["2016"].push( country.data[sector][genre]["2016"] * 0.005 );
                offset += delta;   
            }
        }




    }

    var container = document.getElementById( "globe-container" );
    // Make the globe
    var globe = new DAT.Globe( container );

    var subgeo = null;
    for( var sector of sectors){
        for( var genre of genres){
            if( subgeo ){
                globe.addDataToSubgeo( datas[sector][genre]["2016"], {format: 'magnitude', name: "agricultureMen2016", colorFunc : function(val, idx){
                    return colors[sector][genre];
                }.bind(this)}, subgeo );
            }
            else{
                subgeo = globe.addData( datas[sector][genre]["2016"], {format: 'magnitude', name: "agricultureMen2016", colorFunc : function(val, idx){
                    return colors[sector][genre];
                }.bind(this)} );
            }

        }
    }

    // Create the geometry
    globe.createPoints();

    // Begin animation
    globe.animate();

});
