import $ from 'jquery'
import { assert } from 'chai'
import stache from 'can-stache'
import AppState from '~/src/models/app-state'
import Interview from '~/src/models/interview'
import Logic from '~/src/mobile/util/logic'
import constants from '~/src/models/constants'
import { ViewerNavigationVM } from '~/src/desktop/navigation/'
import canReflect from 'can-reflect'

import '@caliorg/a2jdeps/models/fixtures/'

import 'steal-mocha'

describe('<a2j-viewer-navigation>', function () {
  describe('viewModel', function () {
    let vm
    let pages
    let visited
    let appState
    let interview
    let logic

    beforeEach(function (done) {
      const promise = Interview.findOne({ url: '/interview.json' })

      promise.then(function (_interview) {
        interview = _interview
        interview.attr('answers', { 'a2j interview incomplete tf': { values: [] } })
        appState = new AppState({ interview })
        pages = interview.attr('pages')
        visited = canReflect.getKeyValue(appState, 'visitedPages')
        logic = new Logic({ interview })
        vm = new ViewerNavigationVM({ appState, interview, logic })

        done()
      })
    })

    it('collects feedback form data', function () {
      // simulate user navigates to interview second page.
      const secondPage = pages[1]
      vm.appState.visitedPages.visit(secondPage)

      assert.deepEqual(vm.feedbackData, {
        questionid: secondPage.name,
        questiontext: secondPage.text,
        interviewid: interview.attr('version'),
        viewerversion: constants.A2JVersionNum,
        emailto: interview.attr('emailContact'),
        interviewtitle: interview.attr('title')
      })
    })

    it('hasExitPage and currentVisitedPageIsExitPage', function () {
      interview.attr('exitPage', constants.qIDNOWHERE)
      assert.isFalse(vm.hasExitPage)

      const page1 = pages[0]
      vm.appState.visitedPages.visit(page1)
      assert.isFalse(vm.hasExitPage)
      assert.isFalse(vm.currentVisitedPageIsExitPage)
      interview.attr('exitPage', '1-Exit')
      assert.isTrue(vm.hasExitPage)
      assert.isFalse(vm.currentVisitedPageIsExitPage)

      interview.attr('exitPage', page1.name)
      assert.isTrue(vm.hasExitPage)
      assert.isTrue(vm.currentVisitedPageIsExitPage)
    })

    it('resumeInterview', function () {
      interview.attr('exitPage', pages[2].name)

      // navigate to first page
      visited.visit(pages[0])

      // navigate to second page
      visited.visit(pages[1])

      // navigate to exit page by normal nav (not Author best practice)
      visited.visit(pages[2])

      vm.resumeInterview()
      assert.equal(visited.length, 2, 'should remove the normal nav page from visitedPages on Resume')
    })

    it('canNavigateBack - whether back button should be enabled', function () {
      vm.appState.connectedCallback()
      // navigate to first page
      visited.visit(pages[0])
      assert.isFalse(visited.hasParent, 'false if only one page visited')

      // navigate to second page
      visited.visit(pages[1])
      assert.isTrue(visited.hasParent, 'true when on last page')

      // go back to first page
      visited.selected = visited.root
      assert.isFalse(visited.hasParent, 'false when on first page')
    })

    it('canNavigateForward - whether next button should be enabled', function () {
      vm.appState.connectedCallback()
      // navigate to first page
      visited.visit(pages[0])
      assert.isFalse(visited.hasNext, 'false if only one page visited')

      // navigate to second page
      visited.visit(pages[1])
      assert.isFalse(visited.hasNext, 'false when on the last page')

      // go back to first page
      visited.selected = visited.root
      assert.isTrue(visited.hasNext, 'true when on the first page')
    })

    it('navigateBack', () => {
      vm.appState.connectedCallback()
      visited.visit(pages[2])
      visited.visit(pages[1])
      visited.visit(pages[0])

      visited.selectParent()
      assert.equal(vm.appState.currentPage, pages[1], 'should navigate to middle page')

      visited.selectParent()
      assert.equal(vm.appState.currentPage, pages[2], 'should navigate to oldest page')
    })

    it('navigateForward', () => {
      vm.appState.connectedCallback()
      visited.visit(pages[2])
      visited.visit(pages[1])
      visited.visit(pages[0])

      // select oldest page
      visited.selected = visited.root

      visited.selectNext()
      assert.equal(vm.appState.currentPage, pages[1], 'should navigate to middle page')

      visited.selectNext()
      assert.equal(vm.appState.currentPage, pages[0], 'should navigate to most recent page')
    })
  })

  describe('Component', function () {
    let pages
    let visited
    let interview
    let appState
    let vm // eslint-disable-line
    let lang
    let logic

    beforeEach(function (done) {
      const promise = Interview.findOne({ url: '/interview.json' })

      promise.then(function (_interview) {
        interview = _interview
        appState = new AppState({ interview })
        lang = {
          GoNext: 'Next',
          GoBack: 'Back',
          MyProgress: 'My Progress',
          SaveAndExit: 'Save & Exit',
          ResumeExit: 'Resume',
          SendFeedback: 'Send Feedback'
        }

        pages = interview.attr('pages')
        visited = canReflect.getKeyValue(appState, 'visitedPages')
        logic = new Logic({ interview })

        const frag = stache(
          `<a2j-viewer-navigation interview:from="interview"
            appState:from="appState" lang:from="lang"
            showDemoNotice:bind="showDemoNotice"
            logic:from="logic" />`
        )

        $('#test-area').html(frag({
          appState,
          interview,
          lang,
          logic,
          showDemoNotice: false
        }))
        done()
      })
    })

    afterEach(function () {
      $('#test-area').empty()
    })

    it('renders pages history dropdown', function (done) {
      // navigate to a couple of pages
      visited.visit(pages[0])
      visited.visit(pages[1])

      setTimeout(() => {
        assert.equal($('select option').length, 2, 'just one page visited')
        done()
      })
    })

    it('shows/hides feedback button based on interview.sendfeedback', function () {
      // turn off feedback
      interview.attr('sendfeedback', false)
      assert.equal($('.send-feedback').length, 0, 'Feedback button should not be rendered')

      // turn on feedback
      interview.attr('sendfeedback', true)
      assert.equal($('.send-feedback').length, 1, 'Feedback button should be rendered')
    })

    it('shows/hides Exit button based on vm.currentVisitedPageIsExitPage', function () {
      // turn off Exit button following properties result in currentVisitedPageIsExitPage being false
      interview.attr('exitPage', constants.qIDNOWHERE)
      assert.equal($('.can-exit').length, 0, 'Exit button should not be rendered')

      // turn on Exit button only with valid Exit Point
      interview.attr('exitPage', '1-Exit')
      assert.equal($('.can-exit').length, 1, 'Exit button should be rendered')
    })

    it('shows/hides Resume button based on vm.hasExitPage', function () {
      interview.attr('exitPage', constants.qIDNOWHERE)
      visited.visit(pages[0])
      // turn off Resume button when hasExitPage is false
      assert.equal($('.can-resume').length, 0, 'Resume button should not be rendered')

      interview.attr('exitPage', pages[1].name)
      assert.equal($('.can-exit').length, 1, 'Exit button should be rendered if there is an exit page (and we\'re not on it)')
      assert.equal($('.can-resume').length, 0, 'Resume button should not be rendered if not on the exit page')

      // turn on Resume button when Exit button has been clicked
      visited.visit(pages[1])

      assert.equal($('.can-resume').length, 1, 'Resume button should be rendered')
    })

    it('shows custom courthouse image if provided', function () {
      const vm = $('a2j-viewer-navigation')[0].viewModel
      vm.courthouseImage = 'my-custom-courthouse.jpg'

      const courthouseSrc = $('img.courthouse').attr('src')
      assert.equal(courthouseSrc, 'my-custom-courthouse.jpg')
    })

    it('uses default courthouse image when custom not provided', function () {
      const vm = $('a2j-viewer-navigation')[0].viewModel
      vm.courthouseImage = null

      const courthouseSrc = $('img.courthouse').attr('src')
      assert.isTrue(courthouseSrc.indexOf('A2J5_CourtHouse.svg') !== -1)
    })
  })
})
