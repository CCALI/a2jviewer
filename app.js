import deparam from 'can-deparam'
import route from 'can-route'
import startApp from './start-app'
import config from 'a2jviewer/config/'
import _isEmpty from 'lodash/isEmpty'
import _assign from 'lodash/assign'
import AppState from 'a2jviewer/models/app-state'
import Interview from 'a2jviewer/models/interview'
import MemoryState from 'a2jviewer/models/memory-state'
import PersistedState from 'a2jviewer/models/persisted-state'

import 'can-3-4-compat/dom-mutation-events'

import 'jquerypp/dom/cookie/'
import 'a2jviewer/mobile/util/helpers'
import 'calculator/jquery.plugin'
import 'calculator/jquery.calculator'
import 'calculator/jquery.calculator.css'

// State attrs not needing persistance, such as showing/hiding the table of contents.
// Load configuration from desktop into mobile
const qsParams = deparam(window.location.search.substring(1))
const mState = new MemoryState(_isEmpty(qsParams)
  ? config
  : _assign({}, config, qsParams))

// AJAX request for interview json
const interviewPromise = Interview.findOne({
  url: mState.attr('templateURL'),
  resume: mState.attr('getDataURL')
})

// Local storage request for any existing answers
const persistedStatePromise = PersistedState.findOne()

// Route state
const rState = new AppState()
rState.connectedCallback(document.body)

route.register('view/{view}/page/{page}')
route.register('view/{view}/page/{page}/{repeatVarValue}')
route.register('view/{view}/page/{page}/{repeatVarValue}/{outerLoopVarValue}')
route.data = rState

Promise.all([interviewPromise, persistedStatePromise])
  .then(function ([interview, pState]) {
    startApp({ interview, pState, mState, rState })
  })