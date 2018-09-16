var decoders = {
    _getAppointmentDiv: function (type, time, isPreset, url) {
        var appointmentElement = document.createElement('div');
        appointmentElement.setAttribute('class', 'appointment');

        var appointmentContent = isPreset
        ? document.createElement('a')
        : document.createElement('span');

        appointmentContent.setAttribute('href', url);
        appointmentContent.setAttribute('form-type', type);
        appointmentContent.setAttribute('target', '_blank');
        appointmentContent.setAttribute('time', time);
        $(appointmentContent)
            .click(function () {
                appointment.appoint(type, time);
                return false;
            });

        appointmentContent.innerHTML = time;
        appointmentElement.appendChild(appointmentContent);

        return appointmentElement;
    },

    visa: function (type, data) {
        preset.getPreset(function (presets) {
            var $list = decoders.$lists['visa'] || (decoders.$lists['visa'] = $('.visa'));

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
        preset.getPreset(function (presets) {
            var $list = decoders.$lists['irp'] || (decoders.$lists['irp'] = $('.irp'));
            var $types = decoders.$getTypeGroup($list, type);

            if (data.slots && data.slots.length) {
                var isPreset = presets.irp.Category
                && presets.irp.ConfirmGNIB
                && type == presets.irp.Category + '-' + presets.irp.ConfirmGNIB;
                
                for (var index in data.slots) {
                    var appointment = data.slots[index];
                    $types.append(decoders._getAppointmentDiv('irp', appointment.time, isPreset, 'https://burghquayregistrationoffice.inis.gov.ie/Website/AMSREG/AMSRegWeb.nsf/AppSelect?OpenForm&selected=true'));
                }
            } else {
                $types.append('<span class="no-valid">No valid</span>');
            }

            statusControl.removeLoading('irp');
        });
    },

    $lists: {},

    $getTypeGroup: function ($list, type) {
        return $list.find('.' + type);

        if (!$list.find('[type=' + type + ']').length) {
            !$list.append('<div class="typegroup" type="' + type + '"><div class="type">' + type + '</div></div>');
        }

        return $list.find('[type=' + type + ']');
    }
};

var statusControl = {
    itemsCount: {},
    loadings: {},
    addLoading: function (group) {
        statusControl.loadings[group] = (statusControl.loadings[group] || 0) + 1;
        statusControl.itemsCount[group] = (statusControl.itemsCount[group] || 0) + 1;
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

$(document).ready(function () {    
    var oldAppoint = appointment.appoint;
    appointment.appoint = function(type, time) {
        $('.waiting').fadeIn('fast', function () {
            oldAppoint(type, time);
        });
    };

    $('a[class*=appoint]').click(function () {
        var $clickedInput = $(this);
        var type = $clickedInput.attr('form-type');
        var time = $clickedInput.attr('time');
        appointment.appoint(type, time);
        
        return false;
    });

    var loaded = 0;
    var apiCount = 6;
    $('.progress-bar').width(1 / (apiCount + 1) * 100 + '%');

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.appointmentLoad == 'addLoading') {
            statusControl.addLoading(request.group);
        } else if (request.appointmentLoad == 'loaded') {
            if (request.group == 'irp') {
                $('.progress-bar').width((++loaded + 1) /  (apiCount + 1) * 100 + '%');
                if (loaded == 2) {
                    $('.progress-bar').removeClass('bg-danger').addClass('bg-warning');
                } if (loaded == 5) {
                    $('.progress-bar').removeClass('bg-warning').addClass('bg-primary');
                } else if (loaded == 6) {
                    $('.progress-bar').removeClass('bg-primary').addClass('bg-success');
                }
            }
            decoders[request.group](request.category, request.data);
        }
    });

    // appointment.getNewestAppointments(function (group) {
    //     statusControl.addLoading(group);
    // }, function (group, category, data) {
    //     if (group == 'irp') {
    //         $('.progress-bar').width((++loaded + 1) /  (apiCount + 1) * 100 + '%');
    //         if (loaded == 2) {
    //             $('.progress-bar').removeClass('bg-danger').addClass('bg-warning');
    //         } if (loaded == 5) {
    //             $('.progress-bar').removeClass('bg-warning').addClass('bg-primary');
    //         } else if (loaded == 6) {
    //             $('.progress-bar').removeClass('bg-primary').addClass('bg-success');
    //         }
    //     }
    //     decoders[group](category, data);
    // });

    $('.notification-switch').each(function () {
        notification.setSwitch(this);
    });

    tutorial.initialize();

    $('.tutorial-play').click(function () {
        tutorial.play({
            slides: [{
                $item: $('.table'),
                description: 'The table shows current available appointments. "No valid" when no available appointment.'
            }, {
                $item: $('.preset'),
                description: 'Use Preset to save your application before appointment.'
            }, {
                $item: $('.appoint'),
                description: 'When you click appoint after Preset, the Preset content will be filled in for you automatically.'
            }, {
                $item: $('.table tbody tr td'),
                description: 'The available appointment in the category you selected in Preset will be highlighted and clickable. Clicking it will open the application form with the time selected.'
            }, {
                $item: $('.custom-checkbox'),
                description: 'After Preset, the notification for your category will be available. Clicking the popup notification gives you quick access to the newest available appointment also with the time selected.'
            }, {
                $item: $('.donate'),
                fixed: true,
                description: 'This is an open source project, feel free to find the code source in Donate page and your donation will be very appreciated.'
            }]
        });
    });
});