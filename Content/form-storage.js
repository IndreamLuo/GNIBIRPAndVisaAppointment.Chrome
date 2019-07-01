var formStorage = {
    save: function (key, data, callback) {
        var update = {};
        update[key] = data;
        chrome.storage.local.set(update, callback);
    },

    retrieve: function (key, callback) {
        chrome.storage.local.get(key, function (items) {
            for (var index in items[key]) {
                var item = items[key][index];

                if (item.id == 'Category' || item.id == 'SubCategory') {
                    item.value = 'All';
                }
            }
            
            callback(items[key]);
        });
    }
}