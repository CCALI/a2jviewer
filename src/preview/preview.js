import $ from 'jquery'
import DefineMap from 'can-define/map/map'
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

export const ViewerPreviewVM = DefineMap.extend('ViewerPreviewVM', {
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
      return this.appState && this.appState.page
    }
  },
  // set by attr call in connectedCallback
  appState: {},
  pState: {},
  mState: {},
  interview: {},
  logic: {},
  lang: {},
  isMobile: {},

  connectedCallback (el) {
    const vm = this
    const appState = new AppState()
    const tearDownAppState = appState.connectedCallback(el)
    const mState = new MemoryState()
    const pState = new PersistedState()

    // used in Viewer App during previewMode
    appState.previewActive = true

    // if previewInterview.answers exist here, they are restored from Author app-state binding
    const previewAnswers = vm.previewInterview && vm.previewInterview.attr('answers')

    // Set fileDataURL to window.gGuidePath, so the viewer can locate the
    // interview assets (images, sounds, etc).
    mState.attr('fileDataURL', vm.guidePath)

    const mobileData = parseGuideToMobile(_assign({}, window.gGuide))
    const parsedData = Interview.parseModel(mobileData)
    const interview = new Interview(parsedData)
    const lang = new Lang(interview.attr('language'))

    const answers = pState.attr('answers')

    if (previewAnswers) { // restore previous answers
      // TODO: allow answers.varSet to take maps/lists
      answers.assign(previewAnswers.serialize())
    } else { // just set the interview vars
      answers.assign(interview.serialize().vars)
    }

    answers['lang'] = lang
    interview.attr('answers', answers)

    appState.interview = interview
    appState.resumeEdit = vm.resumeEdit
    appState.showDebugPanel = vm.showDebugPanel

    // restore Author messageLog
    if (vm.traceMessage) {
      const authorTraceMessageLog = vm.traceMessage.messageLog
      appState.traceMessage.messageLog = authorTraceMessageLog
    }

    const showDebugPanelHandler = (ev, showDebugPanel) => {
      vm.showDebugPanel = showDebugPanel
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
    if (vm.previewPageName) {
      appState.set('page', vm.previewPageName)
    } else {
      appState.set('page', interview.attr('firstPage'))
    }

    vm.update({
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
    vm.previewInterview = interview
    vm.traceMessage = appState.traceMessage

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
