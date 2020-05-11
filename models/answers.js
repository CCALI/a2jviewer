import $ from 'jquery'
import CanMap from 'can-map'
import Model from 'can-model'
import _find from 'lodash/find'
import CONST from 'caja/viewer/models/constants'
import cString from 'caja/viewer/mobile/util/string'
import cDate from 'caja/viewer/mobile/util/date'
import readableList from 'caja/viewer/util/readable-list'

import 'can-map-define'

export default Model.extend('AnswersModel', {}, {
  define: {
    lang: {
      serialize: function () {

      }
    }
  },

  varExists: function (prop) {
    prop = $.trim(prop).toLowerCase()

    let keys = CanMap.keys(this)

    let key = _find(keys, function (k) {
      return k.toLowerCase() === prop
    })

    let v

    if (key) {
      v = this.attr(key)

      if (!v.attr('values')) {
        v.attr('values', [null])
      }
    }

    return typeof v === 'undefined' ? null : v
  },

  varCreate: function (varName, varType, varRepeat) {
    this.attr(varName.toLowerCase(), {
      name: varName,
      repeating: varRepeat,
      type: varType,
      values: [null]
    })

    return this.attr(varName.toLowerCase())
  },

  varGet: function (varName, varIndex, opts) {
    var v = this.varExists(varName)

    if (!v) return undefined

    if (typeof varIndex === 'undefined' || varIndex === null || varIndex === '') {
      if (v.repeating) {
        // Repeating variable without an index returns a readable list for display
        return readableList(v.values, this.attr('lang'))
      }

      varIndex = 1
    }

    var val = v.values[varIndex]

    switch (v.type) {
      case CONST.vtNumber:
        if (opts && opts.num2num === true) {
          // Handle text numbers with commas and decimals
          // zero is edge case that returns itself
          if (val !== 0) {
            val = cString.textToNumber(val)
          }
        }

        break

      case CONST.vtDate:
        if (opts && opts.date2num === true) {
          // For calculations like comparing dates or adding days we convert date to number,
          //  daysSince1970, like A2J 4.
          if (val) {
            // 11/28/06 If date is blank DON'T convert to number.
            // this number represents the date as days since epoch, '01/01/1970'
            val = cDate.dateToDays(val)
          }
        }

        break

      case CONST.vtText:
        if (opts && opts.date2num === true && cString.ismdy(val)) {
          // If it's a date type or looks like a date type, convert to number of days.
          // Why is this needed? TODO:
          val = cDate.dateToDays(val)
        }

        break

      case CONST.vtTF:
        if (typeof val === 'string') {
          val = val.toLowerCase() === 'true'
        }
        break
    }

    return val
  },

  varSet: function (varName, varVal, varIndex) {
    let v = this.varExists(varName)

    if (v === null) {
      // Create variable at runtime
      v = this.varCreate(varName, CONST.vtText,
        !((typeof varIndex === 'undefined') || (varIndex === null) ||
          (varIndex === '') || (varIndex === 0)), '')
    }

    if ((typeof varIndex === 'undefined') || (varIndex === null) || (varIndex === '')) {
      varIndex = 0
    }

    // Handle type conversion, like number to date and null to proper `notanswered` values.
    switch (v.attr('type')) {
      case CONST.vtDate:
        if (typeof varVal === 'number') {
          // this can take a second format param. default is 'MM/DD/YYYY' if no second param sent
          varVal = cDate.dateToString(varVal)
        }
        break
      case CONST.vtText:
        if (varVal === null) {
          varVal = ''
        }
        break
      case CONST.vtTF:
        if (typeof varVal !== 'boolean') {
          varVal = undefined
        }
        break
    }

    // Reset all values or set new single value
    if (varIndex === 0 && varVal === null) {
      v.attr('values', [null])
    } else if (varIndex === 0) {
      v.attr('values.1', varVal)
    } else {
      v.attr('values.' + varIndex, varVal)
    }
  }
})
