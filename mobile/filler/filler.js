import $ from 'jquery'
import Control from 'can-control'
import canViewCallbacks from 'can-view-callbacks'

export default Control.extend({
  init: function () {
    this._calc()
  },

  _calc: function () {
    let offset = $(this.element).offset()
    let height = $(window).height() - offset.top

    $(this.element).height(height)
  },

  '{window} resize': function () {
    this._calc()
  }
})

// Expose an additional html attr for easy access
canViewCallbacks.attr('filler', function (el) {
  /* eslint-disable no-new */
  new window.Filler(el)
})
