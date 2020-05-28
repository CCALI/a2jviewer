import $ from 'jquery'
import isMobile from './is-mobile'
import template from './app.stache'
import Lang from 'a2jviewer/mobile/util/lang'
import Logic from 'a2jviewer/mobile/util/logic'
import constants from '@caliorg/a2jdeps/models/constants'
import PersistedState from 'a2jviewer/models/persisted-state'
import setMobileDesktopClass from 'a2jviewer/util/set-mobile-desktop-class'
import { analytics } from 'a2jviewer/util/analytics'
import _assign from 'lodash/assign'
import compute from 'can-compute'
import route from 'can-route'

import 'a2jviewer/util/object-assign-polyfill'

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
