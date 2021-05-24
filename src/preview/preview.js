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

    const mobileData = parseGuideToMobile(_assign({}, window.gGuide))
    const parsedData = Interview.parseModel(mobileData)
    const interview = new Interview(parsedData)
    const lang = new Lang(interview.attr('language'))

    const answers = pState.attr('answers')

    // if previewInterview.answers exist here, they are restored from Author app-state binding
    const previewAnswers = vm.attr('previewInterview.answers')

    const previewVisitedPages = previewAnswers && previewAnswers.vistedPages

    if (previewAnswers) { // restore previous answers
      // TODO: allow answers.varSet to take maps/lists
      answers.assign(previewAnswers.serialize())
      appState.visitedPages = previewVisitedPages
    } else { // just set the interview vars
      answers.assign(interview.serialize().vars)
    }

    answers['lang'] = lang
    interview.attr('answers', answers)

    appState.interview = interview
    appState.resumeEdit = vm.resumeEdit
    appState.showDebugPanel = vm.showDebugPanel

    // restore Author messageLog
    if (vm.attr('traceMessage')) {
      const authorTraceMessageLog = vm.attr('traceMessage').messageLog
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
    if (vm.attr('previewPageName')) {
      appState.set('page', vm.attr('previewPageName'))
    } else {
      // check for the 'resumePage' for testing
      if (interview.attr('answers').resumepage) {
        let pageName = interview.attr('answers').resumepage.values[1]
        appState.set('page', pageName)
      } else {
        appState.set('page', interview.attr('firstPage'))
      }
    }
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
    interview.attr('answers').vistedPages = appState.visitedPages
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
