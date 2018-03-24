var dates = {
    today: new Date(),

    fromVisaSlotTime: function (slotTime) {
        var day = parseInt(slotTime.substring(0, 2));
        var month = parseInt(slotTime.substring(3, 5)) - 1;
        var year = parseInt(slotTime.substring(6, 10));

        if (slotTime.length > 10) {
            var hour = parseInt(slotTime.substring(11, 13));
            var minute = parseInt(slotTime.substring(14, 16));
            var round = slotTime.substring(17, 19) == 'AM' ? 0 : 12;
            return new Date(year, month, day, hour + round, minute);
        }

        return new Date(year, month, day);
    },

    getMonths: function (year) {
        var getMonthsForYear= function (leap) {
            var yearMonthsName = (leap && 'leap' || 'normal') + 'YearMonths';

            if (dates[yearMonthsName]) {
                return dates[yearMonthsName];
            }

            var getMonthDays = function (daysNumber) {
                return dates['month' + daysNumber] || (dates['month' + daysNumber] = dates._getNumberArray(1, daysNumber));
            }

            var months = {};
            for (var month = 1; month <= 12; month++) {
                months['' + month] =
                    dates.months31.includes(month)
                        && getMonthDays(31)
                    || month == 2 && getMonthDays(28 + (leap && 1))
                    || getMonthDays(30);
            }

            return dates[yearMonthsName] = months;
        }

        return (year % 4 || !(year % 100) && year % 400 || !(year % 3200))
        && getMonthsForYear(false)
        || getMonthsForYear(true);
    },

    months31: [1, 3, 5, 7, 8, 10, 12],

    _getNumberArray: function (start, end) {
        var array = [];
    
        for (var i = start;
            start < end && i <= end || start >= end && i >= end;
            i += start < end && 1 || -1) {
            array.push(i);
        }
    
        return array;
    }
}

dates.years = dates._getNumberArray(2020, 1875);