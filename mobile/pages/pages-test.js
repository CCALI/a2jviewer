import $ from 'jquery'
import CanMap from 'can-map'
import stache from 'can-stache'
import { assert } from 'chai'
import PagesVM from './pages-vm'
import AnswerVM from 'caja/viewer/models/answervm'
import AppState from 'caja/viewer/models/app-state'
import TraceMessage from 'caja/author/models/trace-message'
import Interview from 'caja/viewer/models/interview'
import Logic from 'caja/viewer/mobile/util/logic'
import constants from 'caja/viewer/models/constants'
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
    nextPageStub = new CanMap({
      name: 'Next',
      step: { number: '1', text: 'Step 1' },
      fields: []
    })

    priorPageStub = new CanMap({
      name: 'priorPage',
      step: { number: '1', text: 'Step 1' },
      fields: []
    })

    interview = new Interview({
      answers: new CanMap(),
      pages: new CanMap({nextPageStub, priorPageStub})
    })

    logic = new Logic({interview})
    // normally passed in via stache
    traceMessage = new TraceMessage()

    defaults = {
      currentPage: new CanMap({
        name: 'Intro',
        fields: [],
        repeatVar: '',
        text: 'welcome! %%[name]%%',
        textAudioURL: null,
        learn: '',
        codeAfter: '',
        buttons: null,
        step: { number: '0', text: 'Step 0' } }
      ),
      logic: logic,
      rState: new AppState({ interview, logic, traceMessage }),
      mState: { },
      interview,
      groupValidationMap: new CanMap()
    }

    // initialize messages list in traceMessage
    traceMessage.currentPageName = defaults.currentPage.name
  })

  describe('viewModel', () => {
    let appStateTeardown
    beforeEach(() => {
      vm = new PagesVM(defaults)
      vm.connectedCallback()
      appStateTeardown = vm.attr('rState').connectedCallback()
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
        const button = new CanMap({ next: constants.qIDEXIT })

        vm.navigate(button)
        assert.equal(postCount, 1, 'should fire post event')

        button.next = constants.qIDASSEMBLE

        vm.navigate(button)
        assert.equal(postCount, 1, 'should not fire post for assemble only')
      })

      it('getNextPage - check for normal nav or GOTO logic', () => {
        const button = new CanMap({ next: 'foo' })
        const currentPage = vm.attr('currentPage')
        const logic = vm.attr('logic')
        logic.guide.pages = { Next: nextPageStub }

        const normalNavPage = vm.navigate(button)
        assert.equal(normalNavPage, 'foo', 'logic gotoPage should override button "next" value')

        currentPage.attr('codeAfter', `GOTO "Next"`)
        const gotoPage = vm.navigate(button)
        assert.equal(gotoPage, 'Next', 'logic gotoPage should override button "next" value')
      })

      it('handleCodeAfter - process After Logic', () => {
        const button = new CanMap({ next: 'foo' })
        const currentPage = vm.attr('currentPage')
        let logicCount = 0

        vm.attr('logic').exec = () => { logicCount++ }

        currentPage.attr('codeAfter', 'GOTO [Next]')

        vm.navigate(button)

        assert.equal(logicCount, 1, 'should execute codeAfter logic')
      })

      it('handlePreviewResponses', () => {
        const button = new CanMap({ next: constants.qIDSUCCESS })

        vm.attr('previewActive', true)
        vm.navigate(button)
        const modalContent = vm.attr('modalContent')

        assert.equal(modalContent.text, `User's data would upload to the server.`, 'modalContent should update to display modal when previewActive')
      })

      it('ignores navigate() logic if fields have errors', () => {
        const button = new CanMap({ next: 'foo' })
        const fieldWithError = { _answerVm: { errors: true } }
        vm.attr('currentPage.fields').push(fieldWithError)

        const shouldReturnFalse = vm.navigate(button)
        assert.equal(shouldReturnFalse, false, 'fields with errors return false')
      })

      it('navigates to prior question with BACK button', () => {
        const rState = vm.attr('rState')
        const visitedPages = rState.visitedPages
        const button = new CanMap({ next: constants.qIDBACK })
        visitedPages[0] = defaults.currentPage
        visitedPages[1] = new CanMap({ name: 'priorPage' })

        vm.navigate(button)
        assert.equal(rState.page, 'priorPage', 'should navigate to prior page')
      })

      it('saves answer when button has a value with special buttons as next target', () => {
        let answers = defaults.interview.answers

        let kidstf = new CanMap({
          comment: '',
          name: 'KidsTF',
          repeating: true,
          type: 'TF',
          values: [null]
        })

        answers.attr('kidstf', kidstf)

        const button = new CanMap({
          label: 'Go!',
          next: constants.qIDFAIL,
          name: 'KidsTF',
          value: 'true',
          url: ''
        })

        vm.navigate(button)

        assert.deepEqual(answers.attr('kidstf.values.1'), true,
          'saved value should be true')
      })

      it('saves answer when button has a value', () => {
        let answers = defaults.interview.answers

        let kidstf = new CanMap({
          comment: '',
          name: 'KidsTF',
          repeating: true,
          type: 'TF',
          values: [null]
        })

        answers.attr('kidstf', kidstf)

        const button = new CanMap({
          label: 'Go!',
          next: 'Next',
          name: 'KidsTF',
          value: 'true'
        })

        vm.navigate(button)

        assert.deepEqual(answers.attr('kidstf.values.1'), true,
          'first saved value should be true')
      })

      it('saves answer when button can hold multiple values', () => {
        const answers = defaults.interview.answers
        const page = defaults.currentPage

        const agesnu = new CanMap({
          comment: '',
          name: 'AgesNU',
          repeating: true,
          type: 'Number',
          values: [null, 14, 12]
        })

        const count = new CanMap({
          comment: '',
          name: 'count',
          repeating: false,
          type: 'Number',
          values: [null, 3]
        })

        answers.attr('agesnu', agesnu)
        answers.attr('count', count)

        const button = new CanMap({
          label: 'Go!',
          next: 'Next',
          name: 'AgesNU',
          value: '42'
        })

        // required to trigger mutli-value save
        page.attr('repeatVar', 'count')

        vm.navigate(button)

        assert.deepEqual(answers.attr('agesnu.values.3'), 42,
          'adds mutli value to index 3')
      })

      it('sets a2j interview incomplete tf to false when special buttons fired', () => {
        const answers = defaults.interview.answers
        const incompleteTF = constants.vnInterviewIncompleteTF.toLowerCase()

        const incomplete = new CanMap({
          comment: '',
          name: incompleteTF,
          repeating: false,
          type: 'TF',
          values: [null, true]
        })

        const specialButton = new CanMap({
          label: 'Special!',
          next: constants.qIDSUCCESS
        })

        answers.attr(incompleteTF, incomplete)
        vm.navigate(specialButton)
        assert.equal(answers.attr(`${incompleteTF}.values.1`), false, 'success button should complete interview')
      })

      it('handleCrossedUseOfResumeOrBack', () => {
        const button = new CanMap({next: constants.qIDBACK})
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

      vm.attr('currentPage.fields', [{name: 'foo', _answerVm: {errors: true}}, {name: 'bar', _answerVm: {errors: false}}])
      hasErrors = vm.validateAllFields()
      assert.isTrue(hasErrors, 'should return true if at least one field is invalid')
      assert.isTrue(vm.attr('currentPage.fields.0.hasError'), 'should set the field model hasError prop to true')
      assert.isTrue(vm.attr('groupValidationMap').attr('foo'), 'should update the groupValidationMap for the matching field.name to true')

      vm.attr('currentPage.fields', [{name: 'foo', _answerVm: {errors: false}}, {name: 'bar', _answerVm: {errors: false}}])
      hasErrors = vm.validateAllFields()
      assert.isFalse(hasErrors, 'should return false if no fields are invalid')
      assert.isFalse(vm.attr('currentPage.fields.0.hasError'), 'should set the field model hasError prop to false')
      assert.isFalse(vm.attr('groupValidationMap').attr('foo'), 'should update the groupValidationMap for the matching field.name to false')
    })

    it('setRepeatVariable', () => {
      const answers = defaults.interview.answers
      const counter = new CanMap({
        comment: '',
        name: 'counter',
        repeating: false,
        type: 'Number',
        values: [null]
      })

      answers.attr('counter', counter)

      const button = new CanMap({
        repeatVar: 'counter',
        repeatVarSet: constants.RepeatVarSetOne
      })

      vm.setRepeatVariable(button)
      assert(vm.attr('logic').varGet('counter'), 1, 'sets initial value to 1')

      button.attr('repeatVarSet', constants.RepeatVarSetPlusOne)

      vm.setRepeatVariable(button)
      assert(vm.attr('logic').varGet('counter'), 1, 'increments counter to 2')
    })

    it('setFieldAnswers with repeatVar', () => {
      const answers = defaults.interview.answers
      const salaryCount = new CanMap({
        comment: '',
        name: 'salaryCount',
        repeating: false,
        type: 'NU',
        values: [null, 2]
      })

      const salary = new CanMap({
        comment: '',
        name: 'salary',
        repeating: true,
        type: 'NU',
        values: [null, 101, 202]
      })

      answers.attr('salary', salary)
      answers.attr('salaryCount', salaryCount)
      vm.attr('currentPage.repeatVar', 'salaryCount')

      const fields = vm.attr('currentPage.fields')
      fields.push({ name: 'salary', type: 'number' })

      vm.setFieldAnswers(fields)
      const field = vm.attr('currentPage.fields.0')
      const answerValues = field.attr('_answerVm.answer.values')

      assert.deepEqual(answerValues.attr(), [null, 101, 202], 'should set repeatVarValues')
    })

    describe('default values', () => {
      it('sets default value', () => {
        let field = new CanMap({
          name: 'StateTE',
          label: 'Enter State:',
          type: 'text',
          value: 'Texas'
        })

        let answerVar = new CanMap({
          name: 'statete',
          type: 'text',
          values: [null]
        })

        vm.attr('interview.answers.statete', answerVar)

        vm.attr('currentPage.fields').push(field)
        vm.attr('rState').page = 'Next' // page find() always returns nextPageStub

        vm.setFieldAnswers(vm.attr('currentPage.fields'))

        assert.equal(vm.attr('interview.answers.statete.values.1'), 'Texas', 'Default values override empty answers')
      })

      it('handles datemdy default values of TODAY', () => {
        const field = new CanMap({
          name: 'bDay DA',
          label: 'Enter Birthday:',
          type: 'datemdy',
          value: 'TODAY'
        })
        const answer = new CanMap({
          name: 'bday da',
          type: 'datemdy',
          values: [null]
        })
        const fields = [field]
        const answerIndex = 1
        const avm = new AnswerVM({ field, answerIndex, answer, fields })
        const returnedAnswerVm = vm.setDefaultValue(field, avm, answer, answerIndex)
        const expectedDate = moment().format('MM/DD/YYYY')

        assert.equal(returnedAnswerVm.attr('values'), expectedDate, 'it should set todays date with special keyword')
      })

      it('ignores default value if previous answer exists', () => {
        let field = new CanMap({
          name: 'StateTE',
          label: 'Enter State:',
          type: 'text',
          value: 'Texas'
        })

        let answerVar = new CanMap({
          name: 'statete',
          type: 'text',
          values: [null, 'Illinois']
        })

        vm.attr('interview.answers.statete', answerVar)

        nextPageStub.fields.push(field)
        vm.attr('rState').page = 'Next' // page find() always returns nextPageStub

        vm.setFieldAnswers(vm.attr('currentPage.fields'))

        assert.equal(vm.attr('interview.answers.statete.values.1'), 'Illinois', 'Saved answers trump Default Values')
      })

      it('handles number defaults with zero', () => {
        let field = new CanMap({
          name: 'SomeNum',
          label: 'Enter SomeNum:',
          type: 'number',
          value: '0'
        })

        let answerVar = new CanMap({
          name: 'somenum',
          type: 'number',
          values: [null]
        })

        vm.attr('interview.answers.somenum', answerVar)

        vm.attr('currentPage.fields').push(field)
        vm.attr('rState').page = 'Next' // page find() always returns nextPageStub

        vm.setFieldAnswers(vm.attr('currentPage.fields'))

        assert.strictEqual(vm.attr('interview.answers.somenum.values.1'), 0, 'Sets default number values')
      })

      it('handles numberdollar defaults with decimals', () => {
        let field = new CanMap({
          name: 'Salary',
          label: 'Enter Salary:',
          type: 'numberdollar',
          value: '1234.56'
        })

        let answerVar = new CanMap({
          name: 'salary',
          type: 'numberdollar',
          values: [null]
        })

        vm.attr('interview.answers.salary', answerVar)

        vm.attr('currentPage.fields').push(field)
        vm.attr('rState').page = 'Next' // page find() always returns nextPageStub

        vm.setFieldAnswers(vm.attr('currentPage.fields'))

        assert.strictEqual(vm.attr('interview.answers.salary.values.1'), 1234.56, 'Sets default number values')
      })
    })
  })

  describe('Component', () => {
    let rStateTeardown
    beforeEach(() => {
      let frag = stache(
        '<a2j-pages></a2j-pages>'
      )
      $('#test-area').html(frag())
      vm = $('a2j-pages')[0].viewModel
      vm.attr(defaults)
      vm.connectedCallback()
      rStateTeardown = vm.attr('rState').connectedCallback()
    })

    it('fires setFieldAnswers to update repeat loops', () => {
      const setFieldAnswersSpy = sinon.spy()
      vm.setFieldAnswers = setFieldAnswersSpy
      const button = new CanMap({ next: 'Next' })
      vm.navigate(button)
      assert.equal(setFieldAnswersSpy.calledOnce, true, 'should call setFieldAnswers once if no repeat loop')

      vm.attr('rState.repeatVarValue', 1)
      vm.navigate(button)
      assert.equal(setFieldAnswersSpy.callCount, 2, 'should call setFieldAnswers twice with repeat loop')
    })

    it('parseText refires if answers update', () => {
      const logic = vm.attr('logic')
      let count = 0
      logic.eval = () => { return count++ }

      // change answers
      vm.attr('interview.answers.foo', 'bar')
      assert.equal(count, 3, 'parseText exists in pages.stache 3 times and should be called 3 times')
    })

    afterEach(() => {
      rStateTeardown()
      $('#test-area').empty()
    })
  })
})
