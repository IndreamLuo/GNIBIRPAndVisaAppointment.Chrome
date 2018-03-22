var appointment = {
    initialize: function () {
        //Inject files and codes when tabs opened
        chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
            if (changeInfo.status == 'complete') {
                var fileIndex = 0;
                var injectFile = function () {
                    //Set preset form type and selected time
                    chrome.tabs.executeScript(tab.id, {
                        code: 'var presetFormType = "' + appointment.tabs[tab.id].type + '";'
                    }, function (result) {
                        //Inject files into opened tab
                        chrome.tabs.executeScript(tab.id, {
                            file: injectFiles[fileIndex++]
                        }, function (result) {
                            injectFiles[fileIndex]
                            && !injectFile()
                            || (function () {
                                var code = ('var selectedTime = "appointment.selectedTime"; (' + function () {
                                    formAssistant.applyScript('var selectedTime = "appointment.selectedTime";');
                                }.toString() + ')()')
                                .replace('appointment.selectedTime', appointment.selectedTime || '')
                                .replace('appointment.selectedTime', appointment.selectedTime || '');
                                
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

        $('a[class*=appoint]').click(function () {
            appointment.appoint(this);
            return false;
        });

        var groups = ['irp', 'visa'];
        for (var groupIndex in groups) {
            var group = groups[groupIndex];
            for (var index in appointmentAPIs[group]) {
                var appointmentAPI = appointmentAPIs[group][index];

                statusControl.addLoading(group);
                
                (function (appointmentAPI, group, category) {
                    if (appointmentAPI.url) {
                        $.ajax({
                            url: appointmentAPI.url,
                            type: "GET",
                            error: function (jqXHR, textStatus, errorThrown) {
                                var error = jqXHR.errorMessage;
                            },
                            success: function (data, jqXHR, textStatus) {
                                decoders[group](category, data);
                            }
                        });
                    } else {
                        decoders[group](category, appointmentAPI.getDirectData());
                    }
                })(appointmentAPI, group, index);
            }
        }
    
        notification.initialize();

        $('.notification-switch').each(function () {
            notification.setSwitch(this);
        });
    },

    tabs: {},

    appoint: function (clickedInput) {
        var $clickedInput = $(clickedInput);
        var newURL = $clickedInput.attr('href');
        var type = $clickedInput.attr('form-type');
        var time = $clickedInput.attr('time');
        appointment.selectedTime = time;
        $('.waiting').fadeIn('fast', function () {
            var newTab = chrome.tabs.create({
                url: newURL,
                active: false
            }, function (tab) {
                appointment.tabs[tab.id] = {
                    id: tab.id,
                    type: type
                };
            });
        });
    }
};

var decoders = {
    getPreset: function (callback) {
        decoders.presets
        && decoders.irp && decoders.irp.loaded
        && decoders.visa && decoders.visa.loaded
        || decoders._getPresetCallbacks && !decoders._getPresetCallbacks.length
        ? callback(decoders.presets)
        : (function () {
            if (!decoders._getPresetCallbacks) {
                decoders._getPresetCallbacks = [callback];
                decoders.presets = {};

                var retrieveData = function (key, callback) {
                    decoders.presets[key] = {};
                    formStorage.retrieve(key + '-form-preset', function (data) {
                        if (data) {
                            data.forEach(inputData => {
                                decoders.presets[key][inputData.id] = inputData.value;
                            });
                            decoders.presets[key].loaded = true;
                        }
                        callback();
                    });
                };

                retrieveData('irp', function () {
                    retrieveData('visa', function () {
                        var callback;
                        while (callback = decoders._getPresetCallbacks.shift()) {
                            callback(decoders.presets);
                        }
                    });
                });
            } else {
                decoders._getPresetCallbacks.push(callback);
            }
        }());
    },

    _getAppointmentDiv: function (type, time, isPreset, url) {
        var appointmentElement = document.createElement('div');
        appointmentElement.setAttribute('class', 'appointment');

        var appointmentContent = isPreset
        ? document.createElement('a')
        : document.createElement('span');

        if (isPreset) {
            appointmentContent.setAttribute('href', url);
            appointmentContent.setAttribute('form-type', type);
            appointmentContent.setAttribute('target', '_blank');
            appointmentContent.setAttribute('time', time);
            $(appointmentContent).click(function () {
                window.appointment.appoint(this);
                return false;
            })
        }

        appointmentContent.innerHTML = time;
        appointmentElement.appendChild(appointmentContent);

        return appointmentElement;
    },

    visa: function (type, data) {
        decoders.getPreset(function (presets) {
            var $list = decoders.$lists['visa'] || (decoders.$lists['visa'] = $('.visas .list'));

            if (data.dates && data.dates.length && data.dates[0] != "01/01/1900") {
                var isPreset = presets.visa.AppointType == type;

                var $types = decoders.$getTypeGroup($list, type);
                for (var index in data.dates) {
                    var date = data.dates[index];

                    statusControl.addLoading('visa');
                    $.ajax({
                        url: appointmentAPIs.getVisaAppointmentTimeOfDateAPI(date, type[0], 1),
                        success: function (data) {
                            data && data.slots && data.slots.forEach(slot => {
                                $types.append(decoders._getAppointmentDiv('visa', slot.time, isPreset, 'https://reentryvisa.inis.gov.ie/website/INISOA/IOA.nsf/AppointmentSelection?OpenForm'));
                            });

                            statusControl.removeLoading('visa');
                        }
                    });
                }
            }

            statusControl.removeLoading('visa');
        });
    },

    irp: function (type, data) {
        decoders.getPreset(function (presets) {
            var $list = decoders.$lists['irp'] || (decoders.$lists['irp'] = $('.irps .list'));

            if (data.slots && data.slots.length) {
                var isPreset = presets.irp.Category
                && presets.irp.ConfirmGNIB
                && type == presets.irp.Category + '-' + presets.irp.ConfirmGNIB;
                
                var $types = decoders.$getTypeGroup($list, type);
                for (var index in data.slots) {
                    var appointment = data.slots[index];
                    
                    $types.append(decoders._getAppointmentDiv('irp', appointment.time, isPreset, 'https://burghquayregistrationoffice.inis.gov.ie/Website/AMSREG/AMSRegWeb.nsf/AppSelect?OpenForm&selected=true'));
                }
            }

            statusControl.removeLoading('irp');
        });
    },

    $lists: {},

    $getTypeGroup: function ($list, type) {
        if (!$list.find('[type=' + type + ']').length) {
            !$list.append('<div class="typegroup" type="' + type + '"><div class="type">' + type + '</div></div>');
        }

        return $list.find('[type=' + type + ']');
    }
};

var statusControl = {
    loadings: {},
    addLoading: function (group) {
        statusControl.loadings[group] = (statusControl.loadings[group] || 0) + 1;
    },
    removeLoading: function (group) {
        statusControl.loadings[group]--;

        if (!statusControl.loadings[group]) {
            var listSelector = '.' + group + 's .list';
            $(listSelector + ' .loading').remove();

            if (!$(listSelector + ' .appointment').length) {
                $(listSelector).append('<div class="empty">There\'s no valid appointment.');
            }
        }
    }
};

var injectFiles = [
    'Content/jquery-3.3.1.min.js',
    'Content/form-assistant.js',
    'Content/form-injected.js',
    'Content/form-storage.js',
    'Content/preset.js'
];

$(document).ready(function () {
    appointment.initialize();
});