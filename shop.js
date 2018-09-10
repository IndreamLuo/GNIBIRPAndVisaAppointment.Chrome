var shop = {
    initialize: function () {
        google.payments.inapp.getSkuDetails({
            'parameters': {'env': 'prod'},
            'success': function (skus) {

            },
            'failure': function (error) {
                if (error == '') {

                }
            }
          });
    },

    ui: {
        $getItem: function () {

        }
    },

    testData: {
        "response": {
            "details": {
                "kind": "chromewebstore#inAppProductList",
                "inAppProducts": [{
                    "kind": "chromewebstore#inAppProduct",
                    "sku": "70darkchocolate",
                    "item_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                    "type": "inapp",
                    "state": "ACTIVE",
                    "prices": [{
                        "valueMicros": "990000",
                        "currencyCode": "USD",
                        "regionCode": "US"
                    }],
                    "localeData": [{
                        "title": "Dark Chocolate (70%)",
                        "description": "The best chocolate available.",
                        "languageCode": "all"
                    }]
                }]
            }
        }
    }
};

$(document).ready(function () {
    shop.initialize();
});