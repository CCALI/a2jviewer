import CanMap from 'can-map'
import _some from 'lodash/some'
import _filter from 'lodash/filter'
import Validations from 'caja/viewer/mobile/util/validations'
import cString from 'caja/viewer/mobile/util/string'
import 'can-map-define'

export default CanMap.extend('AnswerVM', {
  define: {
    // top 4 props passed in from pages-vm.js setFieldAnswers() #526
    field: {
      value: null
    },

    answer: {
      value: null
    },

    answerIndex: {
      value: 1
    },

    fields: {
      value: null
    },

    // TODO: find a better way to handle setting and restoring values
    // at the very least, rename this to something better: ex,`getSetValues`
    // `values` is confusing when reading this along side other code.
    values: {
      get (lastSet) {
        const index = this.attr('answerIndex')
        const previousValue = this.attr(`answer.values.${index}`)

        return previousValue
      },

      set (val) {
        const index = this.attr('answerIndex')
        const type = this.attr('field.type')

        // TODO: this conversion allows for future locales
        // should probably be moved to a better place when that happens
        if (type === 'number' || type === 'numberdollar') {
          val = cString.textToNumber(val)
        }

        if (!this.attr('answer')) {
          this.attr('answer', {})
        }

        if (!this.attr('answer.values')) {
          this.attr('answer.values', [null])
        }

        this.attr(`answer.values.${index}`, val)

        return val
      }
    },

    errors: {
      get () {
        const testValue = this.attr('values')
        return this.validateAnswer(testValue)
      }
    }
  },

  validateAnswer (val) {
    const field = this.attr('field')

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

    validations.attr('val', val)

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
        invalid = validations.isDate() || validations.required() || validations.min() || validations.max()
        break
      case 'gender':
      case 'useravatar':
      case 'textpick':
        invalid = validations.required()
        break
      case 'checkbox':
      case 'radio':
      case 'checkboxNOTA':
        const fields = this.attr('fields')
        const index = this.attr('answerIndex')
        const varName = this.attr('field.name')

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
          return !!checkbox.attr(`_answerVm.answer.values.${index}`)
        })

        validations.attr('val', anyChecked || null)

        invalid = validations.required()
        break
    }

    return invalid
  }

})
