import CanMap from 'can-map'
import _inRange from 'lodash/inRange'
import 'can-map-define'

export default CanMap.extend({
  define: {
    _counter: {
      type: 'number',
      value: 0
    },

    outOfRange: {
      type: 'boolean',
      get () {
        return !_inRange(this._counter, 0, 100)
      }
    }
  },

  inc: function () {
    this.attr('_counter', this.attr('_counter') + 1)
  },

  reset: function () {
    this.attr('_counter', 0)
  }
})
