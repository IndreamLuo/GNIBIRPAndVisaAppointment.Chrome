$(function () {
    formStorage.retrieve('data-usage-consent', function (agree) {
        if (!agree) {
            var $dataUsageRequest = $('#dataUsageRequest');
            $dataUsageRequest.on('hide.bs.modal', function () {
                formStorage.retrieve('data-usage-consent', function (agree) {
                    if (!agree) {
                        window.close();
                    }
                });
            });
        
            $dataUsageRequest.find('.modal-body .show-all').click(function () {
                $dataUsageRequest.find('.modal-body .content').toggleClass('show-all');
            });
        
            $dataUsageRequest.find('.btn-agree').click(function () {
                formStorage.save('data-usage-consent', true, function (agree) {
                    $dataUsageRequest.modal('hide');
                })
            });
        
            $($dataUsageRequest.find('.modal-body .content')).load('data-usage-details.html');
            $dataUsageRequest.modal('show');
        }
    });
});