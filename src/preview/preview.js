import $ from 'jquery'
import CanMap from 'can-map'
import _assign from 'lodash/assign'
import Component from 'can-component'
import isMobile from '~/src/util/is-mobile'
import template from '~/app.stache'
import Lang from '~/src/mobile/util/lang'
import Logic from '~/src/mobile/util/logic'
import AppState from '~/src/models/app-state'
import Interview from '~/src/models/interview'
import MemoryState from '~/src/models/memory-state'
import PersistedState from '~/src/models/persisted-state'
import parseGuideToMobile from '~/src/mobile/util/guide-to-mobile'

import 'can-map-define'

export const ViewerPreviewVM = CanMap.extend('ViewerPreviewVM', {
  define: {
    // passed in via viewer-preview-layout.stache bindings
    resumeEdit: {},
    guidePath: {},
    showDebugPanel: {},
    previewPageName: {},
    // passed up to Author app-state via viewer-preview-layout.stache bindings
    traceMessage: {},
    previewInterview: {},
    interviewPageName: {
      get () {
        return this.attr('appState.page')
      }
    },
    // set by attr call in connectedCallback
    appState: {},
    pState: {},
    mState: {},
    interview: {},
    logic: {},
    lang: {},
    isMobile: {}
  },

  getStartPage (interview, appState) {
    const resumePageName = interview.answers.varGet('A2J Resume Page')
    if (this.attr('previewPageName')) {
      return this.attr('previewPageName')
    } else if (resumePageName) {
      // check for the 'A2J Resume Page' for testing
      if (appState.visitedPages && (appState.visitedPages[0].name === interview.exitPage)) {
        appState.visitedPages.shift()
      }
      return resumePageName
    } else {
      return interview.attr('firstPage')
    }
  },

  setupInterview () {
    const mobileData = parseGuideToMobile(_assign({}, window.gGuide))
    const parsedData = Interview.parseModel(mobileData)
    return new Interview(parsedData)
  },

  setupAppState (appState, interview, resumeEdit, showDebugPanel) {
    appState.interview = interview
    appState.resumeEdit = resumeEdit
    appState.showDebugPanel = showDebugPanel
    return appState
  },

  setAnswers (pState, appState, interview) {
    const answers = pState.attr('answers')
    const previewAnswers = this.attr('previewInterview.answers')
    const previewVisitedPages = previewAnswers && previewAnswers.visitedPages

    if (previewAnswers) { // restore previous answers
      // TODO: allow answers.varSet to take maps/lists
      appState.visitedPages = previewVisitedPages
      answers.assign(previewAnswers.serialize())
    } else { // just set the interview vars
      answers.assign(interview.serialize().vars)
    }
    return answers
  },

  connectedCallback (el) {
    const vm = this
    const appState = new AppState()
    const tearDownAppState = appState.connectedCallback(el)
    const mState = new MemoryState()
    const pState = new PersistedState()

    // used in Viewer App during previewMode
    appState.previewActive = true

    // Set fileDataURL to window.gGuidePath, so the viewer can locate the
    // interview assets (images, sounds, etc).
    mState.attr('fileDataURL', vm.attr('guidePath'))

    const interview = vm.setupInterview()

    const lang = new Lang(interview.attr('language'))

    const answers = vm.setAnswers(pState, appState, interview)

    answers['lang'] = lang

    interview.attr('answers', answers)

    vm.setupAppState(appState, interview, vm.resumeEdit, this.showDebugPanel)

    if (this.attr('traceMessage')) {
      const authorTraceMessageLog = this.attr('traceMessage').messageLog
      appState.traceMessage.messageLog = authorTraceMessageLog
    }

    const showDebugPanelHandler = (ev, showDebugPanel) => {
      vm.attr('showDebugPanel', showDebugPanel)
    }
    appState.listenTo('showDebugPanel', showDebugPanelHandler)

    // needs to be created after answers are set
    const logic = new Logic({ interview })
    appState.logic = logic

    // listen for _tLogic trace message events
    const tLogic = appState.logic._tLogic
    const tLogicMessageHandler = (ev) => {
      appState.traceMessage.addMessage(ev.message)
    }
    tLogic.listenTo('traceMessage', tLogicMessageHandler)

    // if previewPageName is set, we need to make sure the viewer
    // loads that specific page (covers the case when user clicks
    // `preview` from the edit page popup).
    appState.view = 'pages'

    appState.page = vm.getStartPage(interview, appState)

    vm.attr({
      appState,
      pState,
      mState,
      interview,
      logic,
      lang,
      isMobile
    })

    $(el).html(template(vm))

    // trigger update of previewInterview to author app-state
    interview.attr('answers').visitedPages = appState.visitedPages
    vm.attr('previewInterview', interview)
    vm.attr('traceMessage', appState.traceMessage)

    return function () {
      tLogic.stopListening('traceMessage', tLogicMessageHandler)
      appState.stopListening('showDebugPanel', showDebugPanelHandler)
      tearDownAppState()
    }
  }
})

export default Component.extend({
  tag: 'a2j-viewer-preview',
  ViewModel: ViewerPreviewVM,
  leakScope: true
})
