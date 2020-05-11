import { assert } from 'chai'
import Field from 'caja/viewer/models/field'
import Answer from 'caja/viewer/models/answer'
import Answers from 'caja/viewer/models/answers'
import AnswerVM from 'caja/viewer/models/answervm'

import 'steal-mocha'

describe('AnswerViewModel', function () {
  it('serialize', function () {
    const answers = new Answers()

    const answer = new Answer({
      type: 'text',
      values: [null],
      repeating: false,
      name: 'user gender'
    })

    answers.attr('user gender', answer)
    const avm = new AnswerVM({ answer })

    avm.attr('values', 'm')
    assert.deepEqual(answers.serialize(), {
      'user gender': {
        type: 'text',
        repeating: false,
        name: 'user gender',
        values: [null, 'm']
      }
    }, 'single value serialize')

    avm.attr('answerIndex', 2)
    avm.attr('values', 'f')
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
    const avm = new AnswerVM({ answer: null })

    assert.doesNotThrow(() => {
      avm.attr('values', false)
    })

    assert.deepEqual(avm.attr('answer.values').attr(), [null, false])
  })

  it('sets number field answer correctly from text input', function () {
    const field = new Field({ name: 'foo', type: 'number' })
    field.attr('answer', field.attr('emptyAnswer'))

    const avm = new AnswerVM({ field, answer: field.attr('answer') })
    avm.attr('values', '123,456.78')

    assert.deepEqual(avm.attr('answer.values').attr(), [null, 123456.78])
  })

  it('sets zero number values correctly', function () {
    const field = new Field({ name: 'foo', type: 'number' })
    field.attr('answer', field.attr('emptyAnswer'))

    const avm = new AnswerVM({ field, answer: field.attr('answer') })
    avm.attr('values', '0')

    assert.deepEqual(avm.attr('answer.values').attr(), [null, 0])
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

        checkbox.attr('answer', checkbox.attr('emptyAnswer'))
        return checkbox
      }

      checkboxes = new Field.List([
        checkboxFactory(),
        checkboxFactory(),
        checkboxFactory()
      ])

      checkboxes.forEach(function (checkbox) {
        checkbox.attr('_answerVm', new AnswerVM({
          answerIndex: 1,
          field: checkbox,
          fields: checkboxes,
          answer: checkbox.attr('answer')
        }))
      })
    })

    it('fails if no required checkbox has been checked', function () {
      const checkbox = checkboxes.attr(0)

      // trigger the validation logic
      checkbox.attr('_answerVm.values', null)

      assert.equal(checkbox.attr('_answerVm.errors'), true, 'should fail')
    })

    it('does not fail if a required checkbox has been checked', function () {
      const checkbox = checkboxes.attr(0)

      // trigger the validation logic
      checkbox.attr('_answerVm.values', 'foo')

      assert.equal(checkbox.attr('_answerVm.errors'), null, 'should not fail')
    })

    it('does not fail if none of the checkboxes is required', function () {
      checkboxes.forEach(function (checkbox) {
        checkbox.attr('required', false)
      })

      // trigger the validation logic
      const checkbox = checkboxes.attr(0)
      checkbox.attr('_answerVm.values', null)

      assert.equal(checkbox.attr('_answerVm.errors'), undefined, 'should not fail')
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

        radio.attr('answer', radio.attr('emptyAnswer'))
        return radio
      }

      radioButtons = new Field.List([
        radioFactory(),
        radioFactory(),
        radioFactory()
      ])

      radioButtons.forEach(function (radio) {
        radio.attr('_answerVm', new AnswerVM({
          answerIndex: 1,
          field: radio,
          fields: radioButtons,
          answer: radio.attr('answer')
        }))
      })
    })

    it('groups radio button validation by field.name', function () {
      const barRadio = radioButtons[2].attr('name', 'bar')
      const fooRadio0 = radioButtons[0]
      const fooRadio1 = radioButtons[1]

      // trigger the validation logic for barRadio only
      barRadio.attr('_answerVm.values', 'has a value')
      assert.equal(barRadio.attr('_answerVm.errors'), null, 'bar radio should be valid')
      assert.equal(fooRadio0.attr('_answerVm.errors'), true, 'foo radio buttons should fail')
      assert.equal(fooRadio1.attr('_answerVm.errors'), true, 'foo radio buttons should fail')

      // trigger the validation logic for fooRadio0 only
      fooRadio0.attr('_answerVm.values', 'has a value')
      assert.equal(fooRadio0.attr('_answerVm.errors'), null, 'fooRadio0 button should be valid')
      assert.equal(fooRadio1.attr('_answerVm.errors'), null, 'fooRadio1 button is in group and should also be valid')
    })
  })
})
