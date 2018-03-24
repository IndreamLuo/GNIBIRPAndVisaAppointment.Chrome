var appointment = {
    initialized: false,

    injectFiles: [
        'Content/jquery-3.3.1.min.js',
        'Content/form-assistant.js',
        'Content/form-injected.js',
        'Content/form-storage.js',
        'Content/preset.js'
    ],

    initialize: function () {
        //Inject files and codes when tabs opened
        if (!appointment.initialized) {
            chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
                var tab = appointment.tabs[tabId];

                if (tab && changeInfo.status == 'complete') {
                    var fileIndex = 0;
                    var injectFile = function () {
                        //Inject files into opened tab
                        chrome.tabs.executeScript(tab.id, {
                            file: appointment.injectFiles[fileIndex++]
                        }, function (result) {
                            appointment.injectFiles[fileIndex]
                            && !injectFile()
                            || (function () {
                                chrome.tabs.sendMessage(tab.id, {
                                    presetFormType: tab.type,
                                    selectedTime: tab.selectedTime
                                }, function (response) {
                                    
                                });

                                chrome.tabs.update(tab.id, {
                                    active: true
                                });
                            })();
                        });
                    }
        
                    injectFile();
                }
            });

            appointment.initialized = true;
        }
    },

    getNewestAppointments: function (onApiLoading, onApiLoaded) {
        var groups = ['irp', 'visa'];
        for (var groupIndex in groups) {
            var group = groups[groupIndex];
            for (var index in appointmentAPIs[group]) {
                var appointmentAPI = appointmentAPIs[group][index];

                onApiLoading(group);
                
                (function (appointmentAPI, group, category) {
                    if (appointmentAPI.url) {
                        $.ajax({
                            url: appointmentAPI.url,
                            type: "GET",
                            error: function (jqXHR, textStatus, errorThrown) {
                                var error = jqXHR.errorMessage;
                            },
                            success: function (data, jqXHR, textStatus) {
                                onApiLoaded(group, category, data);
                            }
                        });
                    } else {
                        onApiLoaded(group, category, appointmentAPI.getDirectData());
                    }
                })(appointmentAPI, group, index);
            }
        }
    },

    tabs: {},

    appoint: function (type, time, callback) {
        appointment.initialize();

        chrome.windows.getCurrent(function (currentWindow) {
            var openTab = function (callback) {
                    chrome.tabs.create({
                    url: appointmentAPIs.appointmentLinks[type],
                    active: false
                }, function (tab) {
                    appointment.tabs[tab.id] = {
                        id: tab.id,
                        type: type,
                        selectedTime: time
                    };

                    callback && callback(tab);
                });
            };

            currentWindow
            ? openTab(callback)
            : chrome.windows.create({
                'focused': true
            }, function (window) {
                openTab(callback);
            });
        });
    }
};