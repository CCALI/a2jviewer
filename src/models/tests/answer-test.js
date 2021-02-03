import { assert } from 'chai'
import Answer from '~/src/models/answer'

import 'steal-mocha'

describe('Answer Model', function () {
  let answer
  let expectedResult
  beforeEach(() => {
    answer = new Answer()
  })

  it('AnswerModel new instance', () => {
    answer = new Answer()
    expectedResult = {
      name: '',
      repeating: false,
      type: '',
      values: [null]
    }

    assert.deepEqual(answer.serialize(), expectedResult, 'new Answer() has sane defaults')

    // repeating should stay the default
    answer = new Answer({name: 'foo', type: 'text', values: [null, 'JessBob']})
    expectedResult = {
      name: 'foo',
      repeating: false,
      type: 'text',
      values: [null, 'JessBob']
    }
    assert.deepEqual(answer.serialize(), expectedResult, 'new Answer() takes values to the constructor')
  })

  afterEach(() => {
    answer = null
  })
})
