import moment from 'moment'

/*
    A2J Dates are strings when being displayed or stored as answers,
    number of days since epoch ('01/01/1970') for math operations in A2J expresions ([todaysDate] + 90 )
    and kept as moment objects when being passed between internal functions.

    It should be noted that LHI's HotDocs server expects answer values to be british strings aka ('01/12/1980') for Dec 1st, 1980
    Saved answers are flipped from US dates to British, and flipped back when saved answers are loaded ('12/01/1980').

    To help manage all the date conversion back and forth, we now use momentJS for formatting, conversion, and future
    internationalization
*/

const epoch = moment('1970-01-01 00:00:00')

export default {
  // LHI uses british dates in HotDocs. This converts in both directions
  swapMonthAndDay: function (stringDate) {
    var result = ''

    if (stringDate && typeof stringDate === 'string') {
      var parts = stringDate.split('/')
      result = parts[1] + '/' + parts[0] + '/' + parts[2]
    }

    return result
  },

  // used for display and to save answers
  // takes optional format string
  dateToString: function (date, format) {
    format = format || 'MM/DD/YYYY'
    // moment doesn't handle days since epoch by default
    if (typeof date === 'number') {
      date = this.daysToDate(date)
    }

    return moment(date).format(format)
  },

  // used to get days since epoch as the A2J parser expects days for math operations, ie: [bDay] + 30
  // `date` can be a string date, or moment date
  dateToDays: function (date) {
    return this.dateDiff(date, epoch, 'days')
  },

  // used to reconvert number of days since epoch to a moment date object
  daysToDate: function (numDays) {
    return moment(epoch).add(numDays, 'days')
  },

  // will be formatted before display/save or changed to number for calculations
  todaysDate: function () {
    return moment()
  },

  // startDate - string or moment object
  // endDate - string or moment object
  // unitOfMeasure - string ex: 'years' or 'days'
  // Returns positive values when startDate is most recent date, negative if reversed
  // ex: dateDiff('01-01-2000', '01-01-1970', 'years') returns the number 30
  dateDiff: function (startDate, endDate, unitOfMeasure) {
    unitOfMeasure = typeof unitOfMeasure === 'string' ? unitOfMeasure : 'days'
    // diff can be negative for pre-epoch dates
    return moment(startDate).diff(moment(endDate), unitOfMeasure)
  }

}
