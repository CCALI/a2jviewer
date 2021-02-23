import DefineMap from 'can-define/map/map'
import _inRange from 'lodash/inRange'

export default DefineMap.extend('Infinite', {
  _counter: {
    type: 'number',
    value: 0
  },

  outOfRange: {
    type: 'boolean',
    get () {
      return !_inRange(this._counter, 0, 100)
    }
  },

  inc: function () {
    this._counter = this._counter + 1
  },

  reset: function () {
    this._counter = 0
  }
})
