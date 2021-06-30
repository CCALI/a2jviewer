import DefineMap from 'can-define/map/map'
import Component from 'can-component'
import template from './mobile.stache'

const MobileViewerVM = DefineMap.extend('MobileViewerVM', {
  // passed in via app.stache bindings
  lang: {},
  logic: {},
  appState: {},
  pState: {},
  mState: {},
  interview: {},
  modalContent: {
    get () {
      return this.appState.modalContent
    }
  },

  navPanelToggle: {
    serialize: false,
    default: false
  },
  hideCredits: function () {
    this.mState.attr('showCredits', false)
  },
  connectedCallback () {
    // mobile view does not use header or step
    this.mState.attr('header', '')
    this.mState.attr('step', '')
  }
})

// if we add any animations on bringing views into the viewport, we'll add that here.
export default Component.extend({
  view: template,
  leakScope: false,
  tag: 'a2j-mobile-viewer',
  ViewModel: MobileViewerVM,

  helpers: {
    tocOrCreditsShown: function () {
      const showToc = this.mState.attr('showToc')
      const showCredits = this.mState.attr('showCredits')

      return (showCredits || showToc)
    }
  }
})
