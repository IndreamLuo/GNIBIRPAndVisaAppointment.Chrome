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
                        formStorage.retrieve(type + '-form-preset', function (data) {
                            $.ajax({
                                url: 'https://gnibandvisa.azurewebsites.net/api/SentGCMToken?code=31jgGYB69BKGyPRKDyoneJl/rjbSEo31Sscx8wcY39I1BbDrKygyug==',
                                method: 'POST',
                                data: JSON.stringify({
                                    token: result
                                }),
                                dataType: "json",
                                contentType: 'application/json',
                                success: function () {
                                    chrome.gcm.onMessage.addListener(function (message) {
                                        var newNotification = new notification.notificationBase(message['title'], message['information']);
                                        chrome.notification.create(newNotification)
                                    });
                                    registeredOperation();
                                }
                            });
                        });
                    }
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