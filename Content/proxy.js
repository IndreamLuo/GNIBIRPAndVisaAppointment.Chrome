var proxy = {
    get: function(url, callback) {
        var tokens = '&k=' + $('#k').val()
            + '&p=' + $('#p').val();
        $.get(url + tokens, callback);
    }
}