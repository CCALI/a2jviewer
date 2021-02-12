import DefineMap from 'can-define/map/map'
import constants from '~/src/models/constants'

export default DefineMap.extend('AnswerModel', {
  name: {
    type: 'string',
    default: ''
  },
  repeating: {
    type: 'boolean',
    default: false
  },
  type: {
    type: 'string',
    default: constants.vtText
  },
  // values array 0th value is always null for legacy reasons
  values: {
    default: () => [null]
  },
  // reset to the default
  clearAnswer () {
    this.values = [null]
  }
})
