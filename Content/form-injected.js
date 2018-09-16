var autoForm = {
    presetFormType: null,

    selectedTime: null,

    isTimeSet: false,

    timeSets: [],

    onTimeSet: function (callback) {
        autoForm.isTimeSet
        ? callback()
        : autoForm.timeSets.push(callback);
    },

    timeSet: function () {
        var callback;
        while(callback = autoForm.timeSets.shift()) {
            callback();
        }
        autoForm.isTimeSet = true;
    },

    IsCompleted: false,

    completes: [],

    onComplete: function (callback) {
        autoForm.IsCompleted
        ? callback()
        : autoForm.completes.push(callback);
    },

    complete: function () {
        var callback;
        while(callback = autoForm.completes.shift()) {
            callback();
        }
        autoForm.IsCompleted = true;
    }
}

var messageListener = function (request, sender, sendResponse) {
    if (request.presetFormType) {
        autoForm.presetFormType = request.presetFormType;
        autoForm.selectedTime = request.selectedTime;

        formAssistant.applyScript("var selectedTime = 'autoForm.selectedTime'".replace("autoForm.selectedTime", autoForm.selectedTime));
        autoForm.timeSet();

        sendResponse();
    }
};

!chrome.runtime.onMessage.hasListener(messageListener)
&& chrome.runtime.onMessage.addListener(messageListener);


var url = new URL(window.location.href);
if (url.searchParams.get('proxy')) {

    appointment.getNewestAppointments(function (group) {
        chrome.runtime.sendMessage({
            appointmentLoad: 'addLoading',
            group: group
        });
    }, function (group, category, data) {
        chrome.runtime.sendMessage({
            appointmentLoad: 'loaded',
            group: group,
            category: category,
            data: data
        });
    });

} else {
    $(document).ready(function () {
        autoForm.onComplete(function () {
            chrome.runtime.sendMessage({
                autoFormCompleted: true
            });
        });
    
        var logoUrl = chrome.runtime.getURL("icon.png");
    
        var logo = document.createElement('img');
        $(logo)
            .attr('src', logoUrl)
            .addClass('gnibirpvisa-logo');
    
        var releaseFindAppointmentButton = document.createElement('button');
        $(releaseFindAppointmentButton)
            .addClass('btn btn-warning release-find')
            .append(logo)
            .append('Release the Find button!')
            .click(function () {
                $(btSrch4Apps).prop('disabled', false);
                return false;
            });
     
        $(dvSelectSrch)
            .append(releaseFindAppointmentButton);

        var $toggleFooter = $('<a href="#" class="btn btn-dark toggle-footer"></a>')
            .append($(logo).clone())
            .append('Hide/Show Fottor')
            .click(function () {
                $('.footer').toggle();
                return false;
            });
        $('.footer-v1').before($toggleFooter);
    
        autoForm.onTimeSet(function () {
            if (typeof btSrch4Apps != 'undefined') {
                formAssistant.run(function () {
                    $(btSrch4Apps).click(function () {
                        var interval; var hello;
    
                        selectedTime
                        && (interval = setInterval(function () {
                            if ($(dvAppOptions).css('display') == 'block') {
                                selectedTime && $("td:contains(" + selectedTime + ")").parent().find("button").click();
                                clearInterval(interval);
                            }
                        }));
                    });
                });
            } else if (selectedTime && typeof Appdate != 'undefined') {
                //Click 'Find Appointment Slot'
                formAssistant.run(function () {
                    if (AppointType.value) {
                        //Select date
                        var selectedDate = selectedTime.substring(0, 10);
                        Appdate.value = selectedDate;
                        $(Appdate).change();
                        //Click search
                        $('button[onclick*=getAvailApps]').click();
                        var interval = setInterval(function () {
                            if ($(dvAppOptions).css('display') == 'block') {
                                selectedTime && $("td:contains(" + selectedTime + ")").parent().find("button").click();
                                clearInterval(interval);
                            }
                        });
                    }
                });
            }
        });
    });
}