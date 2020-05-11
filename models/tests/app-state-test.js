import { assert } from 'chai'
import AppState from 'caja/viewer/models/app-state'
import Interview from 'caja/viewer/models/interview'
import Infinite from 'caja/viewer/mobile/util/infinite'
import DefineMap from 'can-define/map/map'
import CanMap from 'can-map'
import sinon from 'sinon'

import 'steal-mocha'

describe('AppState', function () {
  let appState // DefineMap
  let pageNames
  let pages
  let interview
  let answers
  let logic
  let traceMessage
  let appStateTeardown

  beforeEach(function (done) {
    let promise = Interview.findOne({ url: '/interview.json' })

    promise.then(function (_interview) {
      interview = _interview
      answers = new CanMap()
      traceMessage = new DefineMap({ addMessage: sinon.stub() })
      interview.attr('answers', answers)

      logic = new CanMap({
        infinite: new Infinite(),
        eval: sinon.spy(),
        exec: sinon.spy(),
        varGet: sinon.stub(),
        varSet: sinon.stub(),
        gotoPage: ''
      })

      appState = new AppState({ interview, logic, traceMessage })
      // simulate stache bind on visitedPages
      appStateTeardown = appState.connectedCallback()

      // collect the actual page names of the interview
      pages = interview.attr('pages')
      pageNames = pages.map(page => page.attr('name'))

      done()
    })
  })

  afterEach(function () {
    appStateTeardown()
  })

  it('sets default avatar when no saved userAvatar value', function () {
    const defaultUserAvatar = { gender: 'female', isOld: false, hasWheelchair: false, hairColor: 'brownDark', skinTone: 'medium' }
    assert.deepEqual(appState.userAvatar.serialize(), defaultUserAvatar, 'should set defaultAvatar')
  })

  it('restores userAvatar from saved interview.answers ', function () {
    const savedAvatar = JSON.stringify({ gender: 'male', isOld: false, hasWheelchair: true, hairColor: 'red', skinTone: 'medium' })
    const answers = appState.interview.attr('answers')
    answers.attr('user avatar', { name: 'user avatar', values: [null, savedAvatar] })
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
    interview.attr('pages.1.repeatVar', 'childCount')
    logic.varGet.returns(1)
    appState.page = pageNames[1]

    assert.equal(appState.visitedPages.length, 1, 'appState.visitedPages should be correct length')
    assert.equal(appState.visitedPages[0].repeatVar, 'childCount', 'page has repeatVar')
    assert.equal(appState.visitedPages[0].repeatVarValue, '1', 'page has repeatVarValue')
  })

  it('handles following pages without repeatVarValues', function () {
    interview.attr('pages.1.repeatVar', 'childCount')
    logic.varGet.returns(1)
    appState.page = pageNames[1]

    assert.equal(appState.visitedPages.length, 1, 'appState.visitedPages should be correct length')
    assert.equal(appState.visitedPages[0].repeatVar, 'childCount', 'page has repeatVar')
    assert.equal(appState.visitedPages[0].repeatVarValue, '1', 'page has repeatVarValue')

    appState.page = pageNames[2]
    logic.varGet.returns(null)
    assert.equal(appState.visitedPages.length, 2, 'appState.visitedPages should be correct length')
    assert.equal(appState.visitedPages[0].repeatVar, '', 'page should not have repeatVar')
    assert.equal(appState.visitedPages[0].repeatVarValue, null, 'page has no repeatVarValue')
  })

  it('handles repeatVarValue changes with same page name', function () {
    interview.attr('pages.1.repeatVar', 'childCount')
    logic.varGet.returns(1)
    appState.page = pageNames[1]

    assert.equal(appState.visitedPages.length, 1, 'first page appState.visitedPages')
    assert.equal(appState.visitedPages[0].repeatVar, 'childCount', 'first page has repeatVar')
    assert.equal(appState.visitedPages[0].repeatVarValue, '1', 'first page has repeatVarValue')

    logic.varGet.returns(2)
    appState.page = pageNames[1]
    assert.equal(appState.visitedPages.length, 2, 'second page appState.visitedPages')
    assert.equal(appState.visitedPages[0].repeatVar, 'childCount', 'second page has repeatVar')
    assert.equal(appState.visitedPages[0].repeatVarValue, '2', 'second page has repeatVarValue')
  })

  it('pages with codeBefore goto logic should only add the target page to visitedPages instead', function () {
    // simulate logic changing gotoPage based on A2J codeBefore script
    logic.attr('gotoPage', pageNames[1])
    logic.exec = function () { logic.attr('gotoPage', pageNames[2]) }
    interview.attr('pages.0.codeBefore', 'a2j script is here, fired by logic.exec above to change gotoPage')

    appState.page = pageNames[0]

    assert.equal(appState.visitedPages.length, 1, 'should only have one visited page')
    assert.equal(appState.page, pageNames[2], 'page name should be set by codeBefore script')
  })

  it('sets the lastVisitedPageName to be used as a Back To Prior Question button target', function () {
    let lastVisitedPageName = appState.lastVisitedPageName
    assert.equal(lastVisitedPageName, undefined, 'defaults to undefined')

    appState.page = pageNames[0]
    lastVisitedPageName = appState.lastVisitedPageName
    assert.equal(lastVisitedPageName, pageNames[0], 'updates lastVisitedPage when page changes')

    appState.page = pageNames[1]
    lastVisitedPageName = appState.lastVisitedPageName
    assert.equal(lastVisitedPageName, pageNames[1], 'lastVisitedPage stays up to date when page changes')
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

    assert.equal(appState.visitedPages.shift().name, pageNames[2])
    assert.equal(appState.visitedPages.shift().name, pageNames[1])
    assert.equal(appState.visitedPages.shift().name, pageNames[0])
  })

  it('changing selectedPageIndex resolves page', () => {
    // populate visitedPages
    appState.page = pages.attr(2).name
    appState.page = pages.attr(1).name
    appState.page = pages.attr(0).name

    appState.selectedPageIndex = '1'

    assert.equal(
      appState.page,
      pages.attr(appState.selectedPageIndex).attr('name'),
      'should set appState.page to page 1'
    )

    appState.selectedPageIndex = '0'

    assert.equal(
      appState.page,
      pages.attr(appState.selectedPageIndex).attr('name'),
      'should set appState.page to page 1'
    )
  })

  it('selectedPageName', function () {
    // navigate to first page
    appState.page = pages.attr(0).name
    // navigate to second page
    appState.page = pages.attr(1).name

    appState.selectedPageIndex = 1
    assert.equal(appState.selectedPageName, pages.attr(0).attr('name'),
      'should return most recently visited page name')

    appState.selectedPageIndex = 0
    assert.equal(appState.selectedPageName, pages.attr(1).attr('name'),
      'should return second page name')
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
