import { assert } from 'chai'
import getSkinTone from 'caja/viewer/models/get-skin-tone'

import 'steal-mocha'

describe('getSkinTone', function () {
  it('maps "avatar1" and legacy values to "lighter"', function () {
    assert.equal(getSkinTone(null), 'lighter')
    assert.equal(getSkinTone(''), 'lighter')
    assert.equal(getSkinTone('blank'), 'lighter')
    assert.equal(getSkinTone('avatar1'), 'lighter')
  })

  it('maps "avatar2" and legacy values to "dark"', function () {
    assert.equal(getSkinTone('tan'), 'dark')
    assert.equal(getSkinTone('avatar2'), 'dark')
  })

  it('maps "avatar3" and legacy values to "darker"', function () {
    assert.equal(getSkinTone('tan2'), 'darker')
    assert.equal(getSkinTone('avatar3'), 'darker')
  })
})
