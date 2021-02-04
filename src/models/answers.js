import DefineMap from 'can-define/map/map'
import Answer from '~/src/models/answer'
import canReflect from 'can-reflect'
import CONST from '~/src/models/constants'
import cString from '@caliorg/a2jdeps/utils/string'
import cDate from '@caliorg/a2jdeps/utils/date'
import readableList from '~/src/util/readable-list'

// TODO: move dynamic answers to an internal list so we don't need seal:false
// see varCreate below where new props are assigned
export default DefineMap.extend('AnswersModel', { seal: false }, {
  lang: { // TODO: figure out why this is set to not serialize aka is it bound to the router
    serialize: false
  },

  varExists: function (prop) {
    const key = prop.trim().toLowerCase()
    const hasKey = canReflect.hasOwnKey(this, key)

    if (hasKey) {
      const varAnswerModel = this[key]
      // TODO: all answers should be answerModels and won't need this values check
      if (!varAnswerModel.values) {
        varAnswerModel.values = [null]
      }

      return varAnswerModel
    } else {
      return null
    }
  },

  varCreate: function (varName, varType, varRepeat) {
    // TODO: this should handle missing params, possibly wrong order as well
    const varNameKey = varName.toLowerCase()
    this.assign({
      [varNameKey]: new Answer({
        name: varName,
        repeating: varRepeat,
        type: varType,
        values: [null]
      })
    })

    return this[varNameKey]
  },

  varGet: function (varName, varIndex, opts) {
    let varAnswerModel = this.varExists(varName)

    if (!varAnswerModel) return undefined

    if (typeof varIndex === 'undefined' || varIndex === null || varIndex === '') {
      if (varAnswerModel.repeating) {
        // Repeating variable without an index returns a readable list for display
        return readableList(varAnswerModel.values, this.lang)
      }

      varIndex = 1
    }

    let val = varAnswerModel.values[varIndex]

    switch (varAnswerModel.type) {
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
    let varAnswerModel = this.varExists(varName)

    if (varAnswerModel === null) {
      // Create variable at runtime
      varAnswerModel = this.varCreate(varName, CONST.vtText,
        !((typeof varIndex === 'undefined') || (varIndex === null) ||
          (varIndex === '') || (varIndex === 0)), '')
    }

    if ((typeof varIndex === 'undefined') || (varIndex === null) || (varIndex === '')) {
      varIndex = 0
    }

    // Handle type conversion, like number to date and null to proper `notanswered` values.
    switch (varAnswerModel.type) {
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
      varAnswerModel.values = [null]
    } else if (varIndex === 0) {
      varAnswerModel.values[1] = varVal
    } else {
      varAnswerModel.values[varIndex] = varVal
    }
  }
})
