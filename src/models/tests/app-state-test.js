import { assert } from 'chai'
import AppState from '~/src/models/app-state'
import Interview from '~/src/models/interview'
import Logic from '~/src/mobile/util/logic'
import TraceMessage from '~/src/models/trace-message'
import Answers from '~/src/models/answers'
import stache from 'can-stache'
import sinon from 'sinon'
import '~/src/models/tests/fixtures/'

import 'steal-mocha'

describe('AppState', function () {
  let appState // DefineMap
  let pageNames
  let pages
  let pagesByName
  let interview
  let answers
  let logic
  let traceMessage
  let appStateTeardown

  beforeEach(function (done) {
    let promise = Interview.findOne({ url: '/interview.json' })

    promise.then(function (_interview) {
      interview = _interview
      answers = new Answers()
      traceMessage = new TraceMessage({ addMessage: sinon.stub() })
      interview.attr('answers', answers)

      logic = new Logic({ interview })

      appState = new AppState({ interview, logic, traceMessage })
      // in live app, pages-vm tryToVisitPage is called when appState.page is set and calls visitedPages.visit with appState's new currentPage
      appState.listenTo('page', () => appState.currentPage && appState.visitedPages.visit(appState.currentPage))
      // simulate stache bind on visitedPages
      appStateTeardown = (td => () => {
        appState.stopListening('page')
        td()
      })(appState.connectedCallback())

      // collect the actual page names of the interview
      pages = interview.attr('pages')
      pagesByName = pages.reduce((acc, page) => {
        acc[page.name] = page
        return acc
      }, {})
      pageNames = Object.keys(pagesByName)

      done()
    })
  })

  afterEach(function () {
    appStateTeardown()
  })

  it('parseText helper', function () {
    const parseText = stache.getHelper('parseText')
    const answers = appState.interview.attr('answers')
    answers.varCreate('client first name te', 'Text', false)
    answers.varSet('client first name te', 'JessBob', 1)
    const result = parseText('My name is %%[Client first name TE]%%')
    assert.equal(result, 'My name is JessBob', 'should resolve macros in text')
  })

  it('sets default avatar when no saved userAvatar value', function () {
    const defaultUserAvatar = { gender: 'female', isOld: false, hasWheelchair: false, hairColor: 'brownDark', skinTone: 'medium' }
    assert.deepEqual(appState.userAvatar.serialize(), defaultUserAvatar, 'should set defaultAvatar')
  })

  it('restores userAvatar from saved interview.answers ', function () {
    const savedAvatar = JSON.stringify({ gender: 'male', isOld: false, hasWheelchair: true, hairColor: 'red', skinTone: 'medium' })
    const answers = appState.interview.attr('answers')
    answers.varSet('user avatar', savedAvatar)
    assert.deepEqual(appState.userAvatar.serialize(), { gender: 'male', isOld: false, hasWheelchair: true, hairColor: 'red', skinTone: 'medium' }, 'should set defaultAvatar')
  })

  it('sets the document title to the interview title', function () {
    const interviewTitle = appState.interview.title
    const prependedString = 'A2J Guided Interview called '
    const documentTitle = document.title
    assert.equal(prependedString + interviewTitle, documentTitle, 'prepended String plus interview title equals document title')
  })

  it('defaults visitedPages to empty list', function () {
    const visitedPages = appState.visitedPages
    assert.equal(visitedPages.length, 0, 'empty on init')
  })

  it('keeps a list of visited pages', function () {
    assert.equal(appState.visitedPages.length, 0, 'empty on init')

    // simulate page to page navigation
    appState.page = pageNames[0]
    appState.page = pageNames[1]

    assert.equal(appState.visitedPages.length, 2, 'two pages visited')
  })

  it('handles repeatVarValues', function () {
    const answers = appState.interview.attr('answers')
    const page = appState.interview.attr('pages')[1]
    answers.varSet('childcount', 1)
    page.repeatVar = 'childCount'
    appState.page = pageNames[1]

    assert.equal(appState.visitedPages.length, 1, 'appState.visitedPages should be correct length')
    assert.equal(appState.visitedPages[0].interviewPage.repeatVar, 'childCount', 'page has repeatVar')
    assert.equal(appState.visitedPages[0].repeatVarValue, '1', 'page has repeatVarValue')
  })

  it('handles following pages without repeatVarValues', function () {
    const answers = appState.interview.attr('answers')
    const page = appState.interview.attr('pages')[1]
    answers.varSet('childcount', 1)
    page.repeatVar = 'childCount'
    appState.page = pageNames[1]

    assert.equal(appState.visitedPages.length, 1, 'appState.visitedPages should be correct length')
    assert.equal(appState.visitedPages[0].interviewPage.repeatVar, 'childCount', 'page has repeatVar')
    assert.equal(appState.visitedPages[0].repeatVarValue, '1', 'page has repeatVarValue')

    appState.page = pageNames[2]
    assert.equal(appState.visitedPages.length, 2, 'appState.visitedPages should be correct length')
    assert.equal(appState.visitedPages[0].interviewPage.repeatVar, '', 'page should not have repeatVar')
    assert.isTrue(typeof appState.visitedPages[0].repeatVarValue === 'undefined', 'page has no repeatVarValue')
  })

  it('handles repeatVarValue changes with same page name', function () {
    const answers = appState.interview.attr('answers')
    const page = appState.interview.attr('pages')[1]
    answers.varSet('childcount', 1)
    page.repeatVar = 'childCount'
    appState.page = pageNames[1]

    assert.equal(appState.visitedPages.length, 1, 'first page appState.visitedPages')
    assert.equal(appState.visitedPages[0].interviewPage.repeatVar, 'childCount', 'first page has repeatVar')
    assert.equal(appState.visitedPages[0].repeatVarValue, '1', 'first page has repeatVarValue')

    answers.varSet('childcount', 2)
    appState.page = pageNames[1]
    assert.equal(appState.visitedPages.length, 2, 'second page appState.visitedPages')
    assert.equal(appState.visitedPages[0].interviewPage.repeatVar, 'childCount', 'second page has repeatVar')
    assert.equal(appState.visitedPages[0].repeatVarValue, '2', 'second page has repeatVarValue')
  })

  it('only includes known pages', function () {
    appState.page = 'this-page-does-not-exist'
    assert.equal(appState.visitedPages.length, 0, 'invalid page')
  })

  it('recently visited pages are at the top of the list', function () {
    appState.page = pageNames[0]
    appState.page = pageNames[1]
    appState.page = pageNames[2]

    assert.equal(appState.visitedPages.length, 3, 'three pages visited')

    assert.equal(appState.visitedPages.shift().interviewPage.name, pageNames[2])
    assert.equal(appState.visitedPages.shift().interviewPage.name, pageNames[1])
    assert.equal(appState.visitedPages.shift().interviewPage.name, pageNames[0])
  })

  it('changing selected visited page resolves page', () => {
    // populate visitedPages
    appState.page = pages[2].name
    appState.page = pages[1].name
    appState.page = pages[0].name

    appState.visitedPages.selected = appState.visitedPages[1]

    assert.equal(
      appState.page,
      pages[1].name,
      'should set appState.page to page[1].name'
    )

    appState.visitedPages.selected = appState.visitedPages[0]

    assert.equal(
      appState.page,
      pages[0].name,
      'should set appState.page to pages[0].name'
    )
  })

  it('tracks questionNumber per step for each visitedPage', () => {
    // simulate page to page navigation
    appState.page = pageNames[0] // Step 0
    appState.page = pageNames[1] // Step 1
    appState.page = pageNames[2] // Step 1

    // note, visitedPages are reverse array order as index 0 is the last visitedPage
    assert.equal(appState.visitedPages[2].questionNumber, 1, 'should assign question number 1 to first visitedPage of a Step (0)')
    assert.equal(appState.visitedPages[1].questionNumber, 1, 'should reset count to 1 when visitedPage is a new Step (1)')
    assert.equal(appState.visitedPages[0].questionNumber, 2, 'should increment to next question number to a visitedPage of same Step (1)')
  })
})
