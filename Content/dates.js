var dates = {
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