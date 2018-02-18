
// https://experiments.withgoogle.com/chrome/globe
// https://github.com/evanplaice/jquery-csv

function getFile(url, onLoadCB){
    var xhr = new XMLHttpRequest();

    // Where do we get the data?
    xhr.open( 'GET', url, true );
    
    // What do we do when we have it?
    xhr.onreadystatechange = function() {
    
        // If we've received the data
        if ( xhr.readyState === 4 && xhr.status === 200 ) {    
            onLoadCB(xhr.responseText);
        }
    
    }.bind(this);
    
    // Begin request
    xhr.send( null );
}
