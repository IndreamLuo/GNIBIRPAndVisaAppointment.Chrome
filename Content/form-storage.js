var formStorage = {
    save: function (key, data, callback) {
        var update = {};
        update[key] = data;
        chrome.storage.local.set(update, callback);
    },

    retrieve: function (key, callback) {
        chrome.storage.local.get(key, function (items) {
            callback(items[key]);
        });
    }
}