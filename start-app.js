import $ from 'jquery'
import isMobile from '~/src/util/is-mobile'
import template from './app.stache'
import Lang from '~/src/mobile/util/lang'
import Logic from '~/src/mobile/util/logic'
import constants from '~/src/models/constants'
import PersistedState from '~/src/models/persisted-state'
import setMobileDesktopClass from '~/src/util/set-mobile-desktop-class'
import { analytics } from '~/src/util/analytics'
import route from 'can-route'

import '~/src/util/object-assign-polyfill'

export default function ({ interview, pState, mState, appState }) {
  route.start()

  pState = pState || new PersistedState()
  pState.attr('setDataURL', mState.attr('setDataURL'))
  pState.attr('autoSetDataURL', mState.attr('autoSetDataURL'))

  const lang = new Lang(interview.attr('language'))
  const answers = pState.attr('answers')

  answers.lang = lang
  answers.assign(interview.serialize().vars)
  const incompleteKey = constants.vnInterviewIncompleteTF.toLowerCase()
  answers.varSet(incompleteKey, {
    name: incompleteKey,
    type: constants.vtTF,
    values: [null, true]
  })

  interview.attr('answers', answers)

  const logic = new Logic({
    interview: interview
  })

  pState.backup()

  appState.bind('change', function (ev, attr, how, val) {
    if (attr === 'page' && val) {
      pState.attr('currentPage', val)
    }
  })

  appState.interview = interview
  setMobileDesktopClass(isMobile, $('body'))

  appState.logic = logic

  // set initial page route
  appState.view = 'pages'
  appState.page = interview.attr('firstPage')

  // piwik: set author id for filtering/tracking
  const authorId = interview.authorId || 0
  analytics.initialize(authorId)

  $('#viewer-app-container').append(template({
    appState, pState, mState, interview, logic, lang, isMobile
  }))
}
