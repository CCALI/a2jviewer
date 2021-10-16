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
      let promise = Interview.findOne({ url: '/interview.json' })

      promise.then(function (_interview) {
        interview = _interview
        interview.attr('answers', { 'a2j interview incomplete tf': {values: []} })
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
      let secondPage = pages[1]
      vm.appState.visitedPages.unshift(secondPage)

      assert.deepEqual(vm.feedbackData, {
        questionid: secondPage.name,
        questiontext: secondPage.text,
        interviewid: interview.attr('version'),
        viewerversion: constants.A2JVersionNum,
        emailto: interview.attr('emailContact'),
        interviewtitle: interview.attr('title')
      })
    })

    it('canSaveAndExit', function () {
      // true only if vm.appState.lastPageBeforeExit has a non falsy value
      // and interview.attr('exitPage') NOT being constants.qIDNOWHERE
      vm.appState.lastPageBeforeExit = ''
      interview.attr('exitPage', constants.qIDNOWHERE)
      assert.isFalse(vm.canSaveAndExit)

      // lastPageBeforeExit having a value means you've already hit Save&Exit button
      vm.appState.lastPageBeforeExit = '2-Name'
      interview.attr('exitPage', '1-Exit')
      assert.isFalse(vm.canSaveAndExit)

      // exit page assigned, but Save&Exit button not hit
      vm.appState.lastPageBeforeExit = ''
      interview.attr('exitPage', '1-Exit')
      assert.isTrue(vm.canSaveAndExit)
    })

    it('canResumeInterview - whether Resume button should be enabled', function () {
      vm.appState.lastPageBeforeExit = ''
      assert.isFalse(vm.canResumeInterview)

      vm.appState.lastPageBeforeExit = '1-Intro'
      assert.isTrue(vm.canResumeInterview)
    })

    it('resumeInterview', function () {
      // navigate to first page
      visited.unshift(pages[0])
      vm.appState.selectedPageIndex = 0

      // navigate to second page
      visited.unshift(pages[1])
      vm.appState.selectedPageIndex = 0

      // navigate to exit page by normal nav (not Author best practice)
      visited.unshift(pages[2])
      vm.appState.selectedPageIndex = 0

      vm.resumeInterview()
      assert.equal(visited.length, 2, 'should remove the normal nav page from visitedPages on Resume')
    })

    it('canNavigateBack - whether back button should be enabled', function () {
      vm.appState.connectedCallback()
      // navigate to first page
      visited.unshift(pages[0])
      vm.appState.selectedPageIndex = 0
      assert.isFalse(vm.canNavigateBack, 'false if only one page visited')

      // navigate to second page
      visited.unshift(pages[1])
      vm.appState.selectedPageIndex = 0
      assert.isTrue(vm.canNavigateBack, 'true when on last page')

      // go back to first page
      vm.appState.selectedPageIndex = 1
      assert.isFalse(vm.canNavigateBack, 'false when on first page')
    })

    it('canNavigateForward - whether next button should be enabled', function () {
      vm.appState.connectedCallback()
      // navigate to first page
      visited.unshift(pages[0])
      vm.appState.selectedPageIndex = 0
      assert.isFalse(vm.canNavigateForward, 'false if only one page visited')

      // navigate to second page
      visited.unshift(pages[1])
      vm.appState.selectedPageIndex = 0
      assert.isFalse(vm.canNavigateForward, 'false when on the last page')

      // go back to first page
      vm.appState.selectedPageIndex = 1
      assert.isTrue(vm.canNavigateForward, 'true when on the first page')
    })

    it('navigateBack', () => {
      vm.appState.connectedCallback()
      visited.unshift(pages[2])
      visited.unshift(pages[1])
      visited.unshift(pages[0])

      // select most recent page
      vm.appState.selectedPageIndex = 0

      vm.navigateBack()
      assert.equal(vm.appState.selectedPageIndex, 1, 'should navigate to middle page')

      vm.navigateBack()
      assert.equal(vm.appState.selectedPageIndex, 2, 'should navigate to oldest page')
    })

    it('navigateForward', () => {
      vm.appState.connectedCallback()
      visited.unshift(pages[2])
      visited.unshift(pages[1])
      visited.unshift(pages[0])

      // select oldest page
      vm.appState.selectedPageIndex = 2

      vm.navigateForward()
      assert.equal(vm.appState.selectedPageIndex, 1, 'should navigate to middle page')

      vm.navigateForward()
      assert.equal(vm.appState.selectedPageIndex, 0, 'should navigate to most recent page')
    })

    it('disableOption', () => {
      assert.equal(vm.disableOption(0), false, 'false by default even with index 0')

      // saveAndExitActive is derived from vm.appState.lastPageBeforeExit having a value
      vm.appState.lastPageBeforeExit = '2-Name'
      assert.equal(vm.disableOption(0), false, 'false if index is 0 and saveAndExitActive is true')
      assert.equal(vm.disableOption(1), true, 'true if index is NOT 0 and saveAndExitActive is true')
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
      let promise = Interview.findOne({ url: '/interview.json' })

      promise.then(function (_interview) {
        interview = _interview
        appState = new AppState()
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
        vm = new ViewerNavigationVM({ appState, interview, lang, logic })

        let frag = stache(
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
      visited.unshift(pages[0])
      visited.unshift(pages[1])
      // connect listeners, specifically for appState.selectedPageIndexSet
      vm.connectedCallback()
      // fire appState event
      vm.appState.dispatch('selectedPageIndexSet')
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

    it('shows/hides Exit button based on vm.canSaveAndExit', function () {
      // turn off Exit button following properties result in canSaveAndExit being false
      interview.attr('exitPage', constants.qIDNOWHERE)
      assert.equal($('.can-exit').length, 0, 'Exit button should not be rendered')

      // turn on Exit button only with valid Exit Point
      interview.attr('exitPage', '1-Exit')
      assert.equal($('.can-exit').length, 1, 'Exit button should be rendered')
    })

    it('shows/hides Resume button based on vm.canSaveAndExit', function () {
      // turn off Resume button when saveAndExitActive is false even when lastPageBeforeExit has a value
      vm.appState.lastPageBeforeExit = '1-Intro'
      assert.equal($('.can-exit').length, 0, 'Resume button should not be rendered')

      // turn on Resume button when Exit button has been clicked
      vm.appState.lastPageBeforeExit = '1-Intro'
      assert.equal($('.can-resume').length, 1, 'Resume button should be rendered')
    })

    it('shows custom courthouse image if provided', function () {
      let vm = $('a2j-viewer-navigation')[0].viewModel
      vm.courthouseImage = 'my-custom-courthouse.jpg'

      let courthouseSrc = $('img.courthouse').attr('src')
      assert.equal(courthouseSrc, 'my-custom-courthouse.jpg')
    })

    it('uses default courthouse image when custom not provided', function () {
      let vm = $('a2j-viewer-navigation')[0].viewModel
      vm.courthouseImage = null

      let courthouseSrc = $('img.courthouse').attr('src')
      assert.isTrue(courthouseSrc.indexOf('A2J5_CourtHouse.svg') !== -1)
    })
  })
})
