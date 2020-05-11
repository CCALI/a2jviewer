import { assert } from 'chai'
import Lang from 'caja/viewer/mobile/util/lang'

import 'steal-mocha'

describe('Lang', function () {
  it('english default setup', function () {
    var lang = new Lang()
    assert.equal(lang['Continue'], 'Continue', 'lang map setup correctly')
  })

  it('korean setup', function () {
    var lang = new Lang('ko')
    assert.equal(lang['Continue'], '계속', 'lang map setup correctly')
  })
})
