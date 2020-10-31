//once data stored here, they are ready to be requested from the popup
var localBackgroundData = {
    semester: "",
    graphData: "",
    courseIdent: ""
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "popup") {
        //set icon back to normal
        chrome.browserAction.setIcon({ path: "/icon/icon32.png" });
        sendResponse(localBackgroundData);
    } else if (message.type === 'clearIcon') {
        chrome.browserAction.setIcon({ path: "/icon/icon32.png" });
    } else {
        // handle messages from content
        //store data in a variable
        localBackgroundData = message;
        //set icons blue cicrle, to indicate user that graph is ready
        //https://stackoverflow.com/questions/47310292/chrome-extension-dynamically-change-icon-without-clicking
        chrome.browserAction.setIcon({ path: "/icon/icon32Dot.png" });
    }
});

