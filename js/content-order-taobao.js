var callbackRegistry = {};

function injectScript(url, callback) {
    var s = document.createElement('script');
    var url = chrome.extension.getURL(url);
    s.src = url;
    (document.head||document.documentElement).appendChild(s);
    s.onload = function() {
        s.parentNode.removeChild(s);
        if (callback) {
            callback.call(this);
        }
    };
}

function handlePassToBackground(evt) {
    var detail = evt.detail;
    chrome.runtime.sendMessage(detail);
}

window.addEventListener("PassToBackground", handlePassToBackground, false);

injectScript('js/zepto.js', function() {
    injectScript('js/page-order-taobao.js');
});

chrome.runtime.onMessage.addListener(handlePassToContent);
function handlePassToContent (message, sender, sendResponse) {
    console.log('handlePassToContent', message);
    var event = new CustomEvent("PassToPage", {detail: message});
    window.dispatchEvent(event);
}