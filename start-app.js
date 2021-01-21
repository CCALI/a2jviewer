import $ from 'jquery'
import isMobile from '~/src/util/is-mobile'
import template from './app.stache'
import Lang from '~/src/mobile/util/lang'
import Logic from '~/src/mobile/util/logic'
import constants from '~/src/models/constants'
import PersistedState from '~/src/models/persisted-state'
import setMobileDesktopClass from '~/src/util/set-mobile-desktop-class'
import { analytics } from '~/src/util/analytics'
import _assign from 'lodash/assign'
import compute from 'can-compute'
import route from 'can-route'

import '~/src/util/object-assign-polyfill'

export default function ({ interview, pState, mState, rState }) {
  route.start()

  pState = pState || new PersistedState()
  pState.attr('setDataURL', mState.attr('setDataURL'))
  pState.attr('autoSetDataURL', mState.attr('autoSetDataURL'))

  const lang = new Lang(interview.language)
  const answers = pState.attr('answers')

  answers.attr('lang', lang)
  answers.attr(_assign({}, interview.serialize().vars))
  answers.attr(constants.vnInterviewIncompleteTF.toLowerCase(), {
    name: constants.vnInterviewIncompleteTF.toLowerCase(),
    type: constants.vtTF,
    values: [null, true]
  })

  interview.answers = answers

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
  rState.page = interview.firstPage

  const modalContent = compute()

  // piwik: set author id for filtering/tracking
  const authorId = interview.authorId || 0
  analytics.initialize(authorId)

  $('#viewer-app-container').append(template({
    rState, pState, mState, interview, logic, lang, isMobile, modalContent
  }))
}
