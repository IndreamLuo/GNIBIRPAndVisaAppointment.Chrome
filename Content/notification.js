var notification = {
    senderId: '164032443416',

    notificationBase: function (title, message) {
        this.type = 'basic';
        this.iconUrl = 'icon.png';
    },

    turnOn: function (type) {
        formStorage.retrieve('gcm-registered', function (registered) {
            var registeredOperation = function () {
                formStorage.save(type + '-notification', true);
            }

            if (!registered) {
                chrome.gcm.register([notification.senderId], function (result) {
                    if (chrome.runtime.lastError) {
                        console.log('gcm register error:' + chrome.runtime.lastError);
                    } else {
                        //Should sent the result(token) to service by here
                        //

                        chrome.gcm.onMessage.addListener(function (message) {
                            var newNotification = new notification.notificationBase(message['title'], message['information']);
                            chrome.notification.create(newNotification)
                        });
                    }
                    registeredOperation();
                });
            } else {
                registeredOperation();
            }
        });
    },

    turnOff: function (type) {
        chrome.gcm.unregister(function () {
            formStorage.save(type + '-notification', false);
        });
    },

    getStatus: function (type, callback) {
        formStorage.retrieve(type + '-notification', callback);
    },

    setSwitch: function (input) {
        if (input.type == 'checkbox') {
            var type = input.getAttribute('notification-type');

            notification.getStatus(type, function (currentStatus) {
                input.checked = currentStatus;
                $(input).change(function () {
                    notification[input.checked ? 'turnOn' : 'turnOff'](type); 
                });
            });
        }
    }
}