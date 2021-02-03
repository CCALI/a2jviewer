import DefineMap from 'can-define/map/map'

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
    default: ''
  },
  // values array 0th value is always null for legacy reasons
  values: {
    default: () => [null]
  }
})
