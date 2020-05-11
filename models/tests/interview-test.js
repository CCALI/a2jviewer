import { assert } from 'chai'
import Interview from 'caja/viewer/models/interview'
import CanMap from 'can-map'

describe('Interview model', function () {
  it('parseModels', function () {
    const dfd = Interview.findOne({ url: '/parse-model-interview.json' })

    return dfd.then(function (interview) {
      const data = interview.serialize()

      assert.deepEqual(data.pages, [{
        step: {
          number: '1',
          text: 'Small Estate Affidavit'
        },
        fields: [{
          name: 'user gender',
          type: 'text',
          options: ''
        }],
        name: '1-Introduction'
      }])

      assert.deepEqual(data._pages, {
        '1-Introduction': {
          step: 0,
          name: '1-Introduction',
          fields: [{
            name: 'user gender',
            type: 'text',
            options: ''
          }]
        }
      })

      assert.deepEqual(data.answers, {})
    })
  })

  describe('guideAvatarGender', function () {
    let interview

    beforeEach(function () {
      interview = new Interview()
    })

    it('is not serialized', function () {
      let serialized = interview.serialize()
      assert.notProperty(serialized, 'guideAvatarGender')
    })

    it('defaults to "female"', function () {
      assert.equal(interview.attr('guideAvatarGender'), 'female')
    })

    it('computes its value from "guideGender"', function () {
      interview.attr('guideGender', 'Male')
      assert.equal(interview.attr('guideAvatarGender'), 'male')

      interview.attr('guideGender', 'fEmaLe')
      assert.equal(interview.attr('guideAvatarGender'), 'female')
    })
  })

  describe('avatarGender', function () {
    let interview

    beforeEach(function () {
      interview = new Interview()
    })

    it('is not serialized', function () {
      let serialized = interview.serialize()
      assert.notProperty(serialized, 'avatarGender')
    })

    it('computes its value from the answer of the "user gender" variable', function () {
      let answers = interview.attr('answers')

      assert.notProperty(answers.attr(), 'user gender',
        'interview has no "user gender" variable')
      assert.isUndefined(interview.attr('avatarGender'))

      answers.attr('user gender', {
        name: 'user gender',
        values: [null]
      })
      assert.property(answers.attr(), 'user gender')
      assert.isUndefined(interview.attr('avatarGender'), 'variable has no value')

      answers.attr('user gender').attr('values').push('m')
      assert.equal(interview.attr('avatarGender'), 'male')

      answers.attr('user gender').attr('values').push('female')
      assert.equal(interview.attr('avatarGender'), 'female')
    })
  })

  it('filters out steps with no pages', function () {
    let parsedData = Interview.parseModel({
      pages: {
        'page-1': { step: 0 },
        'page-2': { step: 0 },
        'page-3': { step: 1 }
      },
      steps: [
        { number: 0, text: 'Step 0' },
        { number: 1, text: 'Step 1' },
        { number: 2, text: 'Step 2' }
      ]
    })

    let interview = new Interview(parsedData)
    let steps = interview.attr('steps')

    assert.equal(steps.attr('length'), 2,
      '"Step 2" has not pages so it should not be included')

    assert.equal(steps.attr('0.number'), 0, '"Step 0" has pages')
    assert.equal(steps.attr('1.number'), 1, '"Step 1" has pages')
  })

  it('variablesList', () => {
    let interview = new Interview()
    interview.attr('vars', {
      'var a': { name: 'var a', repeating: true, values: [ null ] },
      'var b': { name: 'var b', repeating: true, values: [ null ] },
      'var c': { name: 'var c', repeating: false, values: [ null ] }
    })

    assert.deepEqual(interview.attr('variablesList').attr(), [
      { name: 'var a', repeating: null, value: null },
      { name: 'var b', repeating: null, value: null },
      { name: 'var c', repeating: null, value: null }
    ], 'should set value to null when values is [ null ]')

    interview.attr('vars', {
      'var a': { name: 'var a', repeating: true, values: [ null, 'foo' ] },
      'var b': { name: 'var b', repeating: true, values: [ null, 'bar' ] },
      'var c': { name: 'var c', repeating: false, values: [ null, 'non-repeating' ] }
    })

    assert.deepEqual(interview.attr('variablesList').attr(), [
      { name: 'var a', repeating: 1, value: 'foo' },
      { name: 'var b', repeating: 1, value: 'bar' },
      { name: 'var c', repeating: null, value: 'non-repeating' }
    ], 'should set value to "foo" when values is [ null, "foo" ]')

    interview.attr('vars', {
      'var a': { name: 'var a', repeating: true, values: [ null, 'foo', 'baz' ] },
      'var b': { name: 'var b', repeating: true, values: [ null, 'bar', 'zed' ] },
      'var c': { name: 'var c', repeating: false, values: [ null, 'non-repeating' ] }
    })

    assert.deepEqual(interview.attr('variablesList').attr(), [
      { name: 'var a', repeating: 1, value: 'foo' },
      { name: 'var a', repeating: 2, value: 'baz' },
      { name: 'var b', repeating: 1, value: 'bar' },
      { name: 'var b', repeating: 2, value: 'zed' },
      { name: 'var c', repeating: null, value: 'non-repeating' }
    ], 'should create two entries with values "foo" and "baz" when values is [ null, "foo", "baz" ]')
  })

  describe('clearAnswers', function () {
    let interview

    beforeEach(function () {
      interview = new Interview()
      let answers = new CanMap({
        name: {
          comment: '',
          name: 'Name',
          repeating: false,
          type: 'text',
          values: [null, 'Muddy']
        },
        gender: {
          comment: '',
          name: 'Gender',
          repeating: false,
          type: 'text',
          values: [null, 'Male']
        },
        salary: {
          comment: '',
          name: 'Salary',
          repeating: true,
          type: 'number',
          values: [null, 100, 200, 300]
        },
        lang: {
          0: 'e',
          1: 'n',
          Exit: 'Exit'
        }
      })

      interview.attr('answers', answers)
    })

    it('clears repeating answers', function () {
      let answers = interview.attr('answers')
      interview.clearAnswers()

      let salary = answers.attr('salary')
      let values = salary.attr('values')
      assert.equal(values.length, 1)
      assert.equal(values[0], null)
    })

    it('clears all answers', function () {
      let answers = interview.attr('answers')
      interview.clearAnswers()

      answers.forEach(function (answer) {
        let values = answer.attr('values')
        if (values) { // skip answers without values prop
          assert.equal(values.length, 1)
          assert.equal(values[0], null)
        }
      })
    })

    it('does nothing if values array not on answer', function () {
      let answers = interview.attr('answers')
      interview.clearAnswers()

      let lang = answers.attr('lang')
      assert.notProperty(lang, 'values', 'no values array added to lang')
    })
  })
})
