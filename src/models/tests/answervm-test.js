import { assert } from 'chai'
import Field from '~/src/models/field'
import Answer from '~/src/models/answer'
import Answers from '~/src/models/answers'
import AnswerVM from '~/src/models/answervm'

import 'steal-mocha'

describe('AnswerViewModel', function () {
  let avm
  beforeEach(() => {
    const field = new Field({ name: 'user gender', type: 'gender' })
    avm = new AnswerVM({ field })
  })

  it('serialize', function () {
    const answerModel = new Answer({ name: 'user gender', type: 'text', repeating: false, values: [null] })
    const answers = new Answers({ answer: answerModel })

    avm.values = 'm'
    assert.deepEqual(answers.serialize(), {
      'user gender': {
        type: 'text',
        repeating: false,
        name: 'user gender',
        values: [null, 'm']
      }
    }, 'single value serialize')

    avm.answerIndex = 2
    avm.values = 'f'
    assert.deepEqual(answers.serialize(), {
      'user gender': {
        type: 'text',
        repeating: false,
        name: 'user gender',
        values: [null, 'm', 'f']
      }
    }, 'multiple values serialize')
  })

  it('set() when answer is null', function () {
    avm.answer = null

    assert.doesNotThrow(() => {
      avm.values = false
    })

    assert.deepEqual(avm.answer.values, [null, false])
  })

  it('sets number field answer correctly from text input', function () {
    const field = new Field({ name: 'foo', type: 'number' })

    avm.assign({ field, answer: field.emptyAnswer })
    avm.values = '123,456.78'

    assert.deepEqual(avm.answer.values, [null, 123456.78])
  })

  it('sets zero number values correctly', function () {
    const field = new Field({ name: 'foo', type: 'number' })

    avm.assign({ field, answer: field.emptyAnswer })
    avm.values = '0'

    assert.deepEqual(avm.answer.values, [null, 0])
  })

  describe('validating checkboxes', function () {
    let checkboxes

    beforeEach(function () {
      const checkboxFactory = function () {
        const checkbox = new Field({
          name: 'foo',
          required: true,
          type: 'checkbox',
          repeating: false
        })

        return checkbox
      }

      checkboxes = new Field.List([
        checkboxFactory(),
        checkboxFactory(),
        checkboxFactory()
      ])

      checkboxes.forEach(function (checkbox) {
        checkbox._answerVm = new AnswerVM({
          answerIndex: 1,
          field: checkbox,
          fields: checkboxes,
          answer: checkbox.emptyAnswer
        })
      })
    })

    it('fails if no required checkbox has been checked', function () {
      const checkbox = checkboxes[0]

      // trigger the validation logic
      checkbox._answerVm.values = null

      assert.equal(checkbox._answerVm.errors, true, 'should fail')
    })

    it('does not fail if a required checkbox has been checked', function () {
      const checkbox = checkboxes[0]

      // trigger the validation logic
      checkbox._answerVm.values = 'foo'

      assert.equal(checkbox._answerVm.errors, null, 'should not fail')
    })

    it('does not fail if none of the checkboxes is required', function () {
      checkboxes.forEach(function (checkbox) {
        checkbox.required = false
      })

      // trigger the validation logic
      const checkbox = checkboxes[0]
      checkbox._answerVm.values = null

      assert.equal(checkbox._answerVm.errors, undefined, 'should not fail')
    })
  })

  describe('validating radioButtons', function () {
    let radioButtons

    beforeEach(function () {
      const radioFactory = function () {
        const radio = new Field({
          name: 'foo',
          required: true,
          type: 'radio',
          repeating: false
        })

        return radio
      }

      radioButtons = new Field.List([
        radioFactory(),
        radioFactory(),
        radioFactory()
      ])

      radioButtons.forEach(function (radio) {
        radio._answerVm = new AnswerVM({
          answerIndex: 1,
          field: radio,
          fields: radioButtons,
          answer: radio.emptyAnswer
        })
      })
    })

    it('groups radio button validation by field.name', function () {
      const barRadio = radioButtons[2]
      barRadio.name = 'bar'
      const fooRadio0 = radioButtons[0]
      const fooRadio1 = radioButtons[1]

      // trigger the validation logic for barRadio only
      barRadio._answerVm.values = 'has a value'
      assert.equal(barRadio._answerVm.errors, null, 'bar radio should be valid')
      assert.equal(fooRadio0._answerVm.errors, true, 'foo radio buttons should fail')
      assert.equal(fooRadio1._answerVm.errors, true, 'foo radio buttons should fail')

      // trigger the validation logic for fooRadio0 only
      fooRadio0._answerVm.values = 'has a value'
      assert.equal(fooRadio0._answerVm.errors, null, 'fooRadio0 button should be valid')
      assert.equal(fooRadio1._answerVm.errors, null, 'fooRadio1 button is in group and should also be valid')
    })
  })
})
