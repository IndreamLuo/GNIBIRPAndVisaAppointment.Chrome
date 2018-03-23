var notification = {
    senderId: '164032443416',

    isListening: false,

    notifications: {},

    initialize: function () {
        notification.getStatus("irp", function (on) {
            on && notification.turnOn("irp");
        });
        
        notification.getStatus("visa", function (on) {
            on && notification.turnOn("visa");
        });
    },

    notificationBase: function (title, message) {
        this.type = 'basic';
        this.iconUrl = 'icon.png';
    },

    turnOn: function (type) {
        if (window != chrome.extension.getBackgroundPage()) {
            return chrome.extension.getBackgroundPage().notification.turnOn();
        }

        formStorage.retrieve('gcm-registered', function (registered) {
            if (!notification.isListening) {
                chrome.gcm.register([notification.senderId], function (result) {
                    if (chrome.runtime.lastError) {
                        console.log('gcm register error:' + chrome.runtime.lastError);
                    } else {
                        formStorage.retrieve(type + '-form-preset', function (data) {
                            $.ajax({
                                url: 'https://gnibirpandvisaappointmentservice.azurewebsites.net/api/Subscribe',
                                method: 'POST',
                                data: JSON.stringify({
                                    gcmToken: result
                                }),
                                dataType: "json",
                                contentType: 'application/json',
                                success: function () {
                                    formStorage.save("gcmToken", result, function () {
                                        //Add GCM message listener
                                        chrome.gcm.onMessage.addListener(function (message) {
                                            //Organize message
                                            var newNotification = {
                                                id: Date.now() + '',
                                                type: message.data.type,
                                                category: message.data.category,
                                                subCategory: message.data.subCategory,
                                                time: message.data.time,
                                                title: message.data.title,
                                                message: message.data.message
                                            };

                                            notification.notifications[newNotification.id] = newNotification;

                                            //Create chrome notification
                                            chrome.notifications.create(newNotification.id, {
                                                type: "basic",
                                                iconUrl: 'icon.png',
                                                title: newNotification.title,
                                                message: newNotification.message,
                                                buttons: [{
                                                    title: "Appoint"
                                                }, {
                                                    title: "Ignore"
                                                }],
                                                isClickable: true
                                            });

                                            //Listen notification button
                                            chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
                                                if (buttonIndex == 0) {
                                                    var clickedNotification = notification.notifications[notificationId];
                                                    var api = appointmentAPIs[clickedNotification.type.toLowerCase()][clickedNotification.category + (clickedNotification.subCategory ? '-' + clickedNotification.subCategory : '')];

                                                }

                                                chrome.notifications.clear(notificationId);
                                            });
                                        });

                                        formStorage.save(type + '-notification', true, function () {
                                            notification.isListening = true;
                                        });
                                    });
                                }
                            });
                        });
                    }
                });
            }
        });
    },

    turnOff: function (type) {
        if (window != chrome.extension.getBackgroundPage()) {
            return chrome.extension.getBackgroundPage().notification.turnOff();
        }

        chrome.gcm.unregister(function () {
            formStorage.retrieve("gcmToken", function (gcmToken) {
                var unsubscribeUrl = "https://gnibirpandvisaappointmentservice.azurewebsites.net/api/Unsubscribe/{type}/{key}?code=Ho4tYiGSvGcsQmOtUE77ln9SIB7B2zbrjCZDfWumqltbKRFmPjNlDw==";
                unsubscribeUrl = unsubscribeUrl.replace("{type}", "GCM").replace("{key}", gcmToken);
                $.post(unsubscribeUrl, function () {
                    formStorage.save(type + '-notification', false, function () {
                        notification.isListening = false;
                    });
                })
            });
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
