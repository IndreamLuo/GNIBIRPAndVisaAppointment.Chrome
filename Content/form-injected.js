var autoForm = {
    completes: [],

    onComplete: function (callback) {
        autoForm.completes.push(callback);
    },

    complete: function () {
        var callback;
        while(callback = autoForm.completes.shift()) {
            callback();
        }
    }
}

$(document).ready(function () {
    if (typeof btSrch4Apps != 'undefined') {
        formAssistant.run(function () {
            $(btSrch4Apps).click(function () {
                if (selectedTime) {
                    var interval = setInterval(function () {
                        if ($(dvAppOptions).css('display') == 'block') {
                            selectedTime && $("td:contains(" + selectedTime + ")").parent().find("button").click();
                            clearInterval(interval);
                        }
                    });
                }
            });
        });
    } else if (selectedTime && typeof Appdate != 'undefined') {
        //Select time
        formAssistant.run(function () {
            $(AppointType).change(function () {
                Appdate.value = selectedTime;
                $(Appdate).change();
            });
        });

        //Click 'Find Appointment Slot'
        autoForm.onComplete(function () {
            formAssistant.run(function () {
                $('button[onclick*=getAvailApps]').click();
            });
        });
    }
});