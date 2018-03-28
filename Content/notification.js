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

    turnOn: function (type, callback) {
        var backgroundPage = chrome.extension.getBackgroundPage();
        if (backgroundPage && window != backgroundPage) {
            return backgroundPage.notification.turnOn(type, callback);
        }

        formStorage.retrieve('gcm-registered', function (registered) {
            if (!notification.isListening) {
                chrome.gcm.register([notification.senderId], function (gcmToken) {
                    if (chrome.runtime.lastError) {
                        console.log('gcm register error:' + chrome.runtime.lastError);
                    } else {
                        preset.getPreset(function () {
                            $.ajax({
                                url: 'https://gnibirpandvisaappointmentservice.azurewebsites.net/api/Subscribe',
                                method: 'POST',
                                data: JSON.stringify({
                                    gcmToken: gcmToken,
                                    type: type
                                }),
                                dataType: "json",
                                contentType: 'application/json',
                                success: function () {
                                    notification.listenGCM(type, gcmToken, callback);
                                }
                            });
                        });
                    }
                });
            }
        });
    },

    listenGCM: function (type, gcmToken, callback) {
        formStorage.save("gcmToken", gcmToken, function () {
            //Add GCM message listener
            var messageListener = function (message) {
                //Organize message
                var newNotification = {
                    id: Date.now() + '',
                    type: message.data.type.toLowerCase(),
                    category: message.data.category,
                    subCategory: message.data.subCategory,
                    time: (message.data.type.toLowerCase() == 'irp'
                        ? dates.toIRPSlotTime
                        : dates.toVisaSlotTime)(dates.fromServiceTime(message.data.time)),
                    title: message.data.title,
                    message: message.data.message
                };

                notification.notifications[newNotification.id] = newNotification;

                //Create chrome notification
                chrome.notifications.create(newNotification.id, {
                    type: "basic",
                    iconUrl: newNotification.type == 'irp' && 'Content/notification-irp.png'
                    || newNotification.type == 'visa' && 'Content/notification-visa.jpg'
                    || 'icon.png',
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
                !chrome.notifications.onButtonClicked.hasListener(notification.listener)
                && chrome.notifications.onButtonClicked.addListener(notification.listener);
                
                callback && callback();
            };

            !chrome.gcm.onMessage.hasListener(messageListener) && chrome.gcm.onMessage.addListener(messageListener);

            formStorage.save(type + '-notification', true, function () {
                notification.isListening = true;
            });
        });
    },

    listener: function (notificationId, buttonIndex) {
        if (buttonIndex == 0) {
            var clickedNotification = notification.notifications[notificationId];
            var api = appointmentAPIs[clickedNotification.type.toLowerCase()][clickedNotification.category + (clickedNotification.subCategory ? '-' + clickedNotification.subCategory : '')];
            appointment.appoint(clickedNotification.type.toLowerCase(), clickedNotification.time);
        }

        chrome.notifications.clear(notificationId);
    },

    turnOff: function (type, callback) {
        if (window != chrome.extension.getBackgroundPage()) {
            return chrome.extension.getBackgroundPage().notification.turnOff(type, callback);
        }

        chrome.gcm.unregister(function () {
            formStorage.retrieve("gcmToken", function (gcmToken) {
                var unsubscribeUrl = "https://gnibirpandvisaappointmentservice.azurewebsites.net/api/Unsubscribe/{type}/{key}?code=Ho4tYiGSvGcsQmOtUE77ln9SIB7B2zbrjCZDfWumqltbKRFmPjNlDw==";
                unsubscribeUrl = unsubscribeUrl.replace("{type}", "GCM").replace("{key}", gcmToken);
                $.post(unsubscribeUrl, function () {
                    formStorage.save(type + '-notification', false, function () {
                        notification.isListening = false;
                        callback && callback();
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
