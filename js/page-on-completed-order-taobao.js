console.log('page-on-completed-order-taobao.js loaded...');

function checkTaobaoOrderAndPassToBackground () {
    // ...
    if(typeof data !== 'undefined' && typeof data.mainOrders !== 'undefined') {
        /*
        $.ajax({
            data: {pageNum: 1, pageSize: data.page.totalNumber},
            type: "POST",
            url: data.extra.asyncRequestUrl,
            cache: false,
            success: function (msg) {
                try {
                    passToBackground({action: "setOrders", value: JSON.parse(msg)});
                } catch(e) {
                    console.log('order json parse failed', msg)
                }
            }
        });
        */

        passToBackground({action: "setOrders", value: data});

    }
    // ...
}

var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ checkTaobaoOrderAndPassToBackground +')();'));
(document.body || document.head || document.documentElement).appendChild(script);