import $ from 'jquery'
import { assert } from 'chai'
import compute from 'can-compute'
import setMobileDesktopClass from 'caja/viewer/util/set-mobile-desktop-class'

import 'steal-mocha'

describe('setMobileDesktopClass', function () {
  it('sets "mobile" or "desktop" class to "el" based on compute value', function () {
    let $el = $('#test-area')

    // just to make sure the method toggles classes properly
    $el.addClass('mobile desktop')
    let mobile = compute(true)

    setMobileDesktopClass(mobile, $el)
    assert.isTrue($el.hasClass('mobile'))
    assert.isFalse($el.hasClass('desktop'))

    // it should toggle classes if the compute value changes
    mobile(false)
    assert.isFalse($el.hasClass('mobile'))
    assert.isTrue($el.hasClass('desktop'))
  })
})
