import $ from 'jquery'
import stache from 'can-stache'
import { assert } from 'chai'
import { FieldVM } from './field'
import AnswerVM from '~/src/models/answervm'
import AppState from '~/src/models/app-state'
import Interview from '~/src/models/interview'
import FieldModel from '~/src/models/field'
import Lang from '~/src/mobile/util/lang'
import DefineMap from 'can-define/map/map'
import TraceMessage from '~/src/models/trace-message'
import sinon from 'sinon'

import 'steal-mocha'

describe('<a2j-field>', () => {
  describe('viewModel', () => {
    let vm
    let fieldModel
    const appState = new AppState({
      traceMessage: new TraceMessage({
        currentPageName: 'FieldTest'
      }),
      interview: new Interview()
    })
    const lang = new Lang()
    beforeEach(() => {
      fieldModel = new FieldModel({
        name: 'Foo Input',
        type: ''
      })

      fieldModel._answerVm = new AnswerVM({
        answerIndex: 1,
        field: fieldModel,
        answer: {
          values: [null]
        }
      })

      vm = new FieldVM({
        appState,
        lang,
        field: fieldModel,
        groupValidationMap: new DefineMap(),
        lastIndexMap: new DefineMap()
      })
    })

    afterEach(() => {
      vm = null
    })

    it('restoreUserAvatar', () => {
      const userAvatarJSON = '{"gender":"male","isOld":true,"hasWheelchair":false,"hairColor":"grayLight","skinTone":"darker"}'
      vm.restoreUserAvatar(userAvatarJSON)
      const userAvatar = vm.appState.userAvatar
      assert.equal(userAvatar.hairColor, 'grayLight', 'should restore userAvatar.hairColor')
      assert.equal(userAvatar.skinTone, 'darker', 'should restore userAvatar.skinTone')
      assert.equal(userAvatar.gender, 'male', 'should restore userAvatar.skinTone')
      assert.equal(userAvatar.hasWheelchair, false, 'should restore userAvatar.skinTone')
      assert.equal(userAvatar.isOld, true, 'should restore userAvatar.skinTone')
    })

    it('should suggest a format for SSN numbers', () => {
      vm.field.type = 'numberssn'

      assert.equal(vm.suggestionText, '999-99-9999', 'should return ssn format suggestion')
    })

    it('should suggest a format for Phone numbers', () => {
      vm.field.type = 'numberphone'

      assert.equal(vm.suggestionText, '(555) 555-5555', 'should return phone number format suggestion')
    })

    it('computes numberPickOptions from field min/max values', function () {
      vm.field.assign({ min: '1', max: '5' })

      assert.deepEqual(
        vm.numberPickOptions.serialize(),
        [1, 2, 3, 4, 5],
        'should return a range including end value'
      )

      // if min or max are not valid integers
      vm.field.assign({ min: '', max: '' })
      assert.deepEqual(
        vm.numberPickOptions.serialize(),
        [],
        'should return an empty list'
      )
    })

    it('convertDate', () => {
      assert.equal(vm.convertDate('2015-12-23'), '12/23/2015', 'should convert with default formats')
      assert.equal(vm.convertDate('2015/23/12', null, 'YYYY/DD/MM'), '12/23/2015', 'should convert with custom input format')
      assert.equal(vm.convertDate('2015-12-23', 'YYYY/DD/MM'), '2015/23/12', 'should convert with custom output format')
      assert.equal(vm.convertDate('2015/23/12', 'DD-MM-YY', 'YYYY/DD/MM'), '23-12-15', 'should convert with custom formats')
      assert.equal(vm.convertDate('TODAY'), 'TODAY', 'should keep TODAY')
    })

    it('normalizeDate', () => {
      assert.equal(vm.normalizeDateInput('TODAY'), 'TODAY', 'should keep TODAY')
      assert.equal(vm.normalizeDateInput('122315'), '12/23/2015', 'should normalize 6 digit dates')
      assert.equal(vm.normalizeDateInput('12-23-15'), '12/23/2015', 'should normalize 6 digit dates with hyphens')
      assert.equal(vm.normalizeDateInput('12/23/15'), '12/23/2015', 'should normalize 6 digit dates with slashes')
      assert.equal(vm.normalizeDateInput('12232015'), '12/23/2015', 'should normalize 8 digit dates')
      assert.equal(vm.normalizeDateInput('12-23-2015'), '12/23/2015', 'should normalize 8 digit dates with hyphens')
      assert.equal(vm.normalizeDateInput('12/23/2015'), '12/23/2015', 'should normalize 8 digit dates with slashes')
      // dates missing leading zeros on day or month
      assert.equal(vm.normalizeDateInput('2-4-15'), '02/04/2015', 'should normalize dates with hyphens and single digits')
      assert.equal(vm.normalizeDateInput('2/4/15'), '02/04/2015', 'should normalize with slashes and single digits')
      assert.equal(vm.normalizeDateInput('2/4/5'), '02045', 'should not normalize a single digit year, only single digit month or day')
      assert.equal(vm.normalizeDateInput('2415'), '2415', 'should not normalize a date without slash or hyphen separator')
    })

    it('invalidPrompt', () => {
      vm.field = {name: 'foo'}
      vm.lastIndexMap = {'foo': 0}
      vm.fieldIndex = 0

      vm.groupValidationMap = {'foo': false}
      assert.ok(!vm.showInvalidPrompt, 'showInvalidPrompt should be false when there is no error')

      vm.groupValidationMap = {'foo': true}
      assert.ok(!vm.showInvalidPrompt, 'showInvalidPrompt should be false when there is an error but no message')

      vm.groupValidationMap = {'foo': true}
      vm.field.type = 'checkbox'
      vm.field.invalidPrompt = ''
      assert.equal(vm.invalidPrompt, vm.lang.FieldPrompts_checkbox, 'checkbox - should show the default error message')

      assert.ok(vm.showInvalidPrompt, 'checkbox - showInvalidPrompt should be true when there is an error and a default message')

      vm.field.invalidPrompt = 'This is invalid'
      assert.equal(vm.invalidPrompt, 'This is invalid', 'checkbox - should show the custom error message')
      assert.ok(vm.showInvalidPrompt, 'checkbox - showInvalidPrompt should be true when there is an error and a default message')

      vm.field.type = 'text'
      vm.field.invalidPrompt = ''
      assert.equal(vm.invalidPrompt, vm.lang.FieldPrompts_text, 'text - should show the default error message')
      assert.ok(vm.showInvalidPrompt, 'text - showInvalidPrompt should be true when there is an error and a default message')

      vm.field.invalidPrompt = 'This is invalid'
      assert.equal(vm.invalidPrompt, 'This is invalid', 'text - should show the custom error message')
      assert.ok(vm.showInvalidPrompt, 'should be true when there is an error and a default message')
      assert.ok(vm.showInvalidPrompt, 'text - showInvalidPrompt should be true when there is an error and a default message')
    })

    it('minMaxPrompt should show or hide based on showMinMaxPrompt', function () {
      const field = vm.field

      field.assign({ 'type': 'number', 'min': null, 'max': null })
      assert.equal(vm.showMinMaxPrompt, false, 'if neither min/max has been set, showMinMaxPrompt should be false')

      field.min = 5
      assert.equal(vm.showMinMaxPrompt, true, 'if min exists, showMinMaxPrompt should be true')

      field.assign({ 'min': null, 'max': 15 })
      assert.equal(vm.showMinMaxPrompt, true, 'if max exists, showMinMaxPrompt should be true')
    })

    it('minMaxPrompt should show min and max values in range display', function () {
      const field = vm.field
      field.assign({ 'type': 'number', 'min': 5, 'max': 15 })
      assert.equal(vm.minMaxPrompt, '(5 ~~~ 15)', 'should show the range of acceptable values')

      field.min = null
      assert.equal(vm.minMaxPrompt, '(any ~~~ 15)', 'should show the word "any" if min or max value not set')
    })

    it('calcAvailableLength', function () {
      let ev = { target: { value: 'this is' } }
      let field = vm.field
      field.assign({ 'type': 'text', 'maxChars': undefined })

      vm.calcAvailableLength(ev)
      assert.equal(vm.availableLength, null, 'did not return undefined when maxChar not set')

      field.maxChars = 10
      vm.calcAvailableLength(ev)

      assert.equal(vm.availableLength, 3, 'did not compute remaining characters')
    })

    it('should detect when maxChar value is overCharacterLimit', function () {
      let ev = { target: { value: 'this is over the limit' } }
      let field = vm.field
      field.assign({
        'type': 'text',
        'maxChars': 10
      })
      vm.calcAvailableLength(ev)

      assert.equal(vm.overCharacterLimit, true, 'did not detect exceeding answer limit')
    })

    it('date validation normalizes the input value', () => {
      const field = vm.field
      field.assign({ type: 'datemdy', label: 'enter birthday' })
      const input = document.createElement('input')
      input.value = '040120'
      vm.validateField(null, input)

      assert.equal(input.value, '04/01/2020', 'validating date field should normalize the date')
    })
  })

  describe('Component', () => {
    let defaults
    let logicStub
    let checkboxVm, notaVm, textVm, numberDollarVm, textpickVm

    // stub app-state parseText helper
    stache.registerHelper('parseText', (text) => text)

    beforeEach(() => {
      logicStub = new DefineMap({
        exec: $.noop,
        infinite: {
          errors: $.noop,
          reset: $.noop,
          _counter: 0,
          inc: $.noop
        },
        varExists: sinon.spy(),
        varCreate: sinon.spy(),
        varGet: sinon.stub(),
        varSet: sinon.spy(),
        eval: sinon.spy()
      })

      defaults = {
        field: null,
        logic: logicStub,
        lang: new Lang(),
        groupValidationMap: new DefineMap(),
        lastIndexMap: new DefineMap(),
        appState: new AppState({
          traceMessage: new TraceMessage({
            currentPageName: 'FieldTest'
          }),
          userAvatar: {}
        })
      }

      const fieldModels = [
        new FieldModel({name: 'Likes Chocolate TF', type: 'checkbox', label: 'Likes Chocolate TF'}),
        new FieldModel({name: 'None of the Above', type: 'checkboxNOTA', label: 'None of the Above'}),
        new FieldModel({name: 'Name', type: 'text', label: 'Name'}),
        new FieldModel({name: 'Salary', type: 'numberdollar', label: 'Salary', calculator: false}),
        new FieldModel({name: 'State', type: 'textpick', label: 'State', listData: '<option>Alaska</option><option>Hawaii</option><option>Texas</option>', required: true, calculator: false})
      ]

      fieldModels.forEach((fieldModel) => {
        fieldModel._answerVm = new AnswerVM({ field: fieldModel, answer: fieldModel.emptyAnswer, fields: fieldModels })
      })

      let fieldRenderer = stache(
        `<a2j-field
          field:from="field"
          lang:from="lang"
          logic:from="logic"
          lastIndexMap:from="lastIndexMap"
          groupValidationMap:from="groupValidationMap"
          appState:from="appState"
        />`
      )

      // setup VMs with unique fields
      checkboxVm = new FieldVM(defaults)
      checkboxVm.field = fieldModels[0]

      notaVm = new FieldVM(defaults)
      notaVm.field = fieldModels[1]

      textVm = new FieldVM(defaults)
      textVm.field = fieldModels[2]

      numberDollarVm = new FieldVM(defaults)
      numberDollarVm.field = fieldModels[3]

      textpickVm = new FieldVM(defaults)
      textpickVm.field = fieldModels[4]

      $('#test-area').append(fieldRenderer(checkboxVm))
        .append(fieldRenderer(notaVm))
        .append(fieldRenderer(textpickVm))
        .append(fieldRenderer(numberDollarVm))
        .append(fieldRenderer(textpickVm))
    })

    afterEach(() => {
      $('#test-area').empty()
    })

    describe('a2j-field input change', () => {
      it('should set other checkbox values to false when None of the Above is checked', () => {
        const checkbox = checkboxVm.field
        checkbox._answerVm.answer.values[1] = true

        document.getElementById('None of the Above').click()
        assert.equal(checkbox._answerVm.values, false, 'Checking NOTA clears other checkboxes')
      })

      it('should set checkboxNOTA value to false when another checkbox is checked', () => {
        const checkboxNOTA = notaVm.field
        checkboxNOTA._answerVm.answer.values[1] = true

        document.getElementById('Likes Chocolate TF').click()
        assert.equal(checkboxNOTA._answerVm.values, false, 'Checking NOTA clears other checkboxes')
      })

      it('should not affect non checkbox values', () => {
        let checkbox = checkboxVm.field
        checkbox._answerVm.answer.values[1] = false
        let textField = textVm.field
        textField._answerVm.answer.values[1] = 'Wilhelmina'

        document.getElementById('Likes Chocolate TF').click()
        assert.equal(textField._answerVm.answer.values[1], 'Wilhelmina', 'Checking checkbox does not change text field')
      })

      it('should set error state from number prevalidation', () => {
        const e = new window.Event('input', {
          bubbles: true,
          cancelable: true
        })
        const numberDollarEl = document.getElementById('Salary')
        numberDollarEl.value = 'safsd'
        numberDollarEl.dispatchEvent(e)
        const hasError = numberDollarVm.groupValidationMap.Salary
        assert.equal(hasError, true, 'pre-validation should catch number errors and update groupValidationMap')
      })
    })

    describe('Calculator', () => {
      it('should show the calculator image when selected', () => {
        let numberDollarField = numberDollarVm.field
        numberDollarField.calculator = true

        let $calcFound = $('.calc-icon')
        assert.equal($calcFound.length, 1, 'should find one .calc-icon element')
      })

      it('should not show the calculator image when unselected', () => {
        let numberDollarField = numberDollarVm.field
        numberDollarField.calculator = false

        let $calcFound = $('.calc-icon')

        assert.equal($calcFound.length, 0, 'should find zero .calc-icon element')
      })
    })

    describe('textpick ignores first onChange validation when field is set to `required`', () => {
      it('field.errors should be false, then true', () => {
        const textpick = textpickVm.field
        const el = document.querySelector('select')

        // textpick field types set default value to empty string
        // this causes an initial onChange event to fire, which causes
        // and immediate error state before a user has a chance to answer

        // emulate initial value set
        textpick._answerVm.values = ''
        // emulate onChange validation
        let hasErrors = textpickVm.validateField(null, el)
        assert.equal(hasErrors, undefined, 'skips validateField, so hasErrors should be undefined')

        // emulate second onChange validation: aka user hit Continue without selecting anything
        // when the field is set to `required`
        hasErrors = textpickVm.validateField(null, el)
        assert.equal(hasErrors, true, 'has errors after textpick initialized and second validation')
      })
    })
  })
})
