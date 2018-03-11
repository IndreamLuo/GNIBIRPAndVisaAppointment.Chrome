$(document).ready(function () {
    if (typeof btSrch4Apps != 'undefined')
    {
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
    }
});