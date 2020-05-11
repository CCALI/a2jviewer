import CanMap from 'can-map'
import Component from 'can-component'
import template from './mobile.stache'
import 'can-map-define'

const MobileViewerVM = CanMap.extend('MobileViewerVM', {
  define: {
    // passed in via app.stache bindings
    lang: {},
    logic: {},
    rState: {},
    pState: {},
    mState: {},
    interview: {},
    modalContent: {}
  },
  hideCredits: function () {
    this.attr('mState.showCredits', false)
  },
  connectedCallback () {
    // mobile view does not use header or step
    this.attr('mState.header', '')
    this.attr('mState.step', '')
  }
})

// ScreenManager is to handle which view is currently on the screen. Also,
// if we add any animations on bringing views into the viewport, we'll add that here.
export default Component.extend({
  view: template,
  leakScope: false,
  tag: 'a2j-mobile-viewer',
  ViewModel: MobileViewerVM,

  helpers: {
    tocOrCreditsShown: function () {
      const showToc = this.attr('mState.showToc')
      const showCredits = this.attr('mState.showCredits')

      return (showCredits || showToc)
    },

    eval: function (str) {
      str = typeof str === 'function' ? str() : str
      return this.attr('logic').eval(str)
    }
  }
})
