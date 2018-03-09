var decoders = {
    visa: function (type, data) {
        var $list = decoders.$lists['visa'] || (decoders.$lists['visa'] = $('.visas .list'));

        if (data.dates && data.dates.length && data.dates[0] != "01/01/1900") {
            var $types = decoders.$getTypeGroup($list, type);
            for (var index in data.dates) {
                var appointment = data.dates[index];
                $types
                    .append('<div class="appointment">' + appointment + '</div>');
            }
        }
    },
    irp: function (type, data) {
        var $list = decoders.$lists['irp'] || (decoders.$lists['irp'] = $('.irps .list'));

        if (data.slots && data.slots.length) {
            var $types = decoders.$getTypeGroup($list, type);
            for (var index in data.slots) {
                var appointment = data.slots[index];
                $types
                    .append('<div class="appointment">' + appointment.time + '</div>');
            }
        }
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
        var listSelector = '.' + group + 's .list';
        $(listSelector + ' .loading').remove();
        statusControl.loadings[group]--;

        if (!statusControl.loadings[group] && !$(listSelector + ' .appointment').length) {
            $(listSelector).append('<div class="empty">There\'s no valid appointment.');
        }
    }
};

var groups = {
    visa: 'visa',
    irp: 'irp'
};

var targets = [{
    type: 'Individual',
    url: 'https://reentryvisa.inis.gov.ie/website/INISOA/IOA.nsf/(getDTAvail)?openagent&type=I',
    group: groups.visa
}, {
    type: 'Family',
    url: 'https://reentryvisa.inis.gov.ie/website/INISOA/IOA.nsf/(getDTAvail)?openagent&type=F',
    group: groups.visa
}, {
    type: "Work-New",
    url: "https://burghquayregistrationoffice.inis.gov.ie/Website/AMSREG/AMSRegWeb.nsf/(getAppsNear)?openpage&cat=Work&sbcat=All&typ=New",
    group: groups.irp
}, {
    type: "Work-Renewal",
    url: "https://burghquayregistrationoffice.inis.gov.ie/Website/AMSREG/AMSRegWeb.nsf/(getAppsNear)?openpage&cat=Work&sbcat=All&typ=Renewal",
    group: groups.irp
}, {
    type: "Study-New",
    url: "https://burghquayregistrationoffice.inis.gov.ie/Website/AMSREG/AMSRegWeb.nsf/(getAppsNear)?openpage&cat=Study&sbcat=All&typ=New",
    group: groups.irp
}, {
    type: "Study-Renewal",
    url: "https://burghquayregistrationoffice.inis.gov.ie/Website/AMSREG/AMSRegWeb.nsf/(getAppsNear)?openpage&cat=Study&sbcat=All&typ=Renewal",
    group: groups.irp
}, {
    type: "Other-New",
    url: "https://burghquayregistrationoffice.inis.gov.ie/Website/AMSREG/AMSRegWeb.nsf/(getAppsNear)?openpage&cat=Other&sbcat=All&typ=New",
    group: groups.irp
}, {
    type: "Other-Renewal",
    url: "https://burghquayregistrationoffice.inis.gov.ie/Website/AMSREG/AMSRegWeb.nsf/(getAppsNear)?openpage&cat=Other&sbcat=All&typ=Renewal",
    group: groups.irp
}];

var injectFiles = [
    'Content/jquery-3.3.1.min.js',
    'Content/form-assistant.js'
];

$(document).ready(function () {
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        if (changeInfo.status == 'complete') {
            var fileIndex = 0;
            var injectFile = function () {
                chrome.tabs.executeScript(tab.id, {
                    file: injectFiles[fileIndex++]
                }, function (result) {
                    injectFiles[fileIndex]
                    && !injectFile()
                    || (function () {
                        chrome.tabs.update(tab.id, {
                            active: true
                        });
                    })();
                });
            }

            injectFile();
        }
    });

    $('.group .appoint').click(function () {
        var newURL = $(this).attr('href');
        var newTab = chrome.tabs.create({
            url: newURL,
            active: false
        }, function (tab) {
        });
        return false;
    });

    for (var index in targets) {
        var target = targets[index];
        statusControl.addLoading(target.group);
        (function (target) {
            $.ajax({
                url: target.url,
                type: "GET",
                error: function (jqXHR, textStatus, errorThrown) {
                    var error = jqXHR.errorMessage;
                },
                success: function (data, jqXHR, textStatus) {
                    decoders[target.group](target.type, data);
                    statusControl.removeLoading(target.group);
                }
            });
        })(target);
    }
});