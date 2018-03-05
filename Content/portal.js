var decoders = {
    visa: function (type, data) {
        if (data.dates && data.dates.length && data.dates[0] != "01/01/1900") {
            var $types = decoders.$getTypeGroup($('.visas .list'), type);
            for (var index in data.dates) {
                var appointment = data.dates[index];
                $types
                    .append('<div class="appointment">' + appointment + '</div>');
            }
        }
    },
    irp: function (type, data) {
        if (data.slots && data.slots.length) {
            var $types = decoders.$getTypeGroup($('.irps .list'), type);
            for (var index in data.slots) {
                var appointment = data.slots[index];
                $types
                    .append('<div class="appointment">' + appointment.time + '</div>');
            }
        }
    },
    $getTypeGroup: function ($list, type) {
        if (!$list.find('[type=' + type + ']').length) {
            !$list.append('<div class="typegroup" type="' + type + '"><div class="type">' + type + '</div></div>');
        }

        return $list.find('[type=' + type + ']');
    }
};

var targets = [{
    type: 'Individual',
    url: 'https://reentryvisa.inis.gov.ie/website/INISOA/IOA.nsf/(getDTAvail)?openagent&type=I',
    decode: decoders.visa
}, {
    type: 'Family',
    url: 'https://reentryvisa.inis.gov.ie/website/INISOA/IOA.nsf/(getDTAvail)?openagent&type=F',
    decode: decoders.visa
}, {
    type: "Work-New",
    url: "https://burghquayregistrationoffice.inis.gov.ie/Website/AMSREG/AMSRegWeb.nsf/(getAppsNear)?openpage&cat=Work&sbcat=All&typ=New",
    decode: decoders.irp
}, {
    type: "Work-Renewal",
    url: "https://burghquayregistrationoffice.inis.gov.ie/Website/AMSREG/AMSRegWeb.nsf/(getAppsNear)?openpage&cat=Work&sbcat=All&typ=Renewal",
    decode: decoders.irp
}, {
    type: "Study-New",
    url: "https://burghquayregistrationoffice.inis.gov.ie/Website/AMSREG/AMSRegWeb.nsf/(getAppsNear)?openpage&cat=Study&sbcat=All&typ=New",
    decode: decoders.irp
}, {
    type: "Study-Renewal",
    url: "https://burghquayregistrationoffice.inis.gov.ie/Website/AMSREG/AMSRegWeb.nsf/(getAppsNear)?openpage&cat=Study&sbcat=All&typ=Renewal",
    decode: decoders.irp
}, {
    type: "Other-New",
    url: "https://burghquayregistrationoffice.inis.gov.ie/Website/AMSREG/AMSRegWeb.nsf/(getAppsNear)?openpage&cat=Other&sbcat=All&typ=New",
    decode: decoders.irp
}, {
    type: "Other-Renewal",
    url: "https://burghquayregistrationoffice.inis.gov.ie/Website/AMSREG/AMSRegWeb.nsf/(getAppsNear)?openpage&cat=Other&sbcat=All&typ=Renewal",
    decode: decoders.irp
}];

$(document).ready(function () {
    for (var index in targets) {
        var target = targets[index];
        (function (target) {
            $.ajax({
                url: target.url,
                type: "GET",
                error: function (jqXHR, textStatus, errorThrown) {
                    var error = jqXHR.errorMessage;
                },
                success: function (data, jqXHR, textStatus) {
                    target.decode(target.type, data);
                }
            });
        })(target);
    }
});