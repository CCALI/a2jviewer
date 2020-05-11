import { assert } from 'chai'
import moment from 'moment'
import cDate from 'caja/viewer/mobile/util/date'

describe('util: date', function () {
  let testDate

  beforeEach(function () {
    testDate = moment('02/28/1970', 'MM/DD/YYYY')
  })

  describe('swapMonthAndDay', function () {
    it('returns mm/dd/yyyy if given dd/mm/yyyy', function () {
      let usDate = '02/24/1980'
      let britDate = cDate.swapMonthAndDay(usDate)
      assert.equal(britDate, '24/02/1980', 'failed to create brit date')
    })

    it('returns dd/mm/yyyy if given mm/dd/yyyy', function () {
      let britDate = '17/04/1988'
      let usDate = cDate.swapMonthAndDay(britDate)
      assert.equal(usDate, '04/17/1988', 'failed to create US date')
    })
  })

  describe('dateToString', function () {
    it('should return a string date given a moment object', function () {
      let stringDate = cDate.dateToString(testDate)

      assert.equal(stringDate, '02/28/1970', 'did not format moment date')
    })

    it('should handle number of days since epoch', function () {
      let numDays = 58 // '02/28/1970'
      let stringDate = cDate.dateToString(numDays)

      assert.equal(stringDate, '02/28/1970', 'did not format days since epoch')
    })

    it('should handle a string date', function () {
      let sourceString = '02/28/1970'
      let stringDate = cDate.dateToString(sourceString)

      assert.equal(stringDate, '02/28/1970', 'did not format string to string')
    })

    it('should re-format a string date to new format', function () {
      let sourceString = '02/12/1970'
      let stringDate = cDate.dateToString(sourceString, 'DD-MM-YYYY')

      assert.equal(stringDate, '12-02-1970', 'did not format string to new string format')
    })
  })

  describe('dateToDays', function () {
    it('should convert a moment object to days since epoch', function () {
      let numDays = cDate.dateToDays(testDate) // 58

      assert.equal(numDays, 58, 'failed to convert moment object to days')
    })

    it('should also convert a string date to days', function () {
      let stringDate = '02/28/1970'
      let numDays = cDate.dateToDays(stringDate)

      assert.equal(numDays, 58, 'did not handle string date')
    })
  })

  describe('daysToDate', function () {
    it('should convert days since epoch to a moment object', function () {
      let numDays = 58
      let date = cDate.daysToDate(numDays)

      assert.equal(date._isAMomentObject, true, 'did not return a moment object')
      assert.equal(date.format('MM/DD/YYYY'), '02/28/1970', 'date from days did not match')
    })
  })

  describe('dateDiff', function () {
    it('should return a positive number of days when most recent date is first', function () {
      let endDate = moment('01/01/1970')
      let daysDiff = cDate.dateDiff(testDate, endDate)

      assert.equal(daysDiff, 58, 'failed to compute number of days')
    })

    it('should return a negative number of days when most recent date is second', function () {
      let endDate = moment('01/01/1970')
      let daysDiff = cDate.dateDiff(endDate, testDate)

      assert.equal(daysDiff, -58, 'failed to compute negative number of days')
    })

    it('should return number of years if passed 3rd param "years"', function () {
      let endDate = moment('01/01/2000')
      let startDate = moment('01/01/2010')
      let yearsDiff = cDate.dateDiff(startDate, endDate, 'years')

      assert.equal(yearsDiff, 10, 'did not compute 10 years')
    })
  })
})
