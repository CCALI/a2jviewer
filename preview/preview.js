import $ from 'jquery'
import CanMap from 'can-map'
import compute from 'can-compute'
import _assign from 'lodash/assign'
import Component from 'can-component'
import isMobile from 'caja/viewer/is-mobile'
import template from 'caja/viewer/app.stache'
import Lang from 'caja/viewer/mobile/util/lang'
import Logic from 'caja/viewer/mobile/util/logic'
import AppState from 'caja/viewer/models/app-state'
import Interview from 'caja/viewer/models/interview'
import MemoryState from 'caja/viewer/models/memory-state'
import PersistedState from 'caja/viewer/models/persisted-state'
import parseGuideToMobile from 'caja/viewer/mobile/util/guide-to-mobile'

import 'can-map-define'

export const ViewerPreviewVM = CanMap.extend('ViewerPreviewVM', {
  define: {
    // passed in via viewer-preview-layout.stache bindings
    guidePath: {},
    showDebugPanel: {},
    previewPageName: {},
    traceMessage: {},
    // passed up to Author app-state via viewer-preview-layout.stache bindings
    previewInterview: {},
    interviewPageName: {
      get: function () {
        return this.attr('rState.page')
      }
    },
    // set by attr call in connectedCallback
    rState: {},
    pState: {},
    mState: {},
    interview: {},
    logic: {},
    lang: {},
    isMobile: {},
    modalContent: {}
  },

  connectedCallback (el) {
    const vm = this
    const rState = new AppState()
    const tearDownAppState = rState.connectedCallback(el)
    const mState = new MemoryState()
    const pState = new PersistedState()

    // if previewInterview.answers exist here, they are restored from Author app-state binding
    const previewAnswers = vm.attr('previewInterview.answers')

    // Set fileDataURL to window.gGuidePath, so the viewer can locate the
    // interview assets (images, sounds, etc).
    mState.attr('fileDataURL', vm.attr('guidePath'))

    const mobileData = parseGuideToMobile(_assign({}, window.gGuide))
    const parsedData = Interview.parseModel(mobileData)
    const interview = new Interview(parsedData)
    const lang = new Lang(interview.attr('language'))

    const answers = pState.attr('answers')

    if (previewAnswers) { // restore previous answers
      answers.attr(previewAnswers.serialize())
    } else { // just set the interview vars
      answers.attr(_assign({}, interview.serialize().vars))
    }

    answers.attr('lang', lang)
    interview.attr('answers', answers)

    rState.interview = interview

    // needs to be created after answers are set
    const logic = new Logic({ interview })
    rState.logic = logic
    rState.traceMessage = this.traceMessage

    // listen for _tLogic trace message events
    const tLogic = rState.logic._tLogic
    const tLogicMessageHandler = (ev) => {
      rState.traceMessage.addMessage(ev.message)
    }
    tLogic.listenTo('traceMessage', tLogicMessageHandler)

    // if previewPageName is set, we need to make sure the viewer
    // loads that specific page (covers the case when user clicks
    // `preview` from the edit page popup).
    rState.view = 'pages'
    if (vm.attr('previewPageName')) {
      rState.set('page', vm.attr('previewPageName'))
    } else {
      rState.set('page', interview.attr('firstPage'))
    }

    const modalContent = compute()

    vm.attr({
      rState,
      pState,
      mState,
      interview,
      logic,
      lang,
      isMobile,
      modalContent
    })

    $(el).html(template(vm))

    // trigger update of previewInterview to author app-state
    vm.attr('previewInterview', interview)

    return function () {
      tLogic.stopListening('traceMessage', tLogicMessageHandler)
      tearDownAppState()
    }
  }
})

export default Component.extend({
  tag: 'a2j-viewer-preview',
  ViewModel: ViewerPreviewVM,
  leakScope: true
})
