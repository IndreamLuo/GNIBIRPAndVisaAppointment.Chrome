var formStorage = {
    save: function (key, data, callback) {
        chrome.storage.local.set({
            key: data
        }, callback);
    },

    retrieve: function (key, callback) {
        chrome.storage.local.get(key, function (items) {
            callback(items[key]);
        });
    }
}