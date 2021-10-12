import DefineMap from 'can-define/map/map'
import Answer from '~/src/models/answer'
import _some from 'lodash/some'
import _filter from 'lodash/filter'
import Validations from '~/src/mobile/util/validations'
import cString from '@caliorg/a2jdeps/utils/string'

export default DefineMap.extend('AnswerVM', {
  // top 4 props passed in from pages-vm.js setFieldAnswers() #526
  field: {
    default: null
  },

  answer: {
    default: null
  },

  answerIndex: {
    default: 1
  },

  fields: {
    default: null
  },

  // TODO: find a better way to handle setting and restoring values
  // at the very least, rename this to something better: ex,`getSetValues`
  // `values` is confusing when reading this along side other code.
  values: {
    get (lastSet) {
      const index = this.answerIndex
      const previousValue = this.answer.values[index]

      return previousValue
    },

    set (val) {
      const index = this.answerIndex
      const type = this.field.type

      // TODO: this conversion allows for future locales
      // should probably be moved to a better place when that happens
      if (type === 'number' || type === 'numberdollar') {
        val = cString.textToNumber(val)
      }

      if (!this.answer) {
        this.answer = new Answer()
      }
      // TODO: this can probably be removed now we are assigning a new AnswerModel above
      if (!this.answer.values) {
        this.answer.set('values', [null])
      }

      this.answer.values.set(index, val)

      return val
    }
  },

  errors: {
    get () {
      const testValue = this.values
      return this.validateAnswer(testValue)
    }
  },

  separatorCheck (date) {
    const hasSeparator = date.match(/\/|-/g)
    if (!hasSeparator && date.length > 6) {
      return true
    }
    return false
  },

  separatorCheck (date) {
    const hasSeparator = date.match(/\/|-/g)
    if (!hasSeparator && date.length > 6) {
      return true
    }
    return false
  },

  validateAnswer (val) {
    const field = this.field

    if (!field) return

    const validations = new Validations({
      config: {
        type: field.type,
        maxChars: field.maxChars,
        min: field.min,
        max: field.max,
        required: field.required,
        isNumber: true
      }
    })

    validations.val = val

    let invalid

    switch (field.type) {
      case 'text':
      case 'textlong':
      case 'numberphone':
      case 'numberssn':
      case 'numberzip':
        invalid = validations.required() || validations.maxChars()
        break
      case 'number':
      case 'numberdollar':
        invalid = validations.isNumber() || validations.required() || validations.min() || validations.max()
        break
      case 'numberpick':
        invalid = validations.required() || validations.min() || validations.max()
        break
      case 'datemdy':
        invalid = validations.isDate() || validations.required() || validations.min() || validations.max() || this.separatorCheck(val)
        break
      case 'gender':
      case 'useravatar':
      case 'textpick':
        invalid = validations.required()
        break
      case 'checkbox':
      case 'radio':
      case 'checkboxNOTA':
        const fields = this.fields
        const index = this.answerIndex
        const varName = this.field.name

        const checkboxes = _filter(fields, function (f) {
          // if the field being validated is either 'checkbox' or 'checkboxNOTA',
          // we need to filter all fields which are either of those types.
          if (field.type === 'checkbox' || field.type === 'checkboxNOTA') {
            return f.type === 'checkbox' || f.type === 'checkboxNOTA'
            // otherwise filter fields that are 'radio' type.
          } else {
            // validate radio by shared varName
            return f.type === 'radio' && f.name === varName
          }
        })

        const anyChecked = _some(checkboxes, function (checkbox) {
          return !!checkbox._answerVm.answer.values[index]
        })

        validations.val = anyChecked || null

        invalid = validations.required()
        break
    }

    return invalid
  }
})
