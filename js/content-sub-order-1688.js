console.log('content-sub-order-1688.js loaded...');

function checkTaobaoOrderAndPassToBackground () {
    var EXTENSION_ID = 'jhknhhfibpnhlfkcekfkiljikkmnpmcf';
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

    if (!window.isTop) { // true  or  undefined
        // do something...
        var data = 'test';
        // Send message to top frame, for example:
        var eleListBox = document.getElementById('listBox');
        if(eleListBox) {
            var orderData = [];
            var collEleOrder = eleListBox.getElementsByClassName('order-item');
            for(var i = 0; i < collEleOrder.length; i++) {
                var eleOrder = collEleOrder[(i+0)];
                var tradeId = eleOrder.getAttribute('tradeid');
                if(!tradeId) {
                    tradeId = eleOrder.getElementsByClassName('tradeId')[0].value;
                }
                var tdOrderDetail = eleOrder.getElementsByClassName('detail')[0];
                var tableOrderDetail = tdOrderDetail.getElementsByTagName('table')[0];
                var trSubOrders = tableOrderDetail.getElementsByTagName('tr');
                var subOrders = [];
                for(var subOrderIndex = 0; subOrderIndex < trSubOrders.length; subOrderIndex++)
                {
                    var priceRealTotal = trSubOrders[subOrderIndex].getElementsByClassName('s3')[0].getElementsByTagName('span')[0].innerText;
                    var priceOriginal = priceRealTotal;
                    if(trSubOrders[subOrderIndex].getElementsByClassName('s3')[0].getElementsByClassName('b-price-amount').length > 0) {
                        priceOriginal = trSubOrders[subOrderIndex].getElementsByClassName('s3')[0].getElementsByClassName('b-price-amount')[0].innerText;
                    }
                    var skuTexts = [];
                    var collEleSku = trSubOrders[subOrderIndex].getElementsByClassName('sku-item');
                    for(var j = 0; j < collEleSku.length; j++) {
                        var eleSku = collEleSku[(j+0)];
                        var skuValue = eleSku.getElementsByTagName('span')[0].innerText;
                        var skuName = eleSku.innerText.substring(0, eleSku.innerText.indexOf(':'));
                        skuTexts.push({name:skuName, value: skuValue});
                    }
                    subOrders.push(
                        {
                            id: 0,
                            itemInfo: {
                                id: eleOrder.querySelector("input[name='cargoIdentity']").value,
                                itemUrl: trSubOrders[subOrderIndex].getElementsByTagName('a')[0].getAttribute('href'),
                                pic: trSubOrders[subOrderIndex].getElementsByTagName('img')[0].getAttribute('src'),
                                skuId: 0,
                                skuText: skuTexts,
                                title: trSubOrders[subOrderIndex].getElementsByClassName('productName')[0].innerText
                            },
                            operations: [],
                            priceInfo: {
                                currency: "CNY",
                                currencySymbol: "￥",
                                original: priceOriginal,
                                realTotal: priceRealTotal
                            },
                            quantity: {
                                count: trSubOrders[subOrderIndex].getElementsByClassName('s4')[0].innerText
                            }
                        }
                    );
                }

                var collPostFee = eleOrder.getElementsByClassName('s6')[0].getElementsByClassName('fare');
                var postFee = 0;
                if(collPostFee.length > 0) {
                    postFee = collPostFee[0].innerText;
                    postFee = postFee.substring(postFee.indexOf('运费') + 2);
                }

                var orderInfo = {
                    extra: {
                        currency: "CNY",
                        currencySymbol: "￥",
                        tradeStatus: ""
                    },
                    id: tradeId,
                    operations: [],
                    orderInfo: {
                        createDay: eleOrder.getElementsByClassName('date')[0].innerText,
                        createTime: ""
                    },
                    payInfo: {
                        actualFee: eleOrder.getElementsByClassName('s6')[0].getElementsByClassName('total')[0].innerText,
                        postFee: postFee
                    },
                    seller: {
                        id: eleOrder.getAttribute('data-seller-id'),
                        nick: eleOrder.getElementsByClassName('bannerMember')[0].getAttribute('data-copytitle'),
                        shopName: eleOrder.getElementsByClassName('bannerCorp')[0].getAttribute('data-copytitle')
                    },
                    statusInfo: {},
                    subOrders: subOrders,
                    tradeOperations: []
                };
                orderData.push(orderInfo);
            }

            var event = new CustomEvent("PassToBackground", {detail: {action: "frameMessage", value: orderData}});
            window.dispatchEvent(event);
        }
    }
    // ...
}

function handlePassToBackground(evt) {
    console.log('content-sub > handlePassToBackground: ', evt);
    var detail = evt.detail;
    chrome.runtime.sendMessage(detail);
}

window.addEventListener("PassToBackground", handlePassToBackground, false);

var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ checkTaobaoOrderAndPassToBackground +')();'));
(document.body || document.head || document.documentElement).appendChild(script);


