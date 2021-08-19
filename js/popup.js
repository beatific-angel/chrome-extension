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

var background_data = {};

function initOrderData() {
    background_data = {};
    $('#tbody_orders').html('');
    $('#btn_import').prop('disabled', true);
    $('#chk_select_all').prop('checked', false);
    $('#chk_select_all').prop('disabled', true);

    $('#pagination_first').addClass('disabled');
    $('#pagination_prev').addClass('disabled');
    $('#pagination_next').addClass('disabled');
    $('#pagination_last').addClass('disabled');
}

function displayOrderData(bk_order_data) {
    var tbody_html = '';
    var mainOrders = bk_order_data.mainOrders;
    for(var i in mainOrders) {
        tbody_html += '<tr class="no-bottom-border">\n' +
            '                    <td colspan="4">\n' +
            '                        <label>\n' +
            '                            <input type="checkbox" value="' + mainOrders[i].id + '" class="chk-select-order"/>\n' +
            '                            <span class="bold">' + mainOrders[i].orderInfo.createDay + '</span>\n' +
            '                            订单号: ' + mainOrders[i].id + '\n' +
            '                        </label>\n' +
            '                    </td>\n' +
            '                </tr>\n' +
            '                <tr>\n' +
            '                    <td><img src="https:' + mainOrders[i].subOrders[0].itemInfo.pic + '"></td>\n' +
            '                    <td>' + mainOrders[i].subOrders[0].itemInfo.title + '</td>\n';
        if(typeof mainOrders[i].subOrders[0].quantity.count !== "undefined") {
            tbody_html += '                    <td>' + mainOrders[i].subOrders[0].quantity.count + '</td>\n';
        } else {
            tbody_html += '                    <td>' + mainOrders[i].subOrders[0].quantity + '</td>\n';
        }
        tbody_html += '                    <td>￥' + mainOrders[i].payInfo.actualFee + '</td>\n' +
            '                </tr>'
    }
    $('#tbody_orders').html(tbody_html);

    if(mainOrders.length > 0) {
        $('#chk_select_all').prop('disabled', false);
    }

    if(bk_order_data.page) {
        if (bk_order_data.page.currentPage < bk_order_data.page.totalPage) {
            $('#pagination_next').removeClass('disabled');
            $('#pagination_last').removeClass('disabled');
        }
        if (bk_order_data.page.currentPage > 1) {
            $('#pagination_first').removeClass('disabled');
            $('#pagination_prev').removeClass('disabled');
        }
    }
}

var portWithBackground = chrome.extension.connect({
    name: "Sample Communication"
});
portWithBackground.postMessage({action:"connectFromPopup"});
portWithBackground.onMessage.addListener(function(msg) {
    initOrderData();
    background_data = msg;
    if(typeof background_data.order_data !== "undefined") {
        displayOrderData(background_data.order_data);
    }
    $('#div_preloader').hide();
});

$(document).ready(function(){
    //passToContent({action: "getAlibabaOrders"});
    $('#tbody_orders').on('click', '.chk-select-order', function() {
        if($(this).is(':checked')) {
            $('#btn_import').prop('disabled', false);
        } else {
            $('#chk_select_all').prop('checked', false);
            if($('#tbody_orders .chk-select-order:checked').length <= 0) {
                $('#btn_import').prop('disabled', true);
            }
        }
    });

    $('#chk_select_all').on('click', function() {
        var chkVal = false;
        if($(this).is(':checked')) {
            chkVal = true;
        }
        $('#tbody_orders .chk-select-order').each(function(i, obj) {
            $(this).prop('checked', chkVal);
            $('#btn_import').prop('disabled', !chkVal);
        });
    });

    $('#btn_import').on('click', function() {
        var import_order_ids = [];
        $('#tbody_orders .chk-select-order:checked').each(function(i, obj) {
            import_order_ids.push('' + $(this).val());
        });

        $('#tbody_orders').hide();
        $('#div_preloader').show();
        $.ajax({
            data: {
                domain:             g_url.host,
                import_order_ids:   import_order_ids.join(),
                browser_cookie:     g_cookie_string,
                order_data:         background_data.order_data
            },
            type: "POST",
            url: 'http://shixiong-dev.com/admin/extension/ajax/browser-order/create',
            //url: 'http://swshopping.cn/admin/extension/ajax/browser-order/create',
            cache: false,
            success: function (retData) {
                $('#div_preloader').hide();
                $('#tbody_orders').show();
                try {
                    //var retData = JSON.parse(responseText);
                    if(retData.error) {
                        alert(retData.error);
                    } else {
                        alert('导入成功！');
                    }
                } catch(e) {
                    alert(e);
                }
            },
            error: function () {
                $('#div_preloader').hide();
                $('#tbody_orders').show();
            }
        });
    });

    $('#pagination_first').on('click', function() {
        $('#div_preloader').show();
        passToContent({action: "orderPageTo", value: 1});
        initOrderData();
    });
    $('#pagination_prev').on('click', function() {
        $('#div_preloader').show();
        passToContent({action: "orderPageTo", value: background_data.order_data.page.currentPage - 1});
        initOrderData();
    });
    $('#pagination_next').on('click', function() {
        $('#div_preloader').show();
        passToContent({action: "orderPageTo", value: background_data.order_data.page.currentPage + 1});
        initOrderData();
    });
    $('#pagination_last').on('click', function() {
        $('#div_preloader').show();
        passToContent({action: "orderPageTo", value: background_data.order_data.page.totalPage});
        initOrderData();
    });
}); // Doc ready end

function baseurl(url) {
    var domain;
    //find & remove protocol (http, ftp, etc.) and get domain
    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    } else {
        domain = url.split('/')[0];
    }
    //find & remove port number
    domain = domain.split(':')[0];

    return domain;
}
//console.log(baseurl(url));

/************************/
function nohttp(url) {
    //var protomatch = /^(https?|ftp):\/\//; // NB: not '.*'
    //return url.replace(/^https?\:\/\//i, "");
    //return url.replace(/.*?:\/\//g, "");
    url = url.replace("www.", "");
    return url.replace(/.*?:\/\//g, "");
    //return url.replace((http|https):\/\)?;
}

function passToContent(message) {
    chrome.tabs.getSelected(null,function(tab) {
        // and use that tab to fill in out title and url
        chrome.tabs.sendMessage(tab.id, message);
    });
}

var g_cookie_string = '';
var g_url;

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

document.addEventListener('DOMContentLoaded', function() {
    chrome.tabs.getSelected(null,function(tab) {
        g_cookie_string = '';
        var cookie_str = "";
        var is_login=true;
        var cs={};
        g_url = new URL(tab.url);
        chrome.cookies.getAll({'url':tab.url}, function(cookie) {
            for(i in cookie) {
                name = cookie[i].name;
                value = cookie[i].value;
                cs[name]=value;
                cookie_str += (name + "=" + value + ";\n");
                g_cookie_string += (name + "=" + value + "; ");
            }

            if(cs['cookie2']==null||cs['cookie17']==null){

            }
            g_cookie_string = base64_encode(g_cookie_string);
        });
        console.log('DOMContentLoaded cookie', g_cookie_string);
    });
});
