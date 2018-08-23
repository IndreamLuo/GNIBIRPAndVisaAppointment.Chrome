var notification = {
    senderId: config.gcmSenderId,

    isListening: false,

    notifications: {},

    recentMessageTimes: {},

    initialize: function () {
        notification.resubscribe();
    },

    notificationBase: function (title, message) {
        this.type = 'basic';
        this.iconUrl = 'icon.png';
    },

    resubscribe: function (callback) {
        var backgroundPage = chrome.extension.getBackgroundPage();
        if (backgroundPage && window != backgroundPage) {
            return backgroundPage.notification.resubscribe(callback);
        }

        formStorage.retrieve('gcm-registered', function (registered) {
            chrome.gcm.register([notification.senderId], function (gcmToken) {
                if (chrome.runtime.lastError) {
                    console.log('gcm register error:' + chrome.runtime.lastError);
                } else {
                    formStorage.retrieve('gcmToken', function (savedGCMToken) {
                        var updateSubscription = function () {
                            notification.getStatus(function (status) {
                                preset.getPreset(function (presets) {
            
                                    $.ajax({
                                        url: config.gcmSubscribeUrl,
                                        method: 'POST',
                                        data: JSON.stringify({
                                            gcmToken: gcmToken,
                                            irpCategory: (status && status.irp) ? presets.irp['Category'] : null,
                                            irpSubCategory: (status && status.irp) ? presets.irp['ConfirmGNIB'] : null,
                                            visaCategory: (status && status.visa) ? presets.visa['AppointType'] : null
                                        }),
                                        dataType: "json",
                                        contentType: 'application/json',
                                        success: function () {
                                            notification.listenGCM(gcmToken, callback);
                                        }
                                    });
                                });
                            });
                        }

                        if (gcmToken != savedGCMToken) {
                            notification.unsubscribe(updateSubscription);
                        } else {
                            updateSubscription();
                        }
                    });
                }
            });
        });
    },

    listenGCM: function (gcmToken, callback) {
        formStorage.save("gcmToken", gcmToken, function () {
            //Add GCM message listener
            var messageListener = function (message) {
                //Don't publish if resent notification message exists
                if (message.data._timestamp) {
                    var messageKey = message.data._timestamp + message.data.title + message.data.message;

                    if (notification.recentMessageTimes[messageKey])
                    {
                        return;
                    }
                    
                    notification.recentMessageTimes[messageKey] = new Date();
                }

                //Organize message
                var newNotification = {
                    id: Date.now() + '',
                    type: message.data.type.toLowerCase(),
                    category: message.data.category,
                    subCategory: message.data.subCategory,
                    time: message.data.type.toLowerCase() == 'link'
                        ? dates.fromServiceTime(message.data.time)
                        : ((message.data.type.toLowerCase() == 'irp'
                            ? dates.toIRPSlotTime
                            : dates.toVisaSlotTime)(dates.fromServiceTime(message.data.time))),
                    title: message.data.title,
                    message: message.data.message,
                    url: message.data.url
                };

                notification.getStatus(function (status) {
                    notification.notifications[newNotification.id] = newNotification;
                    //Create chrome notification
                    var createChromeNotification = function() {
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

                    if (newNotification.type == 'link') {
                        createChromeNotification();
                    } else if (status[newNotification.type]) {
                        preset.getPreset(function (presets) {
                            if (presets[newNotification.type]['Category']
                                && presets[newNotification.type]['Category'] == newNotification.category
                                && (newNotification.type != 'irp'
                                    || presets[newNotification.type]['ConfirmGNIB'] == newNotification.subCategory))
                            {
                                createChromeNotification();
                            }
                        });
                    }
                });
            };

            !chrome.gcm.onMessage.hasListener(messageListener) && chrome.gcm.onMessage.addListener(messageListener);

            notification.isListening = true;
            
            callback && callback();
        });
    },

    tileListener: function(notificationId) {
        chrome.notifications.clear(notificationId);
        var clickedNotification = notification.notifications[notificationId];
        
        if (clickedNotification.type == 'link') {
            chrome.windows.getCurrent(function (currentWindow) {
                var focusOnNewTab = function (tab) {
                    chrome.windows.update(tab.windowId, {
                        focused: true
                    });
        
                    chrome.tabs.update(tab.id, {
                        active: true
                    });
                }

                var openTab = function () {
                    chrome.tabs.create({
                        url: clickedNotification.url,
                        active: false
                    }, focusOnNewTab);
                };
    
                currentWindow
                ? openTab()
                : chrome.windows.create({
                    url: clickedNotification.url,
                    focused: true
                }, function (window) {
                    focusOnNewTab(window.tabs[0]);
                });
            });
        } else {
            appointment.appoint(clickedNotification.type.toLowerCase(), clickedNotification.time);
        }
    },

    buttonListener: function (notificationId, buttonIndex) {
        for (var notificationId in notification.notifications) {
            chrome.notifications.clear(notificationId);
            notification.notifications[notificationId] = null;
        }
    },

    unsubscribe: function (callback) {
        if (window != chrome.extension.getBackgroundPage()) {
            return chrome.extension.getBackgroundPage().notification.unsubscribe(callback);
        }

        chrome.gcm.unregister(function () {
            formStorage.retrieve("gcmToken", function (gcmToken) {
                var unsubscribeUrl = config.gcmUnsubscribeUrl;
                unsubscribeUrl = unsubscribeUrl.replace("{type}", "GCM").replace("{key}", gcmToken);
                $.post(unsubscribeUrl, callback);
            });
        });
    },

    reset: function (callback) {
        notification.unsubscribe(function () {
            notification.resubscribe(callback);
        });
    },

    status: null,

    getStatus: function (callback) {
        notification.status
        ? callback(notification.status)
        : formStorage.retrieve('notification-status', function(status) {
            notification.status = (typeof status == 'undefined' || !status) ? {} : status;
            callback(notification.status);
        });
    },

    setStatus: function (status, callback) {
        formStorage.save('notification-status', status, function () {
            var backgroundPage = chrome.extension.getBackgroundPage();
            
            backgroundPage
            && (backgroundPage.notification.status = status);
            
            notification.resubscribe(callback);
        })
    },

    setSwitch: function (input) {
        if (input.type == 'checkbox') {
            input.disabled = true;

            preset.getPreset(function (presets) {
                var type = input.getAttribute('notification-type');

                if (presets[type] && (presets[type]['Category'] || presets[type]['AppointType'])) {
                    notification.getStatus(function (status) {
                        input.disabled = false;

                        input.checked = status[type];
                        $(input).change(function () {
                            notification.status[type] = input.checked;
                            notification.setStatus(notification.status);
                        });
                    });
                }
            });
        }
    }
}
