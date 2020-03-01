//once data stored here, they are ready to be requested from the popup
var data;

chrome.runtime.onMessage.addListener( 
    function ( message, sender, sendResponse ) {
        if ( message.popup == "popupRequest" ){
            //set icon back to normal
            chrome.browserAction.setIcon( { path: "/icon/icon32.png" } );
            sendResponse( data );
        }else if( message.clear == "" ){
            //all data before processing new ident are cleared
            data = NaN;
            //therefore no indicator to check popup
            chrome.browserAction.setIcon( { path: "/icon/icon32.png" } );
        } else {
            console.log( "Object recieved from content.js: " + message.graphData );
            //store data in a variable
            data = message;
            //set icons blue cicrle, to let user know graph is ready
            //https://stackoverflow.com/questions/47310292/chrome-extension-dynamically-change-icon-without-clicking
            chrome.browserAction.setIcon( { path: "/icon/icon32Dot.png" } );
        }
})

//action happens when extention button is clicled
// chrome.browserAction.onClicked.addListener( function ( tab ) {
//     chrome.tabs.create({url: "popup.html"});
// })
