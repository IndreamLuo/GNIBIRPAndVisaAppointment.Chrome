var decoders = {
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
                appointment.appoint(type, time);
                return false;
            })
        }

        appointmentContent.innerHTML = time;
        appointmentElement.appendChild(appointmentContent);

        return appointmentElement;
    },

    visa: function (type, data) {
        preset.getPreset(function (presets) {
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
        preset.getPreset(function (presets) {
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

$(document).ready(function () {
    $('a[class*=appoint]').click(function () {
        var $clickedInput = $(this);
        var type = $clickedInput.attr('form-type');
        var time = $clickedInput.attr('time');
        $('.waiting').fadeIn('fast', function () {
            appointment.appoint(type, time);
        });
        
        return false;
    });

    appointment.getNewestAppointments(function (group) {
        statusControl.addLoading(group);
    }, function (group, category, data) {
        decoders[group](category, data);
    });

    $('.notification-switch').each(function () {
        notification.setSwitch(this);
    });
});