import CanMap from 'can-map'
import Component from 'can-component'
import template from './desktop.stache'
import _isUndefined from 'lodash/isUndefined'

import 'can-map-define'

let DesktopViewerVM = CanMap.extend('DesktopViewerVM', {
  define: {
    // passed in via viewer app.stache bindings
    remainingSteps: {},
    maxDisplayedSteps: {},
    showDebugPanel: {},
    lang: {},
    logic: {},
    rState: {},
    pState: {},
    mState: {},
    interview: {},
    modalContent: {},

    pageNotFound: {
      value: false
    },

    showDemoNotice: {
      value: false
    },

    authorBrandLogo: {
      get () {
        return this.attr('interview.logoImage')
      }
    },

    authorCourthouseImage: {
      get () {
        return this.attr('interview.endImage')
      }
    }
  },

  // allows keyboard users to skip nav bar and go directly to either the first question input or nav button
  focusMainContent: () => {
    document.querySelector('legend.question-text-legend').focus()
  },

  connectedCallback () {
    // Used to hide/show keyboard nav shortcut to GI Question content
    const skipLink = document.getElementById('skiplink')
    skipLink.addEventListener('click', this.focusMainContent)

    const location = window.location.toString()
    this.attr('showDemoNotice', location.indexOf('.a2jauthor.org') !== -1)

    this.checkPageExists()

    return () => {
      skipLink.removeEventListener('click', this.focusMainContent)
    }
  },

  checkPageExists () {
    const rState = this.attr('rState')
    const interview = this.attr('interview')

    if (!rState || !interview) return

    const pageName = rState.page

    if (rState.view === 'pages') {
      const page = interview.attr('pages').find(pageName)
      this.attr('pageNotFound', _isUndefined(page))
    }
  }
})

export default Component.extend({
  view: template,
  tag: 'a2j-desktop-viewer',
  ViewModel: DesktopViewerVM,

  helpers: {
    eval (str) {
      str = typeof str === 'function' ? str() : str
      return this.attr('logic').eval(str)
    }
  },

  events: {
    '{rState} page': function () {
      this.viewModel.checkPageExists()
    }
  },

  leakScope: true
})
