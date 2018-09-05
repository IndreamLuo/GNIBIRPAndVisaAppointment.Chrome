var shop = {
    initialize: function () {
        google.payments.inapp.getSkuDetails({
            'parameters': {'env': 'prod'},
            'success': function (skus) {

            },
            'failure': function (error) {

            }
          });
    },

    ui: {
        $getItem: function () {

        }
    }
};

$(document).ready(function () {
    shop.initialize();
});