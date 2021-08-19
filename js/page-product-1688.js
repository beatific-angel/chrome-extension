console.log('page-product-1688.js loaded.......');
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

var styleEl = document.createElement('style');
styleEl.innerHTML = '' +
    '#shixiong-toast-container {' +
    '    position: fixed;' +
    '    z-index: 1000000000;' +
    '    top: 0px;' +
    '    right: 0px;' +
    '    width: 100px;' +
    '    padding: 10px;' +
    '    background-color: #1bc5bd;' +
    '    box-shadow: 0 0.5rem 1.5rem 0.5rem rgba(0, 0, 0, 0.075) !important;' +
    '    color: #fff;' +
    '    opacity: .95;' +
    '}' +
    '#shixiong-toast-container .toast-close-button {' +
    '    cursor: pointer;' +
    '    border: none !important;' +
    '    padding: 0 3px;' +
    '    float: right;' +
    '    color: #fff;' +
    '    background-color: #1bc5bd;' +
    '    font-weight: 600;' +
    '}' +
    '#shixiong-toast-container .upload {' +
    '    cursor: pointer;' +
    '    outline: none !important;' +
    '    border: none !important;' +
    '    padding: 5px 10px;' +
    '    background-color: #fff;' +
    '    border-radius: 10px;' +
    '}';

document.head.appendChild(styleEl);

var g_descr_image_urls = [];

var g_shixiong_extension_interval = setInterval(function () {
    var eleDescr = document.getElementById('desc-lazyload-container');
    if(eleDescr) {
        var collEleImg = eleDescr.getElementsByTagName('img');
        for(var i = 0; i < collEleImg.length; i++) {
            g_descr_image_urls.push(collEleImg[i].getAttribute('src'));
        }
    }

    if(g_descr_image_urls.length > 0) {
        var html = '' +
            '<div id="shixiong-toast-container" class="toast-top-right">\n' +
            '    <div aria-live="polite" style="">\n' +
            '        <button class="toast-close-button" onclick="document.getElementById(\'shixiong-toast-container\').style.display = \'None\';">x</button>' +
            '        <div class="toast-message">\n' +
            '            <button type="button" class="upload" onclick="upload_data_to_shixiong();">上传信息</button>\n' +
            '        </div>\n' +
            '    </div>\n' +
            '</div>';
        document.getElementsByTagName('body')[0].innerHTML += html;
        clearInterval(g_shixiong_extension_interval);
    }
}, 1000);

function upload_data_to_shixiong() {
    // Use this for debugging, to check that zepto.js is loaded
    // and ajax works.
    var data = {
        domain: document.domain,
        url: location.href,
        product_info: {},
        g_iDetailData: JSON.parse(JSON.stringify(iDetailData)),
        descr_image_urls: g_descr_image_urls
    };
    var eleTitle = document.querySelector("meta[property='og:title']");
    if(eleTitle) {
        data.product_info['title'] = eleTitle.getAttribute('content');
    }
    var eleItemId = document.querySelector("meta[name='b2c_auction']");
    if(eleItemId) {
        data.product_info['itemId'] = eleItemId.getAttribute('content');
    }
    var collDefaultImages = document.querySelectorAll('.tab-trigger');
    if(collDefaultImages) {
        data.product_info['default_images'] = [];
        for(var i = 0; i < collDefaultImages.length; i++) {
            var tmpImg = JSON.parse(collDefaultImages[i].getAttribute('data-imgs'));
            data.product_info['default_images'].push(tmpImg.original);
        }
    }
    var eleDescrUrl = document.querySelector('div[data-tfs-url]');
    if(eleDescrUrl) {
        data.product_info['description_url'] = eleDescrUrl.getAttribute('data-tfs-url');
    }
    data = JSON.parse(JSON.stringify(data));
    console.log(data);
    passToBackground({action: "uploadProductData", value: data});
}
