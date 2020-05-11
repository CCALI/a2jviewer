import CanList from 'can-list'
import { assert } from 'chai'
import readableList from '../readable-list'

import 'steal-mocha'

describe('readableList', function () {
  it('returns empty string if list has only blank values', function () {
    const values = new CanList([null, undefined, ''])
    assert.equal(readableList(values), '', 'should return empty string')
  })

  it('zero 0 is not a blank value', function () {
    const values = new CanList([null, '0'])
    assert.equal(readableList(values), '0', 'should not strip 0')
  })

  it('separates two values using "and" or lang.RepeatAnd', function () {
    const values = new CanList([null, 'Ana', 'Maria'])

    assert.equal(
      readableList(values, {}),
      'Ana and Maria',
      'should use "and" as separator when lang.RepeatAnd missing'
    )

    assert.equal(
      readableList(values, { RepeatAnd: 'or' }),
      'Ana or Maria',
      'should use lang.RepeatAnd if provided'
    )
  })

  it('uses commas to separate more than two values', function () {
    const values = new CanList([null, 'Ana', 'Maria', 'Jose'])

    assert.equal(
      readableList(values, {}),
      'Ana, Maria and Jose',
      'should use "and" as separator when lang.RepeatAnd missing'
    )

    assert.equal(
      readableList(values, { RepeatAnd: 'or' }),
      'Ana, Maria or Jose',
      'should use lang.RepeatAnd if provided'
    )
  })
})
