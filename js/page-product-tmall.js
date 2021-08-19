console.log('page-product-tmall.js loaded.......');
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

var g_tshop_setup_info;
var oldFuncTShopSetup;
if(typeof TShop !== 'undefined') {
    oldFuncTShopSetup = TShop.Setup;
    TShop.Setup = function (setup_info) {
        g_tshop_setup_info = JSON.parse(JSON.stringify(setup_info));
        oldFuncTShopSetup(setup_info);
    };
}

var g_mdskip_info;
var oldFuncSetMdskip;
if(typeof window.setMdskip === "function") {
    oldFuncSetMdskip = window.setMdskip;
    window.setMdskip = function(mdskip_info) {
        g_mdskip_info = JSON.parse(JSON.stringify(mdskip_info));
        oldFuncSetMdskip(mdskip_info);
    }
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

var g_shixiong_extension_interval = setInterval(function () {
    if(g_mdskip_info && g_tshop_setup_info) {
        var html = '' +
            '<div id="shixiong-toast-container" class="toast-top-right">\n' +
            '    <div aria-live="polite" style="">\n' +
            '        <button class="toast-close-button" onclick="document.getElementById(\'shixiong-toast-container\').style.display = \'None\';">x</button>' +
            '        <div class="toast-message">\n' +
            '            <button type="button" class="upload" onclick="upload_data_to_shixiong();">上传信息</button>\n' +
            '        </div>\n' +
            '    </div>\n' +
            '</div>';
        $('body').append(html);
        clearInterval(g_shixiong_extension_interval);
    }
}, 1000);

function upload_data_to_shixiong() {
    // Use this for debugging, to check that zepto.js is loaded
    // and ajax works.
    var eleDescr = document.getElementById('description');
    var descr_image_urls = [];
    if(eleDescr) {
        var collEleImg = eleDescr.getElementsByTagName('img');
        for(var i = 0; i < collEleImg.length; i++) {
            descr_image_urls.push(collEleImg[i].getAttribute('src'));
        }
    }
    eleDescr = document.getElementById('J_DcBottomRightWrap');
    if(eleDescr) {
        var collEleImg = eleDescr.getElementsByTagName('img');
        for(var i = 0; i < collEleImg.length; i++) {
            descr_image_urls.push(collEleImg[i].getAttribute('src'));
        }
    }

    var data = {
        domain: document.domain,
        url: location.href,
        g_config: g_config,
        g_tshop_setup_info: g_tshop_setup_info,
        g_mdskip_info: g_mdskip_info,
    };
    data = JSON.parse(JSON.stringify(data));
    data.descr_image_urls = descr_image_urls;
    data.g_properties = getSkuProperties();

    passToBackground({action: "uploadProductData", value: data});
}

function getSkuProperties() {
    var ret = {};
    var skuIndex = 0;
    $('ul[data-property]').each(function() {
        skuIndex++;
        ret['sku' + skuIndex] = {
            "text"      : $(this).data('property'),
            "values"    : {}
        };
        $(this).find('li[data-value]').each(function() {
            var property_key = $(this).data('value');
            var img_url = '';
            if(property_key.includes(':')) {
                var tmp_style = $(this).find('a')[0].style['background'];
                var pattern_pos = tmp_style.indexOf('url("');
                if( pattern_pos !== -1) {
                     var end_pos = tmp_style.indexOf('"', pattern_pos + 5);
                     img_url = 'https:' + tmp_style.substring(pattern_pos + 5, end_pos - 1);
                     var find_pos = img_url.indexOf('.jpg');
                     if(find_pos !== -1) {
                         img_url = img_url.substring(0, find_pos + 4);
                     }
                }
            }
            var tmp_text = $(this).find('a').text().trim();
            ret['sku' + skuIndex]['values'][property_key] = {
                "text"      : tmp_text,
                "img_url"   : img_url
            };
        });
    });
    return ret;
}