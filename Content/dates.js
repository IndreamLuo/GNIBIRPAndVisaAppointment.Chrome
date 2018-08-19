var dates = {
    today: new Date(),
    
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    irpSlotTimeFormat: 'day monthWord year roundedHour:minute',
    visaSlotTimeFormat: 'day/month/year hour:minute round',
    serviceTimeFormat: 'month/day/year hour:minute:second round',

    fromIRPSlotTime: function (slotTime) {
        var splits = slotTime.split(/[ :]/);
        var day = parseInt(splits[0]);
        var month = dates.months.indexOf(splits[1]);
        var year = parseInt(splits[2]);
        var hourRounded = parseInt(splits[3]);
        var minute = parseInt(splits[4]);

        return new Date(year, month, day, hourRounded, minute);
    },

    toIRPSlotTime: function (time) {
        return dates.toFormattedTime(time, dates.irpSlotTimeFormat);
    },

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

    toVisaSlotTime: function (time) {
        return dates.toFormattedTime(time, dates.visaSlotTimeFormat);
    },

    fromServiceTime: function (serviceTime) {
        var splits = serviceTime.split(/[/ :]/);
        var day = parseInt(splits[1]);
        var month = parseInt(splits[0]);
        var year = parseInt(splits[2]);
        var hour = parseInt(splits[3]);
        var minute = parseInt(splits[4]);
        var second = parseInt(splits[5]);
        var round = splits[6] == 'AM' ? 0 : 12;
        return new Date(year, month, day, hour + round, minute, second);
    },

    toServiceTime: function (time) {
        return dates.toFormattedTime(time, dates.serviceTimeFormat);
    },

    toFormattedTime: function (time, format) {
        var toFixedHourMinute = function (number) {
            return number < 10 ? '0' + number : number;
        }

        var year = time.getFullYear();
        var month = time.getMonth() + 1;
        var monthWord = dates.months[time.getMonth()];
        var day = time.getDate();
        var roundedHour = toFixedHourMinute(time.getHours());
        var hour = toFixedHourMinute(roundedHour == 12 ? roundedHour : (roundedHour % 12));
        var round = roundedHour >= 12;
        var minute = toFixedHourMinute(time.getMinutes());
        var second = toFixedHourMinute(time.getSeconds());

        return format
        .replace('year', year)
        .replace('monthWord', monthWord)
        .replace('month', month)
        .replace('day', day)
        .replace('roundedHour', roundedHour)
        .replace('hour', hour)
        .replace('minute', minute)
        .replace('second', second)
        .replace('round', round);
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