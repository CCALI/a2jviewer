import $ from 'jquery'
import isMobile from '~/src/util/is-mobile'
import template from './app.stache'
import Lang from '~/src/mobile/util/lang'
import Logic from '~/src/mobile/util/logic'
import PersistedState from '~/src/models/persisted-state'
import setMobileDesktopClass from '~/src/util/set-mobile-desktop-class'
import { analytics } from '~/src/util/analytics'
import route from 'can-route'
import constants from '~/src/models/constants'

import '~/src/util/object-assign-polyfill'

export default function ({ interview, pState, mState, appState }) {
  route.start()

  pState = pState || new PersistedState()

  const answers = interview.attr('answers')
  const lang = new Lang(interview.attr('language'))
  answers.lang = lang
  answers.assign(interview.serialize().vars)

  const incompleteKey = constants.vnInterviewIncompleteTF.toLowerCase()
  answers.varSet(incompleteKey, {
    name: incompleteKey,
    type: constants.vtTF,
    values: [null, true]
  })

  const resumePageName = answers.varGet('A2J Resume Page')
  if (resumePageName) {
    const visitedPagesJSON = answers.varGet('visitedpages')
    const visitedPagesParsed = JSON.parse(visitedPagesJSON)
    appState.visitedPages.update(visitedPagesParsed)
  }
  delete answers.visitedpages
  interview.removeAttr('vars.visitedpages')

  const logic = new Logic({ interview })

  appState.interview = interview
  setMobileDesktopClass(isMobile, $('body'))

  appState.logic = logic

  appState.slideoutContent = 'nav'

  // set initial page route
  appState.view = 'pages'
  appState.page = resumePageName || appState.interview.attr('firstPage')

  // piwik: set author id for filtering/tracking
  const authorId = interview.authorId || 0
  analytics.initialize(authorId)

  $('#viewer-app-container').append(template({
    appState, pState, mState, interview, logic, lang, isMobile
  }))
}
