import { assert } from 'chai'
import Field from '~/src/models/field'
import Answer from '~/src/models/answer'

import 'steal-mocha'

describe('Field Model', function () {
  let fieldModel
  let expectedResult
  beforeEach(() => {
    fieldModel = new Field()
  })

  it('options', () => {
    assert.equal(fieldModel.options, '', 'new Field() options default to empty string')
  })

  it('emptyAnswer', () => {
    expectedResult = {
      name: 'firstname',
      type: 'text',
      repeating: false,
      values: [null]
    }

    fieldModel.assign(expectedResult)

    const emptyAnswer = fieldModel.emptyAnswer
    assert.deepEqual(emptyAnswer.serialize(), expectedResult, 'empty answer should match set Field props')

    const instanceOfAnswer = emptyAnswer instanceof Answer
    assert.equal(instanceOfAnswer, true, 'empty answer should be instance of Answer model')
  })

  it('getOptions', () => {
    const colorList = '<option>Pink</option><option>Blue</option><option>Red</option>'
    fieldModel.listData = colorList
    fieldModel.getOptions('')

    assert.equal(fieldModel.options, '<option>Pink</option><option>Blue</option><option>Red</option>', 'getOptions should set Field.options')
  })

  afterEach(() => {
    fieldModel = null
  })
})
