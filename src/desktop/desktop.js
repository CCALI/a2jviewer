import DefineMap from 'can-define/map/map'
import Component from 'can-component'
import template from './desktop.stache'
import _isUndefined from 'lodash/isUndefined'
import isMobile from '~/src/util/is-mobile'

let DesktopViewerVM = DefineMap.extend('DesktopViewerVM', {
  // passed in via viewer app.stache bindings
  remainingSteps: {},
  maxDisplayedSteps: {},
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
  // passed up from steps.js
  traceMessage: {},
  // singleton compute
  isMobile: {
    get () {
      return isMobile()
    }
  },

  pageNotFound: {
    default: false
  },

  showDemoNotice: {
    default: false
  },

  authorBrandLogo: {
    get () {
      return this.interview.logoImage
    }
  },

  authorCourthouseImage: {
    get () {
      return this.interview.endImage
    }
  },

  // allows keyboard users to skip nav bar and go directly to either the first question input or nav button
  focusMainContent: () => {
    document.querySelector('.question-text-container').focus()
  },

  connectedCallback () {
    // Used to hide/show keyboard nav shortcut to GI Question content
    const skipLink = document.getElementById('skiplink')
    skipLink.addEventListener('click', this.focusMainContent)

    const location = window.location.toString()
    this.showDemoNotice = location.indexOf('.a2jauthor.org') !== -1

    this.checkPageExists()

    return () => {
      skipLink.removeEventListener('click', this.focusMainContent)
    }
  },

  checkPageExists () {
    const appState = this.appState
    const interview = this.interview

    if (!appState || !interview) return

    const pageName = appState.page

    if (appState.view === 'pages') {
      const page = interview.pages.find(pageName)
      this.pageNotFound = _isUndefined(page)
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
      return this.logic.eval(str)
    }
  },

  events: {
    '{appState} page': function () {
      this.viewModel.checkPageExists()
    }
  },

  leakScope: true
})
