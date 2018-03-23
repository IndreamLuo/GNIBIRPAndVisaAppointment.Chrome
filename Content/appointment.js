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
        if (chrome.extension.getBackgroundPage() && window != chrome.extension.getBackgroundPage()) {
            chrome.extension.getBackgroundPage().appointment.initialize();
        }
        //Inject files and codes when tabs opened
        if (!appointment.initialized) {
            chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
                var tab = appointment.tabs[tabId];

                if (tab && changeInfo.status == 'complete') {
                    var fileIndex = 0;
                    var injectFile = function () {
                        //Set preset form type and selected time
                        chrome.tabs.executeScript(tab.id, {
                            code: 'var presetFormType = "' + appointment.tabs[tab.id].type + '";'
                        }, function (result) {
                            //Inject files into opened tab
                            chrome.tabs.executeScript(tab.id, {
                                file: appointment.injectFiles[fileIndex++]
                            }, function (result) {
                                appointment.injectFiles[fileIndex]
                                && !injectFile()
                                || (function () {
                                    var code = ('var selectedTime = "tab.selectedTime"; (' + function () {
                                        formAssistant.applyScript('var selectedTime = "tab.selectedTime";');
                                    }.toString() + ')()')
                                    .replace('tab.selectedTime', tab.selectedTime || '')
                                    .replace('tab.selectedTime', tab.selectedTime || '');
                                    
                                    chrome.tabs.executeScript(tab.id, {
                                        code: code
                                    }, function (result) {
                                        chrome.tabs.update(tab.id, {
                                            active: true
                                        });
                                    })
                                })();
                            });
                        });
                    }
        
                    injectFile();
                }
            });

            appointment.initialized = true;
        }
    },

    getNewestAppointments: function (onApiLoading, onApiLoaded) {
        if (chrome.extension.getBackgroundPage() && window != chrome.extension.getBackgroundPage()) {
            chrome.extension.getBackgroundPage().appointment.getNewestAppointments(onApiLoading, onApiLoaded);
        }

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

    appoint: function (type, time) {
        if (chrome.extension.getBackgroundPage() && window != chrome.extension.getBackgroundPage()) {
            chrome.extension.getBackgroundPage().appointment.appoint(type, time);
        }

        appointment.initialize();

        var newTab = chrome.tabs.create({
            url: appointmentAPIs.appointmentLinks[type],
            active: false
        }, function (tab) {
            appointment.tabs[tab.id] = {
                id: tab.id,
                type: type,
                selectedTime: time
            };
        });
    }
};