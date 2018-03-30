var notification = {
    senderId: '164032443416',

    isListening: false,

    notifications: {},

    initialize: function () {
        // formStorage.retrieve("notification-switch", function (on) {
        //     on &&
            notification.turnOn();
        // });
    },

    notificationBase: function (title, message) {
        this.type = 'basic';
        this.iconUrl = 'icon.png';
    },

    turnOn: function (callback) {
        var backgroundPage = chrome.extension.getBackgroundPage();
        if (backgroundPage && window != backgroundPage) {
            return backgroundPage.notification.turnOn(callback);
        }

        formStorage.retrieve('gcm-registered', function (registered) {
            if (!notification.isListening) {
                chrome.gcm.register([notification.senderId], function (gcmToken) {
                    if (chrome.runtime.lastError) {
                        console.log('gcm register error:' + chrome.runtime.lastError);
                    } else {
                        preset.getPreset(function (presets) {
                            var notificationForm = presets.notification;
                            if (notificationForm) {
                                var irpCategories = notificationForm.irpNotification.split('-');
                                var visaCategory = notificationForm.visaNotification;

                                $.ajax({
                                    url: 'https://gnibirpandvisaappointmentservice.azurewebsites.net/api/Subscribe',
                                    method: 'POST',
                                    data: JSON.stringify({
                                        gcmToken: gcmToken,
                                        irpCategory: irpCategories[0],
                                        irpSubCategory: irpCategories[1],
                                        visaCategory: visaCategory
                                    }),
                                    dataType: "json",
                                    contentType: 'application/json',
                                    success: function () {
                                        notification.listenGCM(gcmToken, callback);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    },

    listenGCM: function (gcmToken, callback) {
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
                        title: "Ignore All"
                    }],
                    isClickable: true
                });

                //Listen notification
                !chrome.notifications.onClicked.hasListener(notification.tileListener)
                && chrome.notifications.onClicked.addListener(notification.tileListener);

                //Listen notification button
                !chrome.notifications.onButtonClicked.hasListener(notification.buttonListener)
                && chrome.notifications.onButtonClicked.addListener(notification.buttonListener);
            };

            !chrome.gcm.onMessage.hasListener(messageListener) && chrome.gcm.onMessage.addListener(messageListener);

            formStorage.save('notification-switch', true, function () {
                notification.isListening = true;
                
                callback && callback();
            });
        });
    },

    tileListener: function(notificationId) {
        var clickedNotification = notification.notifications[notificationId];
        appointment.appoint(clickedNotification.type.toLowerCase(), clickedNotification.time);
    },

    buttonListener: function (notificationId, buttonIndex) {
        for (var notificationId in notification.notifications) {
            chrome.notifications.clear(notificationId);
            notification.notifications[notificationId] = null;
        }
    },

    turnOff: function (callback) {
        if (window != chrome.extension.getBackgroundPage()) {
            return chrome.extension.getBackgroundPage().notification.turnOff(callback);
        }

        chrome.gcm.unregister(function () {
            formStorage.retrieve("gcmToken", function (gcmToken) {
                var unsubscribeUrl = "https://gnibirpandvisaappointmentservice.azurewebsites.net/api/Unsubscribe/{type}/{key}?code=Ho4tYiGSvGcsQmOtUE77ln9SIB7B2zbrjCZDfWumqltbKRFmPjNlDw==";
                unsubscribeUrl = unsubscribeUrl.replace("{type}", "GCM").replace("{key}", gcmToken);
                $.post(unsubscribeUrl, function () {
                    formStorage.save('notification-switch', false, function () {
                        notification.isListening = false;
                        callback && callback();
                    });
                })
            });
        });
    },

    restart: function (callback) {
        notification.turnOff(function () {
            notification.turnOn(callback);
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
