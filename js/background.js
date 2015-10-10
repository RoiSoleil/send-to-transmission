chrome.contextMenus.create({
    "title": "Send To Transmission",
    "contexts": [ "link" ],
    "onclick": torrentOnClick,
});

/*
 * Show Chrome desktop notification.
 * 
 * title: notification title text: notification text
 */
function showNotification(title, text) {
    // timeout stored from options
    var timeout = localStorage.notificationDuration;

    // notifications disabled
    if (!JSON.parse(localStorage.displayNotification)) {
        console.log('notifications disabled');
        return;
    }

    chrome.notifications.create(new Date().getTime().toString(), {
        type: "basic",
        iconUrl: "../img/icon-large.png",
        title: title,
        message: text
    }, function(id) {
        console.log(id);
    });
}

/*
 * Chrome right click context action adds sends URL to Transmission RPC.
 * 
 * info: provides information of link clicked tab: unused
 */
function torrentOnClick(info, tab) {
//    add_torrent(info.linkUrl);
}

/*
 * Initial load.
 */
if (!localStorage.isInitialized) {
    localStorage.rpcUser = "";
    localStorage.rpcPass = "";
    localStorage.rpcURL = "http://localhost:9091/transmission/rpc";
    localStorage.webURL = "http://localhost:9091";
    localStorage.displayNotification = true;
    localStorage.notificationDuration = 10;
    localStorage.refreshRate = 5;
    localStorage.selected_list = "all";
    localStorage.setItem("enable-additional-paths", false);

    localStorage.isInitialized = true;
}

chrome.extension.onConnect.addListener(function(port) {
    if (port.name == "options") {
        port.onMessage.addListener(function(msg) {
            if (msg.method == "rpc-test") {
                rpc_request(msg.json, function(req) {
                    port.postMessage({
                        "method": "rpc-test",
                        "req": req
                    });
                }, msg.url, msg.user, msg.pass);
            }
            else if (msg.method == "reset-host") {
                resetHost();
            }
        });
    }
    else if (port.name == "list") {
        port.onMessage.addListener(function(msg) {
            if (msg.method == "rpc-call") {
                msg.json.tag = TAGNO;
                rpc_request(msg.json, function(req) {
                    update();
                    port.postMessage({
                        "method": "rpc-complete",
                        "req": req
                    });
                });
            }
        });
    }
});

function onStorageChange(event) {
    if (event.key == "refreshRate") {
        clearInterval(interval);
        interval = setInterval(update, localStorage.refreshRate * 1000);
    }
    else if (event.key == "rpcURL") {
        localStorage.sessionId = "";
        localStorage.setItem("torrents", JSON.stringify({}));
    }
}
