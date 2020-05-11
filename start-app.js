import $ from 'jquery'
import isMobile from './is-mobile'
import template from './app.stache'
import Lang from 'caja/viewer/mobile/util/lang'
import Logic from 'caja/viewer/mobile/util/logic'
import constants from 'caja/viewer/models/constants'
import PersistedState from 'caja/viewer/models/persisted-state'
import setMobileDesktopClass from 'caja/viewer/util/set-mobile-desktop-class'
import { analytics } from 'caja/viewer/util/analytics'
import _assign from 'lodash/assign'
import compute from 'can-compute'
import route from 'can-route'

import 'caja/viewer/util/object-assign-polyfill'

// TODO: trace-message.js should be moved to a shared library between Author/Viewer
import TraceMessage from 'caja/author/models/trace-message'

export default function ({ interview, pState, mState, rState }) {
  route.start()

  pState = pState || new PersistedState()
  pState.attr('setDataURL', mState.attr('setDataURL'))
  pState.attr('autoSetDataURL', mState.attr('autoSetDataURL'))

  const lang = new Lang(interview.attr('language'))
  const answers = pState.attr('answers')

  answers.attr('lang', lang)
  answers.attr(_assign({}, interview.serialize().vars))
  answers.attr(constants.vnInterviewIncompleteTF.toLowerCase(), {
    name: constants.vnInterviewIncompleteTF.toLowerCase(),
    type: constants.vtTF,
    values: [null, true]
  })

  interview.attr('answers', answers)

  const logic = new Logic({
    interview: interview
  })

  pState.backup()

  rState.bind('change', function (ev, attr, how, val) {
    if (attr === 'page' && val) {
      pState.attr('currentPage', val)
    }
  })

  rState.interview = interview
  setMobileDesktopClass(isMobile, $('body'))

  rState.logic = logic
  rState.traceMessage = new TraceMessage()

  // set initial page route
  rState.view = 'pages'
  rState.page = interview.attr('firstPage')

  const modalContent = compute()

  // piwik: set author id for filtering/tracking
  const authorId = interview.authorId || 0
  analytics.initialize(authorId)

  $('#viewer-app').append(template({
    rState, pState, mState, interview, logic, lang, isMobile, modalContent
  }))
}
