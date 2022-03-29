import F from 'funcunit'
import $ from 'jquery'
import DefineMap from 'can-define/map/map'
import CanMap from 'can-map'
import stache from 'can-stache'
import { assert } from 'chai'
import PagesVM from './pages-vm'
import Lang from '~/src/mobile/util/lang'
import AnswerVM from '~/src/models/answervm'
import Answer from '~/src/models/answer'
import Page from '~/src/models/page'
import AppState from '~/src/models/app-state'
import MemoryState from '~/src/models/memory-state'
import FieldModel from '~/src/models/field'
import PersistedState from '~/src/models/persisted-state'
import TraceMessage from '~/src/models/trace-message'
import Interview from '~/src/models/interview'
import Logic from '~/src/mobile/util/logic'
import constants from '~/src/models/constants'
import moment from 'moment'
import sinon from 'sinon'
import './pages'
import 'steal-mocha'

describe('<a2j-pages>', () => {
  let vm
  let logic
  let nextPageStub
  let priorPageStub
  let interview
  let defaults
  let traceMessage

  beforeEach(() => {
    nextPageStub = new Page({
      name: 'Next',
      step: { number: '1', text: 'Step 1' },
      fields: []
    })

    priorPageStub = new Page({
      name: 'priorPage',
      step: { number: '1', text: 'Step 1' },
      fields: []
    })

    interview = new Interview({
      pages: [
        { nextPageStub, priorPageStub },
        {
          name: 'foo',
          fields: [
            { name: 'firstname', type: 'text', required: true },
            { name: 'lastname', type: 'text' }
          ],
          step: { number: '1', text: 'Step 1' },
          buttons: [{
            label: 'Continue',
            next: '3-Gender'
          }]
        },
        {
          name: 'priorPage',
          fields: [
            { name: 'firstname', type: 'text', required: true },
            { name: 'lastname', type: 'text' }
          ],
          step: { number: '1', text: 'Step 1' },
          buttons: [{
            label: 'Continue',
            next: '3-Gender'
          }]
        },
        {
          name: 'Next',
          fields: [
            { name: 'firstname', type: 'text', required: true },
            { name: 'lastname', type: 'text' }
          ],
          step: { number: '1', text: 'Step 1' },
          buttons: [{
            label: 'Continue',
            next: '3-Gender'
          }]
        }
      ]
    })

    logic = new Logic({ interview })
    // normally passed in via stache
    traceMessage = new TraceMessage()

    const currentPageName = 'Intro'

    defaults = {
      currentVisitedPage: {
        interviewPage: new Page({
          name: currentPageName,
          fields: [],
          repeatVar: '',
          text: 'welcome! %%[name]%%',
          textAudioURL: null,
          learn: '',
          codeBefore: '',
          codeAfter: '',
          buttons: null,
          step: { number: '0', text: 'Step 0' }
        })
      },
      lang: new Lang(),
      logic: logic,
      appState: new AppState({ interview, logic, traceMessage }),
      mState: new MemoryState(),
      interview,
      groupValidationMap: new DefineMap()
    }

    // initialize messages list in traceMessage
    traceMessage.currentPageName = currentPageName
  })

  describe('viewModel', () => {
    let appStateTeardown
    beforeEach(() => {
      vm = new PagesVM(defaults)
      defaults.appState.listenTo('page', () => vm.tryToVisitPage()) // in live app, this is bound in page.js events
      vm.connectedCallback()
      appStateTeardown = (td => () => {
        defaults.appState.stopListening('page')
        td()
      })(vm.appState.connectedCallback())
    })

    afterEach(() => {
      appStateTeardown()
    })

    describe('navigate', () => {
      it('handleServerPost', () => {
        let postCount = 0
        vm.listenTo('post-answers-to-server', () => {
          postCount++
        })
        const button = new DefineMap({ next: constants.qIDEXIT })

        vm.navigate(button)
        assert.equal(postCount, 1, 'should fire post event')

        button.next = constants.qIDASSEMBLE

        vm.navigate(button)
        assert.equal(postCount, 1, 'should not fire post for assemble only')
      })

      it('getNextPage - check for normal nav or GOTO logic', () => {
        const button = new DefineMap({ next: 'foo' })
        const currentPage = vm.currentPage
        const logic = vm.logic
        logic.guide.pages = { Next: nextPageStub }

        const normalNavPage = vm.navigate(button)
        assert.equal(normalNavPage, 'foo', 'logic gotoPage should override button "next" value')

        currentPage.codeAfter = 'GOTO "Next"'
        const gotoPage = vm.navigate(button)
        assert.equal(gotoPage, 'Next', 'logic gotoPage should override button "next" value')
      })

      it('handleCodeAfter - process After Logic', () => {
        const button = new DefineMap({ next: 'foo' })
        const currentPage = vm.currentPage
        let logicCount = 0

        vm.logic.exec = () => { logicCount++ }

        currentPage.codeAfter = 'GOTO [Next]'

        vm.navigate(button)

        assert.equal(logicCount, 1, 'should execute codeAfter logic')
      })

      it('pages with codeBefore goto logic should only add the target page to visitedPages instead', function () {
        // simulate logic changing gotoPage based on A2J codeBefore script
        vm.logic.attr('gotoPage', 'Intro')
        vm.logic.exec = function () { vm.logic.attr('gotoPage', 'foo') }
        interview.pages.push(vm.currentVisitedPage.interviewPage) // put Intro page on the interview
        vm.currentVisitedPage.interviewPage.codeBefore = 'a2j script is here, fired by logic.exec above to change gotoPage'

        const vpl = vm.appState.visitedPages.length // navigated to the interview's first page

        const button = new DefineMap({ next: 'Intro' })
        vm.navigate(button)

        assert.equal(vm.appState.visitedPages.length, vpl + 1, 'should only have one more visited page')
        assert.equal(vm.appState.page, 'foo', 'page name should be set by codeBefore script')
      })

      it('handlePreviewResponses', () => {
        const button = new DefineMap({ next: constants.qIDSUCCESS })

        vm.previewActive = true
        vm.navigate(button)
        const modalContent = vm.appState.modalContent

        assert.equal(modalContent.text, 'User\'s data would upload to the server.', 'modalContent should update to display modal when previewActive')
      })

      it('ignores navigate() logic if fields have errors', () => {
        const button = new DefineMap({ next: 'foo' })
        const fieldWithError = { _answerVm: { errors: true } }
        vm.currentPage.fields.push(fieldWithError)

        const shouldReturnFalse = vm.navigate(button)
        assert.equal(shouldReturnFalse, false, 'fields with errors return false')
      })

      it('navigates to prior question with BACK button', () => {
        const appState = vm.appState
        const visitedPages = appState.visitedPages
        const button = new DefineMap({ next: constants.qIDBACK })
        visitedPages.visit(new Page({ name: 'priorPage' }))
        visitedPages.visit(defaults.currentVisitedPage.interviewPage)

        // normally this updates automatically because currentVisitedPage is passed in via stache
        vm.currentVisitedPage = visitedPages.selected

        vm.navigate(button)
        assert.equal(appState.page, 'priorPage', 'should navigate to prior page')
      })

      it('saves answer when button has a value with special buttons as next target', () => {
        const answers = defaults.interview.answers

        answers.varCreate('kidstf', 'TF', true)

        const button = new DefineMap({
          label: 'Go!',
          next: constants.qIDFAIL,
          name: 'KidsTF',
          value: 'true',
          url: ''
        })

        vm.navigate(button)

        assert.deepEqual(answers.varGet('kidstf', 1), true,
          'saved value should be true')
      })

      it('saves answer when button has a value', () => {
        const answers = defaults.interview.answers

        answers.varCreate('kidstf', 'TF', false)

        const button = new DefineMap({
          label: 'Go!',
          next: 'Next',
          name: 'KidsTF',
          value: 'true'
        })

        vm.navigate(button)

        assert.deepEqual(answers.varGet('kidstf', 1), true,
          'first saved value should be true')
      })

      it('saves answer when button can hold multiple values', () => {
        const answers = defaults.interview.answers
        const page = defaults.currentVisitedPage.interviewPage

        answers.varCreate('AgesNU', 'Number', true)
        answers.varSet('AgesNU', 14, 1)
        answers.varSet('AgesNU', 12, 2)

        answers.varCreate('count', 'Number', true)
        answers.varSet('count', 3, 1)

        const button = new DefineMap({
          label: 'Go!',
          next: 'Next',
          name: 'AgesNU',
          value: '42'
        })

        // required to trigger mutli-value save
        page.repeatVar = 'count'

        vm.navigate(button)

        assert.deepEqual(answers.varGet('agesnu', 3), 42,
          'adds mutli value to index 3')
      })

      it('sets a2j interview incomplete tf to false when special buttons fired', () => {
        const answers = defaults.interview.answers
        const incompleteTF = constants.vnInterviewIncompleteTF.toLowerCase()

        answers.varCreate(incompleteTF, 'TF', false)
        answers.varSet(incompleteTF, true, 1)

        const specialButton = new DefineMap({
          label: 'Special!',
          next: constants.qIDSUCCESS
        })

        vm.navigate(specialButton)
        assert.equal(answers.varGet(incompleteTF, 1), false, 'success button should complete interview')
      })

      it('handleCrossedUseOfResumeOrBack', () => {
        const button = new DefineMap({ next: constants.qIDBACK })
        let buttonNextTarget = vm.handleCrossedUseOfResumeOrBack(button, true)
        assert.equal(buttonNextTarget, constants.qIDRESUME, 'should update BackToPriorQuestion to Resume if on exitPage')

        button.next = constants.qIDRESUME
        buttonNextTarget = vm.handleCrossedUseOfResumeOrBack(button, false)
        assert.equal(buttonNextTarget, constants.qIDBACK, 'should update Resume to BackToPriorQuestion if not on exitPage')

        button.next = 'Foo'
        buttonNextTarget = vm.handleCrossedUseOfResumeOrBack(button, true)
        assert.equal(buttonNextTarget, 'Foo', 'should not change the next target if not either Back or Resume button, even on exitPage')
      })
    })

    it('validateAllFields', () => {
      let hasErrors = vm.validateAllFields()
      assert.isFalse(hasErrors, 'should return false if there are no fields')

      vm.currentPage.fields = [{ name: 'foo', _answerVm: { errors: true } }, { name: 'bar', _answerVm: { errors: false } }]
      hasErrors = vm.validateAllFields()
      assert.isTrue(hasErrors, 'should return true if as at least one field is invalid')
      assert.isTrue(vm.currentPage.fields[0].hasError, 'should set the field model hasError prop to true')
      assert.isTrue(vm.groupValidationMap.foo, 'should update the groupValidationMap for the matching field.name to true')

      vm.currentPage.fields = [{ name: 'foo', _answerVm: { errors: false } }, { name: 'bar', _answerVm: { errors: false } }]
      hasErrors = vm.validateAllFields()
      assert.isFalse(hasErrors, 'should return false if no fields are invalid')
      assert.isFalse(vm.currentPage.fields[0].hasError, 'should set the field model hasError prop to false')
      assert.isFalse(vm.groupValidationMap.foo, 'should update the groupValidationMap for the matching field.name to false')
    })

    it('setRepeatVariable', () => {
      const answers = defaults.interview.answers
      answers.varCreate('count', 'Number', false)

      const button = new DefineMap({
        repeatVar: 'counter',
        repeatVarSet: constants.RepeatVarSetOne
      })

      vm.setRepeatVariable(button)
      assert(vm.logic.varGet('counter'), 1, 'sets initial value to 1')

      button.repeatVarSet = constants.RepeatVarSetPlusOne

      vm.setRepeatVariable(button)
      assert(vm.logic.varGet('counter'), 1, 'increments counter to 2')
    })

    it('setFieldAnswers with repeatVar', () => {
      const answers = defaults.interview.answers
      answers.varCreate('salaryCount', 'Number', false)
      answers.varSet('salaryCount', 2, 1)
      answers.varCreate('salary', 'Number', false)
      answers.varSet('salary', 101, 1)
      answers.varSet('salary', 202, 2)

      vm.currentPage.repeatVar = 'salaryCount'

      const fields = vm.currentPage.fields
      fields.push({ name: 'salary', type: 'number' })

      vm.setFieldAnswers(fields, vm.currentVisitedPage)
      const field = vm.currentPage.fields[0]
      const answerValues = field._answerVm.answer.values

      assert.deepEqual(answerValues.serialize(), [null, 101, 202], 'should set repeatVarValues')
    })

    describe('default values', () => {
      it('sets default value', () => {
        const field = new FieldModel({
          name: 'StateTE',
          label: 'Enter State:',
          type: 'Text',
          value: 'Texas'
        })

        vm.answers.varCreate('statete', 'Text', false)

        vm.currentPage.fields.push(field)
        vm.appState.page = 'Next' // page find() always returns nextPageStub

        vm.setFieldAnswers(vm.currentPage.fields, vm.currentVisitedPage)

        assert.equal(vm.answers.varGet('statete', 1), 'Texas', 'Default values override empty answers')
      })

      it('handles datemdy default values of TODAY', () => {
        const field = new FieldModel({
          name: 'bDay DA',
          label: 'Enter Birthday:',
          type: 'datemdy',
          value: 'TODAY'
        })
        const answer = new Answer({
          name: 'bday da',
          type: 'datemdy'
        })
        const fields = [field]
        const answerIndex = 1
        const avm = new AnswerVM({ field, answerIndex, answer, fields })
        const returnedAnswerVm = vm.setDefaultValue(field, avm, answer, answerIndex)
        const expectedDate = moment().format('MM/DD/YYYY')

        assert.equal(returnedAnswerVm.values, expectedDate, 'it should set todays date with special keyword')
      })

      it('ignores default value if previous answer exists', () => {
        const field = new FieldModel({
          name: 'StateTE',
          label: 'Enter State:',
          type: 'text',
          value: 'Texas'
        })

        vm.answers.varCreate('statete', 'Text', false)
        vm.answers.varSet('statete', 'Illinois', 1)

        nextPageStub.fields.push(field)
        vm.appState.page = 'Next' // page find() always returns nextPageStub

        vm.setFieldAnswers(vm.currentPage.fields, vm.currentVisitedPage)

        assert.equal(vm.answers.varGet('statete', 1), 'Illinois', 'Saved answers trump Default Values')
      })

      it('handles number defaults with zero', () => {
        const field = new FieldModel({
          name: 'SomeNum',
          label: 'Enter SomeNum:',
          type: 'number',
          value: '0'
        })

        vm.answers.varCreate('somenum', 'Number', false)

        vm.currentPage.fields.push(field)
        vm.appState.page = 'Next' // page find() always returns nextPageStub

        vm.setFieldAnswers(vm.currentPage.fields, vm.currentVisitedPage)

        assert.strictEqual(vm.answers.varGet('somenum', 1), 0, 'Sets default number values')
      })

      it('handles numberdollar defaults with decimals', () => {
        const field = new FieldModel({
          name: 'Salary',
          label: 'Enter Salary:',
          type: 'numberdollar',
          value: '1234.56'
        })

        vm.answers.varCreate('salary', 'numberdollar', false)

        vm.currentPage.fields.push(field)
        vm.appState.page = 'Next' // page find() always returns nextPageStub

        vm.setFieldAnswers(vm.currentPage.fields, vm.currentVisitedPage)

        assert.strictEqual(vm.answers.varGet('salary', 1), 1234.56, 'Sets default number values')
      })
    })
  })

  describe('Component', () => {
    describe('setFieldAnswers', () => {
      let appStateTeardown

      beforeEach(() => {
        const frag = stache(
          '<a2j-pages></a2j-pages>'
        )
        $('#test-area').html(frag())
        vm = $('a2j-pages')[0].viewModel
        vm.set(defaults)
        vm.connectedCallback()
        appStateTeardown = vm.appState.connectedCallback()
      })

      afterEach(() => {
        appStateTeardown()
        $('#test-area').empty()
      })

      it.skip('fires setFieldAnswers to update repeat loops', () => {
        const setFieldAnswersSpy = sinon.spy()
        vm.setFieldAnswers = setFieldAnswersSpy
        const button = new CanMap({ next: 'Next' })
        vm.navigate(button)
        assert.equal(setFieldAnswersSpy.calledOnce, true, 'should call setFieldAnswers once if no repeat loop')

        vm.attr('appState.repeatVarValue', 1)
        vm.navigate(button)
        assert.equal(setFieldAnswersSpy.callCount, 2, 'should call setFieldAnswers twice with repeat loop')
      })
    })

    describe('preview button', function () {
      describe('when a preview can be rendered', function () {
        let appStateTeardown, componentTeardown

        beforeEach(() => {
          const frag = stache(`
            <a2j-pages
              appState:from="appState"
              currentVisitedPage:from="appState.currentVisitedPage"
              interview:from="interview"
              lang:from="lang"
              pState:from="pState"
            />
          `)
          const interviewWithAssembleButtons = new Interview({
            firstPage: 'fooPage',
            pages: [
              { nextPageStub, priorPageStub },
              new Page({
                buttons: [
                  {
                    label: 'Assemble',
                    next: constants.qIDASSEMBLE
                  }
                ],
                name: 'fooPage',
                step: { number: '1', text: 'Foo Test' }
              })
            ]
          })

          const testLogic = new Logic({ interview: interviewWithAssembleButtons })
          const vmData = {
            appState: new AppState({
              interview: interviewWithAssembleButtons,
              logic: testLogic
            }),
            currentVisitedPage: {
              interviewPage: interviewWithAssembleButtons.pages[0]
            },
            interview: interviewWithAssembleButtons,
            lang: new Lang(),
            pState: new PersistedState()
          }

          // stub app-state parseText helper
          stache.registerHelper('parseText', (text) => text)

          $('#test-area').html(frag(vmData))

          vmData.appState.page = 'fooPage'

          vm = $('a2j-pages')[0].viewModel
          componentTeardown = vm.connectedCallback()
          appStateTeardown = vm.appState.connectedCallback()
        })

        afterEach(() => {
          appStateTeardown()
          componentTeardown()
          $('#test-area').empty()
        })

        it('shows when a preview can be rendered ', done => {
          const buttons = F('a2j-pages button')
          buttons.visible('should have visible buttons')
          buttons.size(2, 'should have two buttons')
          F(() => {
            assert.strictEqual(buttons[0].innerText, 'Assemble', 'first button should be to assemble')
            assert.strictEqual(buttons[1].innerText, 'Open document preview', 'second button should be for showing the modal')
          })
          F(done)
        })
      })
    })
  })
})
