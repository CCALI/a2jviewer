import $ from 'jquery'
import stache from 'can-stache'
import { assert } from 'chai'
import { FieldVM } from './field'
import AnswerVM from 'caja/viewer/models/answervm'
import FieldModel from 'caja/viewer/models/field'
import CanMap from 'can-map'
import TraceMessage from 'caja/author/models/trace-message'
import sinon from 'sinon'

import 'steal-mocha'

describe('<a2j-field>', () => {
  describe('viewModel', () => {
    let vm
    let fieldStub

    beforeEach(() => {
      fieldStub = {
        name: 'Foo Input',
        type: '',
        _answerVm: {
          answerIndex: 1,
          answer: {
            values: [null]
          }
        }
      }

      vm = new FieldVM({
        field: fieldStub,
        rState: {
          traceMessage: new TraceMessage({
            currentPageName: 'FieldTest'
          }),
          userAvatar: {}
        },
        groupValidationMap: new CanMap(),
        lastIndexMap: new CanMap()
      })
    })

    afterEach(() => {
      vm = null
    })

    it('restoreUserAvatar', () => {
      const userAvatarJSON = '{"gender":"male","isOld":true,"hasWheelchair":false,"hairColor":"grayLight","skinTone":"darker"}'
      vm.restoreUserAvatar(userAvatarJSON)
      const userAvatar = vm.attr('rState.userAvatar')
      assert.equal(userAvatar.hairColor, 'grayLight', 'should restore userAvatar.hairColor')
      assert.equal(userAvatar.skinTone, 'darker', 'should restore userAvatar.skinTone')
      assert.equal(userAvatar.gender, 'male', 'should restore userAvatar.skinTone')
      assert.equal(userAvatar.hasWheelchair, false, 'should restore userAvatar.skinTone')
      assert.equal(userAvatar.isOld, true, 'should restore userAvatar.skinTone')
    })

    it('should suggest a format for SSN numbers', () => {
      vm.attr('field').attr('type', 'numberssn')

      assert.equal(vm.attr('suggestionText'), '999-99-9999', 'should return ssn format suggestion')
    })

    it('should suggest a format for Phone numbers', () => {
      vm.attr('field').attr('type', 'numberphone')

      assert.equal(vm.attr('suggestionText'), '(555) 555-5555', 'should return phone number format suggestion')
    })

    it('computes numberPickOptions from field min/max values', function () {
      vm.attr('field').attr({ min: '1', max: '5' })

      assert.deepEqual(
        vm.attr('numberPickOptions').serialize(),
        [1, 2, 3, 4, 5],
        'should return a range including end value'
      )

      // if min or max are not valid integers
      vm.attr('field').attr({ min: '', max: '' })
      assert.deepEqual(
        vm.attr('numberPickOptions').serialize(),
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
      /* jshint ignore:start */
      vm.attr('lang', {
        FieldPrompts_checkbox: 'You must select one or more checkboxes to continue.',
        FieldPrompts_text: 'You must type a response in the highlighted space before you can continue.'
      })
      /* jshint ignore:end */
      vm.attr('field', {name: 'foo'})
      vm.attr('lastIndexMap', {'foo': 0})
      vm.attr('fieldIndex', 0)

      vm.attr('groupValidationMap', {'foo': false})
      assert.ok(!vm.attr('showInvalidPrompt'), 'showInvalidPrompt should be false when there is no error')

      vm.attr('groupValidationMap', {'foo': true})
      assert.ok(!vm.attr('showInvalidPrompt'), 'showInvalidPrompt should be false when there is an error but no message')

      vm.attr('groupValidationMap', {'foo': true})
      vm.attr('field.type', 'checkbox')
      vm.removeAttr('field.invalidPrompt')
      assert.equal(vm.attr('invalidPrompt'), vm.attr('lang.FieldPrompts_checkbox'), 'checkbox - should show the default error message')

      assert.ok(vm.attr('showInvalidPrompt'), 'checkbox - showInvalidPrompt should be true when there is an error and a default message')

      vm.attr('field.invalidPrompt', 'This is invalid')
      assert.equal(vm.attr('invalidPrompt'), 'This is invalid', 'checkbox - should show the custom error message')
      assert.ok(vm.attr('showInvalidPrompt'), 'checkbox - showInvalidPrompt should be true when there is an error and a default message')

      vm.attr('field.type', 'text')
      vm.removeAttr('field.invalidPrompt')
      assert.equal(vm.attr('invalidPrompt'), vm.attr('lang.FieldPrompts_text'), 'text - should show the default error message')
      assert.ok(vm.attr('showInvalidPrompt'), 'text - showInvalidPrompt should be true when there is an error and a default message')

      vm.attr('field.invalidPrompt', 'This is invalid')
      assert.equal(vm.attr('invalidPrompt'), 'This is invalid', 'text - should show the custom error message')
      assert.ok(vm.attr('showInvalidPrompt'), 'should be true when there is an error and a default message')
      assert.ok(vm.attr('showInvalidPrompt'), 'text - showInvalidPrompt should be true when there is an error and a default message')
    })

    it('minMaxPrompt should show or hide based on showMinMaxPrompt', function () {
      const field = vm.attr('field')

      field.attr({ 'type': 'number', 'min': null, 'max': null })
      assert.equal(vm.attr('showMinMaxPrompt'), false, 'if neither min/max has been set, showMinMaxPrompt should be false')

      field.attr('min', 5)
      assert.equal(vm.attr('showMinMaxPrompt'), true, 'if min exists, showMinMaxPrompt should be true')

      field.attr({ 'min': null, 'max': 15 })
      assert.equal(vm.attr('showMinMaxPrompt'), true, 'if max exists, showMinMaxPrompt should be true')
    })

    it('minMaxPrompt should show min and max values in range display', function () {
      const field = vm.attr('field')
      field.attr({ 'type': 'number', 'min': 5, 'max': 15 })
      assert.equal(vm.attr('minMaxPrompt'), '(5 ~~~ 15)', 'should show the range of acceptable values')

      field.attr('min', null)
      assert.equal(vm.attr('minMaxPrompt'), '(any ~~~ 15)', 'should show the word "any" if min or max value not set')
    })

    it('calcAvailableLength', function () {
      let ev = { target: { value: 'this is' } }
      let field = vm.attr('field')
      field.attr({ 'type': 'text', 'maxChars': undefined })

      vm.calcAvailableLength(ev)
      assert.equal(vm.attr('availableLength'), null, 'did not return undefined when maxChar not set')

      field.attr('maxChars', 10)
      vm.calcAvailableLength(ev)

      assert.equal(vm.attr('availableLength'), 3, 'did not compute remaining characters')
    })

    it('should detect when maxChar value is overCharacterLimit', function () {
      let ev = { target: { value: 'this is over the limit' } }
      let field = vm.attr('field')
      field.attr({
        'type': 'text',
        'maxChars': 10
      })
      vm.calcAvailableLength(ev)

      assert.equal(vm.attr('overCharacterLimit'), true, 'did not detect exceeding answer limit')
    })

    it('passes textlong answer to modal', function () {
      const field = vm.attr('field')
      field.attr('_answerVm.values', 'cash money')
      field.attr({
        'type': 'textlong',
        'label': 'BigText'
      })

      vm.expandTextlong(field)
      const textlongValue = vm.attr('modalContent.textlongValue')
      assert.equal(textlongValue, 'cash money', 'should copy field answer value to modal')
    })

    it('date validation normalizes the input value', () => {
      const field = vm.attr('field')
      field.attr({ type: 'datemdy', label: 'enter birthday' })
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
    let langStub = new CanMap({
      MonthNamesShort: 'Jan, Feb',
      MonthNamesLong: 'January, February'
    })

    beforeEach(() => {
      logicStub = new CanMap({
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
        repeatVarValue: '',
        lang: langStub,
        groupValidationMap: new CanMap(),
        lastIndexMap: new CanMap(),
        rState: {
          traceMessage: new TraceMessage({
            currentPageName: 'FieldTest'
          }),
          userAvatar: {}
        }
      }

      const fieldModels = [
        new FieldModel({name: 'Likes Chocolate TF', type: 'checkbox', label: 'Likes Chocolate TF'}),
        new FieldModel({name: 'None of the Above', type: 'checkboxNOTA', label: 'None of the Above'}),
        new FieldModel({name: 'Name', type: 'text', label: 'Name'}),
        new FieldModel({name: 'Salary', type: 'numberdollar', label: 'Salary', calculator: false}),
        new FieldModel({name: 'State', type: 'textpick', label: 'State', listData: '<option>Alaska</option><option>Hawaii</option><option>Texas</option>', required: true, calculator: false})
      ]

      fieldModels.forEach((fieldModel) => {
        fieldModel.attr('_answerVm', new AnswerVM({ field: fieldModel, answer: fieldModel.emptyAnswer, fields: fieldModels }))
      })

      let fieldRenderer = stache(
        `<a2j-field
          field:from="field"
          lang:from="lang"
          logic:from="logic"
          repeatVarValue:from="repeatVarValue"
          lastIndexMap:from="lastIndexMap"
          groupValidationMap:from="groupValidationMap"
          rState:from="rState"
        />`
      )

      // setup VMs with unique fields
      checkboxVm = new FieldVM(defaults)
      checkboxVm.attr('field', fieldModels[0])

      notaVm = new FieldVM(defaults)
      notaVm.attr('field', fieldModels[1])

      textVm = new FieldVM(defaults)
      textVm.attr('field', fieldModels[2])

      numberDollarVm = new FieldVM(defaults)
      numberDollarVm.attr('field', fieldModels[3])

      textpickVm = new FieldVM(defaults)
      textpickVm.attr('field', fieldModels[4])

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
        const checkbox = checkboxVm.attr('field')
        checkbox.attr('_answerVm.answer.values.1', true)

        document.getElementById('None of the Above').click()
        assert.equal(checkbox.attr('_answerVm.values'), false, 'Checking NOTA clears other checkboxes')
      })

      it('should set checkboxNOTA value to false when another checkbox is checked', () => {
        const checkboxNOTA = notaVm.attr('field')
        checkboxNOTA.attr('_answerVm.answer.values.1', true)

        document.getElementById('Likes Chocolate TF').click()
        assert.equal(checkboxNOTA.attr('_answerVm.values'), false, 'Checking NOTA clears other checkboxes')
      })

      it('should not affect non checkbox values', () => {
        let checkbox = checkboxVm.attr('field')
        checkbox.attr('_answerVm.answer.values.1', false)
        let textField = textVm.attr('field')
        textField.attr('_answerVm.answer.values.1', 'Wilhelmina')

        document.getElementById('Likes Chocolate TF').click()
        assert.equal(textField.attr('_answerVm.answer.values.1'), 'Wilhelmina', 'Checking checkbox does not change text field')
      })
    })

    describe('Calculator', () => {
      it('should show the calculator image when selected', () => {
        let numberDollarField = numberDollarVm.attr('field')
        numberDollarField.attr('calculator', true)

        let $calcFound = $('.calc-icon')

        assert.equal($calcFound.attr('class'), 'calc-icon')
      })

      it('should not show the calculator image when unselected', () => {
        let $calcFound = $('.calc-icon')

        assert.equal($calcFound.attr('class'), undefined)
      })
    })

    describe('textpick ignores first onChange validation when field is set to `required`', () => {
      it('field.errors should be false, then true', () => {
        const textpick = textpickVm.attr('field')
        const el = document.querySelector('select')

        // textpick field types set default value to empty string
        // this causes an initial onChange event to fire, which causes
        // and immediate error state before a user has a chance to answer

        // emulate initial value set
        textpick.attr('_answerVm').attr('values', '')
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
