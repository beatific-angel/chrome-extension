console.log('page-order-taobao.js loaded.......');
const EXTENSION_ID = 'jhknhhfibpnhlfkcekfkiljikkmnpmcf';
var callbackRegistry = {};

function generateUniqueKey() {
    var key = '';
    for (var i = 0; i < 4; ++i) {
        key += Math.random().toString().substr(2);
    }
    if (callbackRegistry[key]) {
        key = generateUniqueKey();
    }
    return key;
}

function handlePassToPage(evt) {
    var detail = evt.detail;
    console.log('passToPage received: ', detail);
    switch(detail.action) {
        case "orderPageTo":
            $.ajax({
                data: {pageNum: detail.value, pageSize: data.page.pageSize, logisticsService: 1},
                type: "POST",
                url: data.extra.asyncRequestUrl,
                cache: false,
                success: function (msg) {
                    try {
                        passToBackground({action: "orderPageTo", result: JSON.parse(msg)});
                    } catch(e) {
                        console.log('order json parse failed', msg)
                    }
                }
            });
            break;
        default:
            console.error('Unregistered passToPage action: ', detail);
    }
}
window.addEventListener("PassToPage", handlePassToPage);

function passToBackground(message) {
    if (message.callback !== undefined) {
        message = Object.assign({}, message);
        var callbackKey = generateUniqueKey();

        callbackRegistry[callbackKey] = message.callback;
        delete message.callback;
        message.callbackKey = callbackKey;
    }

    var event = new CustomEvent("PassToBackground", {detail: message});
    window.dispatchEvent(event);
}
