import $ from 'jquery'
import { assert } from 'chai'
import stache from 'can-stache'
import AppState from 'caja/viewer/models/app-state'
import Interview from 'caja/viewer/models/interview'
import Logic from 'caja/viewer/mobile/util/logic'
import constants from 'caja/viewer/models/constants'
import { ViewerNavigationVM } from 'caja/viewer/desktop/navigation/'
import canReflect from 'can-reflect'
import 'caja/viewer/models/fixtures/'

import 'steal-mocha'

describe('<a2j-viewer-navigation>', function () {
  describe('viewModel', function () {
    let vm
    let pages
    let visited
    let rState
    let interview
    let logic

    beforeEach(function (done) {
      let promise = Interview.findOne({ url: '/interview.json' })

      promise.then(function (_interview) {
        interview = _interview
        interview.attr('answers', { 'a2j interview incomplete tf': {values: []} })
        rState = new AppState({ interview })
        pages = interview.attr('pages')
        visited = canReflect.getKeyValue(rState, 'visitedPages')
        logic = new Logic({ interview })
        vm = new ViewerNavigationVM({ rState, interview, logic })

        done()
      })
    })

    it('collects feedback form data', function () {
      // simulate user is on interview second page.
      let secondPage = pages.attr(1)
      vm.selectedPageName = secondPage.attr('name')

      assert.deepEqual(vm.feedbackData, {
        questionid: secondPage.attr('name'),
        questiontext: secondPage.attr('text'),
        interviewid: interview.attr('version'),
        viewerversion: constants.A2JVersionNum,
        emailto: interview.attr('emailContact'),
        interviewtitle: interview.attr('title')
      })
    })

    it('canSaveAndExit', function () {
      // true only if rState.lastPageBeforeExit has a non falsy value
      // and interview.attr('exitPage') NOT being constants.qIDNOWHERE
      rState.lastPageBeforeExit = ''
      interview.attr('exitPage', constants.qIDNOWHERE)
      assert.isFalse(vm.canSaveAndExit)

      // lastPageBeforeExit having a value means you've already hit Save&Exit button
      rState.lastPageBeforeExit = '2-Name'
      interview.attr('exitPage', '1-Exit')
      assert.isFalse(vm.canSaveAndExit)

      // exit page assigned, but Save&Exit button not hit
      rState.lastPageBeforeExit = ''
      interview.attr('exitPage', '1-Exit')
      assert.isTrue(vm.canSaveAndExit)
    })

    it('canResumeInterview - whether Resume button should be enabled', function () {
      rState.lastPageBeforeExit = ''
      assert.isFalse(vm.canResumeInterview)

      rState.lastPageBeforeExit = '1-Intro'
      assert.isTrue(vm.canResumeInterview)
    })

    it('resumeInterview', function () {
      // navigate to first page
      visited.unshift(pages.attr(0))
      vm.selectedPageIndex = 0

      // navigate to second page
      visited.unshift(pages.attr(1))
      vm.selectedPageIndex = 0

      // navigate to exit page by normal nav (not Author best practice)
      visited.unshift(pages.attr(2))
      vm.selectedPageIndex = 0

      vm.resumeInterview()
      assert.equal(visited.length, 2, 'should remove the normal nav page from visitedPages on Resume')
    })

    it('canNavigateBack - whether back button should be enabled', function () {
      // navigate to first page
      visited.unshift(pages.attr(0))
      vm.selectedPageIndex = 0
      assert.isFalse(vm.canNavigateBack, 'false if only one page visited')

      // navigate to second page
      visited.unshift(pages.attr(1))
      vm.selectedPageIndex = 0
      assert.isTrue(vm.canNavigateBack, 'true when on last page')

      // go back to first page
      vm.selectedPageIndex = 1
      assert.isFalse(vm.canNavigateBack, 'false when on first page')
    })

    it('canNavigateForward - whether next button should be enabled', function () {
      // navigate to first page
      visited.unshift(pages.attr(0))
      vm.selectedPageIndex = 0
      assert.isFalse(vm.canNavigateForward, 'false if only one page visited')

      // navigate to second page
      visited.unshift(pages.attr(1))
      vm.selectedPageIndex = 0
      assert.isFalse(vm.canNavigateForward, 'false when on the last page')

      // go back to first page
      vm.selectedPageIndex = 1
      assert.isTrue(vm.canNavigateForward, 'true when on the first page')
    })

    it('navigateBack', () => {
      visited.unshift(pages.attr(2))
      visited.unshift(pages.attr(1))
      visited.unshift(pages.attr(0))

      // select most recent page
      vm.selectedPageIndex = 0

      vm.navigateBack()
      assert.equal(vm.selectedPageIndex, 1, 'should navigate to middle page')

      vm.navigateBack()
      assert.equal(vm.selectedPageIndex, 2, 'should navigate to oldest page')
    })

    it('navigateForward', () => {
      visited.unshift(pages.attr(2))
      visited.unshift(pages.attr(1))
      visited.unshift(pages.attr(0))

      // select oldest page
      vm.selectedPageIndex = 2

      vm.navigateForward()
      assert.equal(vm.selectedPageIndex, 1, 'should navigate to middle page')

      vm.navigateForward()
      assert.equal(vm.selectedPageIndex, 0, 'should navigate to most recent page')
    })

    it('disableOption', () => {
      assert.equal(vm.disableOption(0), false, 'false by default even with index 0')

      // saveAndExitActive is derived from rState.lastPageBeforeExit having a value
      rState.lastPageBeforeExit = '2-Name'
      assert.equal(vm.disableOption(0), false, 'false if index is 0 and saveAndExitActive is true')
      assert.equal(vm.disableOption(1), true, 'true if index is NOT 0 and saveAndExitActive is true')
    })

    it('buildOptions', function () {
      const visitedPages = [
        { text: 'Welcome to the interview', step: { number: '0' }, questionNumber: 1, repeatVarValue: undefined },
        { text: 'Enter your info, as this is a very long question text', step: { number: '0' }, questionNumber: 2, repeatVarValue: 1 }
      ]
      const buildOptions = vm.buildOptions(visitedPages)
      const expectedOptions = [
        'Step 0 Q1: Welcome to the interview',
        'Step 0 Q2: Enter your info, as this is a very... #1'
      ]

      assert.equal(buildOptions.length, 2, 'should build an option for each page in visitedPages')
      assert.deepEqual(buildOptions, expectedOptions, 'maps visitedPages info to the list of options')
    })

    it('parseFunctionMacro', () => {
      let functionString = 'ORDINAL([loopCount])'
      let functionMacros = vm.parseFunctionMacro(functionString)
      let expectedResults = { funcName: 'ordinal', funcArgs: ['loopCount'] }

      assert.deepEqual(functionMacros, expectedResults, 'should parse out function name and arguments')

      functionString = 'CONTAINS([some text TE], "some test string")'
      functionMacros = vm.parseFunctionMacro(functionString)
      expectedResults = { funcName: 'contains', funcArgs: ['some text TE', 'some test string'] }

      assert.deepEqual(functionMacros, expectedResults, 'should parse CONTAINS, the only macro function with 2 arguments, a variable and string')
    })

    it('findMacros', () => {
      const macroPatterns = [
        { questionText: 'No Space Var %%someVar%%', expectedFoundMacros: ['%%someVar%%'] },
        { questionText: 'Classic Var %%[First name TE]%%', expectedFoundMacros: ['%%[First name TE]%%'] },
        { questionText: 'Parens only %%(First name TE)%%', expectedFoundMacros: ['%%(First name TE)%%'] },
        { questionText: 'Parens&Brackets %%([First name TE])%%', expectedFoundMacros: ['%%([First name TE])%%'] },
        { questionText: 'Whitespace Pairs %% ( [ First name TE ])%%', expectedFoundMacros: ['%% ( [ First name TE ])%%'] },
        { questionText: 'Function %%DOLLAR([Salary NU])%%', expectedFoundMacros: ['%%DOLLAR([Salary NU])%%'] },
        { questionText: 'Edge Case %%CONTAINS([Message TE#loopCount], "string to test for match")%%', expectedFoundMacros: ['%%CONTAINS([Message TE#loopCount], "string to test for match")%%'] },
        { questionText: 'combo %%[First name TE]%% makes %%DOLLAR([Salary NU])%% per year', expectedFoundMacros: ['%%[First name TE]%%', '%%DOLLAR([Salary NU])%%'] },
        { questionText: 'contains edge case %%[First name TE]%% is found in %%CONTAINS([First name TE], "some string to test")%%', expectedFoundMacros: ['%%[First name TE]%%', '%%CONTAINS([First name TE], "some string to test")%%'] }
      ]
      macroPatterns.forEach(({ questionText, expectedFoundMacros }) => {
        const foundMacros = vm.findMacros(questionText)
        assert.deepEqual(foundMacros, expectedFoundMacros, 'should find A2J Macros in question text')
      })
    })

    it('sortMacros', () => {
      const questionText = 'Basic %%[first name TE]%%, Parens %%([first name TE])%%, Function %%DOLLAR(salary NU)%% Edge Case %%CONTAINS([message TE#loopCount], "hooray")%%'
      const foundMacros = vm.findMacros(questionText)
      const sortedMacros = vm.sortMacros(foundMacros)

      const expectedResults = [
        { type: 'variable', replaceText: '%%[first name TE]%%', resolveText: '[first name TE]' },
        { type: 'variable', replaceText: '%%([first name TE])%%', resolveText: '([first name TE])' },
        { type: 'function', replaceText: '%%DOLLAR(salary NU)%%', resolveText: 'DOLLAR(salary NU)' },
        { type: 'function', replaceText: '%%CONTAINS([message TE#loopCount], "hooray")%%', resolveText: 'CONTAINS([message TE#loopCount], "hooray")' }
      ]

      assert.deepEqual(sortedMacros, expectedResults, 'should find A2J Macros in question text')
    })

    it('varGet(varName, numberOrCountingVar, visitedPageRepeatVarValue)', function () {
      interview.answers.varCreate('name', 'Text', true) // varName, type, repeating
      interview.answers.varCreate('color', 'Text', false)
      interview.answers.varCreate('loopCount', 'Number', false)
      interview.answers.varSet('name', 'Fred', 1) // varName, value, index
      interview.answers.varSet('name', 'JessBob', 2)
      interview.answers.varSet('name', 'SpecialName', 3)
      interview.answers.varSet('color', 'red', 1)
      interview.answers.varSet('loopCount', 1, 1)

      const varValue = vm.varGet('color', undefined, null)
      assert.equal(varValue, 'red', 'should get current var value if no #countVar set or not in loop')

      const multiVarValue = vm.varGet('name', undefined, null)
      assert.equal(multiVarValue, 'Fred, JessBob and SpecialName', 'should get readable list if multi values but no #countVar set or not in loop')

      const explicitIndexValue = vm.varGet('name', 3, null)
      assert.equal(explicitIndexValue, 'SpecialName', 'should get explicitly indexed value, even if in loop')

      const varValueWithLoopVar = vm.varGet('name', 'loopCount', 2)
      assert.equal(varValueWithLoopVar, 'JessBob', 'visitedPageRepeatVarValue(2) should override loopCount indexing')

      const countingVarInRepeatLoop = vm.varGet('loopCount', undefined, 2)
      assert.equal(countingVarInRepeatLoop, 2, 'should return the visitedPageRepeatVarValue if no #countingVar, but has repeatVarValue')
    })

    it('resolveMacros - Variable lookup', () => {
      const sortedMacros = [
        { type: 'variable', replaceText: '%%[First name TE#3]%%', resolveText: '[First name TE#3]' },
        { type: 'variable', replaceText: '%%([First name TE#loopCount])%%', resolveText: '([First name TE#loopCount])' }
      ]

      interview.answers.varCreate('First name TE', 'Text', true)
      interview.answers.varCreate('loopCount', 'Number', false)
      interview.answers.varSet('First name TE', 'Fred', 1)
      interview.answers.varSet('First name TE', 'JessBob', 2)
      interview.answers.varSet('First name TE', 'Third', 3)
      interview.answers.varSet('loopCount', 1, 1)

      let visitedPageRepeatVarValue = null
      let resolvedMacros = vm.resolveMacros(sortedMacros, visitedPageRepeatVarValue)
      let expectedResults = [
        { replaceText: '%%[First name TE#3]%%', displayValue: 'Third' },
        { replaceText: '%%([First name TE#loopCount])%%', displayValue: 'Fred, JessBob and Third' }
      ]

      assert.deepEqual(resolvedMacros, expectedResults, 'without repeatVarValue, explicit #index honored, but single value or readable list returned')

      visitedPageRepeatVarValue = 2
      resolvedMacros = vm.resolveMacros(sortedMacros, visitedPageRepeatVarValue)
      expectedResults = [
        { replaceText: '%%[First name TE#3]%%', displayValue: 'Third' },
        { replaceText: '%%([First name TE#loopCount])%%', displayValue: 'JessBob' }
      ]

      assert.deepEqual(resolvedMacros, expectedResults, 'with repeatVarValue, explicit #index honored, otherwise value indexed by repeatVarValue is returned')
    })

    it('resolveMacros - Function lookup', () => {
      interview.answers.varCreate('First name TE', 'Text', true)
      interview.answers.varCreate('number NU', 'Number', true)
      interview.answers.varCreate('date DA', 'Date', true)
      interview.answers.varCreate('loopCount', 'Number', false)
      interview.answers.varSet('First name TE', 'Fred', 1)
      interview.answers.varSet('First name TE', 'Female', 2)
      interview.answers.varSet('Some number NU', 3, 1)
      interview.answers.varSet('Some number NU', 9.345, 2)
      interview.answers.varSet('date DA', '01/01/2000', 1)
      interview.answers.varSet('date DA', 1000, 2)
      interview.answers.varSet('loopCount', 1, 1)

      const sortedMacros = [
        { type: 'function', replaceText: '%%AGE([date DA#loopCount])%%', resolveText: 'AGE([date DA#loopCount])', expectedValue: 20, repeatVarValue: 1 },
        { type: 'function', replaceText: '%%DATE([date DA#2])%%', resolveText: 'DATE([date DA#2])', expectedValue: '09/27/1972' },
        { type: 'function', replaceText: '%%DOLLAR([Some number NU#1])%%', resolveText: 'DOLLAR([Some number NU#1])', expectedValue: '3.00' },
        { type: 'function', replaceText: '%%HASANSWERED([First name TE#1])%%', resolveText: 'HASANSWERED([First name TE#1])', expectedValue: true },
        { type: 'function', replaceText: '%%HISHER([First name TE#2])%%', resolveText: 'HISHER([First name TE#2])', expectedValue: 'her' },
        { type: 'function', replaceText: '%%HESHE([First name TE#2])%%', resolveText: 'HESHE([First name TE#2])', expectedValue: 'she' },
        { type: 'function', replaceText: '%%HIMHER([First name TE#2])%%', resolveText: 'HIMHER([First name TE#2])', expectedValue: 'her' },
        { type: 'function', replaceText: '%%ORDINAL([Some number NU#1])%%', resolveText: 'ORDINAL([Some number NU#1])', expectedValue: 'third' },
        { type: 'function', replaceText: '%%ROUND([Some number NU#2])%%', resolveText: 'ROUND([Some number NU#2])', expectedValue: 9 },
        { type: 'function', replaceText: '%%ROUND2([Some number NU#2])%%', resolveText: 'ROUND2([Some number NU#2])', expectedValue: 9.35 },
        { type: 'function', replaceText: '%%SUM([Some number NU])%%', resolveText: 'SUM([Some number NU])', expectedValue: 12.345 },
        { type: 'function', replaceText: '%%DATE(TODAY)%%', resolveText: 'DATE(TODAY)', expectedValue: () => { return vm.logic.eval('%%DATE(TODAY)%%') } },
        { type: 'function', replaceText: '%%TRUNC([Some number NU#2])%%', resolveText: 'TRUNC([Some number NU#2])', expectedValue: 9 },
        { type: 'function', replaceText: '%%TRUNC2([Some number NU#2])%%', resolveText: 'TRUNC2([Some number NU#2])', expectedValue: 9.34 },
        { type: 'function', replaceText: '%%CONTAINS([First name TE#1], "red")%%', resolveText: 'CONTAINS([First name TE#1], "red")', expectedValue: true }
      ]

      sortedMacros.forEach((data, index) => {
        const visitedPageRepeatVarValue = data.repeatVarValue || null
        const expectedResults = [
          {
            replaceText: data.replaceText,
            displayValue: (typeof data.expectedValue) === 'function' ? data.expectedValue() : data.expectedValue
          }
        ]

        const resolvedMacros = vm.resolveMacros([sortedMacros[index]], visitedPageRepeatVarValue)
        assert.deepEqual(resolvedMacros, expectedResults, `should resolve ${data.resolveText} to ${data.expectedValue}`)
      })
    })

    it('replaceMacros', () => {
      const questionText = 'Hello %%[First name TE#1]%%, you said your age was %%AGE([date DA#loopCount])%%. The word red is in your name: %%CONTAINS([First name TE#1], "red")%%!'
      const resolvedMacros = [
        { replaceText: '%%[First name TE#1]%%', displayValue: 'Fred' },
        { replaceText: '%%AGE([date DA#loopCount])%%', displayValue: 32 },
        { replaceText: '%%CONTAINS([First name TE#1], "red")%%', displayValue: true }
      ]

      const displayText = vm.replaceMacros(resolvedMacros, questionText)
      const expectedText = 'Hello Fred, you said your age was 32. The word red is in your name: true!'

      assert.equal(displayText, expectedText, 'should replace macro syntax in a string with displayValue text')
    })

    it('formatOptionData', function () {
      const option = {
        text: 'Hello Fred, you said your age was 32. The word red is in your name: true!',
        repeatVarValue: 2,
        stepNumber: '0',
        questionNumber: 3
      }
      const displayText = vm.formatOptionData(option)
      const expectedText = 'Step 0 Q3: Hello Fred, you said your age was... #2'

      assert.equal(displayText, expectedText, 'should prepend step & question number to page text and then truncate the result')
    })
  })

  describe('Component', function () {
    let pages
    let visited
    let interview
    let rState
    let vm // eslint-disable-line
    let lang
    let logic

    beforeEach(function (done) {
      let promise = Interview.findOne({ url: '/interview.json' })

      promise.then(function (_interview) {
        interview = _interview
        rState = new AppState()
        lang = {
          GoNext: 'Next',
          GoBack: 'Back',
          MyProgress: 'My Progress',
          SaveAndExit: 'Save & Exit',
          ResumeExit: 'Resume',
          SendFeedback: 'Send Feedback'
        }

        pages = interview.attr('pages')
        visited = canReflect.getKeyValue(rState, 'visitedPages')
        logic = new Logic({ interview })
        vm = new ViewerNavigationVM({ rState, interview, lang, logic })

        let frag = stache(
          `<a2j-viewer-navigation interview:from="interview"
            rState:from="rState" lang:from="lang"
            showDemoNotice:bind="showDemoNotice"
            logic:from="logic" />`
        )

        $('#test-area').html(frag({
          rState,
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
      visited.unshift(pages.attr(0))
      visited.unshift(pages.attr(1))
      // connect listeners, specifically for selectedPageIndexSet
      vm.connectedCallback()
      // fire rState event
      rState.dispatch('selectedPageIndexSet')
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
      rState.lastPageBeforeExit = '1-Intro'
      assert.equal($('.can-exit').length, 0, 'Resume button should not be rendered')

      // turn on Resume button when Exit button has been clicked
      rState.lastPageBeforeExit = '1-Intro'
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

    it('shows a Skip to Main Content button when focused by keyboard navigation', function (done) {
      vm.connectedCallback()
      const $focusTarget = $('.focus-main-content a')
      $focusTarget.focus()
      setTimeout(() => {
        const text = $focusTarget.text()
        assert.equal(text, 'Skip to Main Content', 'should update element text while showing button')
        done()
      })
    })
  })
})
