chrome.webNavigation.onCompleted.addListener(
    function(details) {
        chrome.tabs.executeScript(details.tabId, {
            file: 'js/page-on-completed-order-taobao.js'
        });
    }, {
        url: [
            {
                // Runs on example.com, example.net, but also example.foo.com
                hostContains: 'buyertrade.taobao.com'
            }
        ],
    }
);

function base64_encode(str){
    var c1, c2, c3;
    var base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var i = 0, len= str.length, string = '';
    while (i < len){
        c1 = str.charCodeAt(i++) & 0xff;
        if (i == len){
            string += base64EncodeChars.charAt(c1 >> 2);
            string += base64EncodeChars.charAt((c1 & 0x3) << 4);
            string += "==";
            break;
        }
        c2 = str.charCodeAt(i++);
        if (i == len){
            string += base64EncodeChars.charAt(c1 >> 2);
            string += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
            string += base64EncodeChars.charAt((c2 & 0xF) << 2);
            string += "=";
            break;
        }
        c3 = str.charCodeAt(i++);
        string += base64EncodeChars.charAt(c1 >> 2);
        string += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
        string += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
        string += base64EncodeChars.charAt(c3 & 0x3F)
    }
    return string;
}

function postDataToShixiong(url, data_arr) {
    var xhr = new XMLHttpRequest;
    xhr.addEventListener('load', function() {
        try {
            var retData = JSON.parse(this.responseText);
            if(retData.error) {
                alert(retData.error);
            }
            console.log('server returned: ', JSON.parse(this.responseText));
        } catch(e) {
            alert(e);
        }
    });
    //xhr.open(request.xhr.method || 'GET', request.xhr.url);
    //xhr.send();

    chrome.cookies.getAll({'url':data_arr.url}, function(cookie) {
        var cookie_string = '';
        for(var i in cookie) {
            var name = cookie[i].name;
            var value = cookie[i].value;
            //cs[name]=value;
            //cookie_str += (name + "=" + value + ";\n");
            cookie_string += (name + "=" + value + "; ");
        }

        //if(cs['cookie2']==null||cs['cookie17']==null){}
        data_arr.browser_cookie = base64_encode(cookie_string);
        xhr.open('POST', url, true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.send(JSON.stringify(data_arr));
    });
}

function MessageHandler(options) {
    options = options || {};

    this.allowedRemoteUrls = options.allowedRemoteUrls;
    this.allowedHostUrls = options.allowedHostUrls;
}

MessageHandler.prototype.onMessageHandler = function(request, sender, sendResponse) {
    // if sender.tab is set, the message came from a content script;
    // otherwise, the message came from an extension(?)
    if (!sender.tab) {
        return;
    }

    var hostOk = false;
    for (var i = 0; i < this.allowedHostUrls.length; ++i) {
        if (sender.tab.url.indexOf(this.allowedHostUrls[i]) >= 0) {
            hostOk = true;
            break;
        }
    }
    if (!hostOk) {
        return;
    }

    if(request) {
        switch (request.action) {
            case "setDocumentInfo":
                this.g_domain = request.value.domain;
                //this.g_cookie = request.value.cookie;
                break;
            case "setConfig":
                this.g_config = request.value;
                break;
            case "setTShopSetup":
                this.g_setup_info = request.value;
                break;
            case "setHubConfigSku":
                this.g_hub_config_sku = request.value;
                break;
            case "setOrders":
                this.g_orders = request.value;
                break;
            case "orderPageTo":
                if(portWithPopup) {
                    portWithPopup.postMessage({
                        domain: this.g_domain,
                        //cookie: this.g_cookie,
                        setup_info: this.g_setup_info,
                        order_data: request.result
                    });
                }
                break;
            case "frameMessage":
                this.g_orders = {mainOrders:request.value};
                break;
            case "uploadProductData":
                //postDataToShixiong('http://swshopping.cn/admin/extension/ajax/browser-product/create', request.value);
                postDataToShixiong('http://shixiong-dev.com/admin/extension/ajax/browser-product/create', request.value);
                break;
            case "uploadOrderData":
                //postDataToShixiong('http://swshopping.cn/admin/extension/ajax/browser-order/create', request.value);
                postDataToShixiong('http://shixiong-dev.com/admin/extension/ajax/browser-order/create', request.value);
                break;
            default:
                console.error('Unrecognised extension background action: ', request);
        }
    } else {
        console.warn('MessageHandler::Unknown request: ', sender);
    }
};

MessageHandler.prototype.install = function() {
    chrome.runtime.onMessage.addListener(this.onMessageHandler.bind(this));
};

var allowedRemoteUrls = [
    'shixiong-dev', 'swshopping.cn', 'swshopping.net'
];
var allowedHostUrls = [
    'taobao', 'tmall', '1688'
];

var extMessageHandler = new MessageHandler({
    allowedRemoteUrls: allowedRemoteUrls,
    allowedHostUrls: allowedHostUrls,
});
extMessageHandler.install();

var portWithPopup;
chrome.extension.onConnect.addListener(function(port) {
    console.log("Connected to popup.....");

    portWithPopup = port;
    port.postMessage({
        domain: extMessageHandler.g_domain,
        //cookie: extMessageHandler.g_cookie,
        setup_info: extMessageHandler.g_setup_info,
        order_data: extMessageHandler.g_orders
    });

    port.onMessage.addListener(function(msg) {
        switch(msg.action) {
            case "connectFromPopup":
                break;
            case "orderPageTo":
                break;
            default:
                console.error('Unregistered port message: ', $msg);
        }

        console.log("message recieved", msg);

        //port.postMessage(extMessageHandler);
    });
})

/*
function addXMLRequestCallback(callback){
    var oldSend, i;
    if( XMLHttpRequest.callbacks ) {
        // we've already overridden send() so just add the callback
        XMLHttpRequest.callbacks.push( callback );
    } else {
        // create a callback queue
        XMLHttpRequest.callbacks = [callback];
        // store the native send()
        oldSend = XMLHttpRequest.prototype.send;
        // override the native send()
        XMLHttpRequest.prototype.send = function(){
            // process the callback queue
            // the xhr instance is passed into each callback but seems pretty useless
            // you can't tell what its destination is or call abort() without an error
            // so only really good for logging that a request has happened
            // I could be wrong, I hope so...
            // EDIT: I suppose you could override the onreadystatechange handler though
            for( i = 0; i < XMLHttpRequest.callbacks.length; i++ ) {
                XMLHttpRequest.callbacks[i]( this );
            }
            // call the native send()
            oldSend.apply(this, arguments);
        }
    }
}

// e.g.
addXMLRequestCallback( function( xhr ) {
    console.log( 'hook', xhr.responseText ); // (an empty string)
});
*/