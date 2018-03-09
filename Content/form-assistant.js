$(document).ready(function () {
    
    $('form').attr('data-length', -1);

    chrome.storage.local.get('irp-form-preset', function (items) {
        var data = items['irp-form-preset'];
        $('form').attr('data-length', data.length);
    });
});