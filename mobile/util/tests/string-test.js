import cString from 'caja/viewer/mobile/util/string'
import { assert } from 'chai'
import 'steal-mocha'

describe('util: string', function () {
  describe('isNumber', function () {
    it('Returns true if given a number value', function () {
      let isNumber = cString.isNumber(42)
      assert.equal(isNumber, true)
    })

    it('Returns true if given a number as a string', function () {
      let isNumber = cString.isNumber('42')
      assert.equal(isNumber, true)
    })

    it('Returns false if given a non-number string value', function () {
      let isNumber = cString.isNumber('SallyForth')
      assert.equal(isNumber, false)
    })

    it('Returns false if testing against NaN', function () {
      let isNumber = cString.isNumber(NaN)
      assert.equal(isNumber, false)
    })
  })

  describe('textToNumber', function () {
    it('returns null if falsey value', function () {
      assert.equal(cString.textToNumber(''), null, 'empty string did not return null')
      assert.equal(cString.textToNumber(null), null, 'null did not return null, really?!!?')
      assert.equal(cString.textToNumber(undefined), null, 'undefined did not return null')
      assert.equal(cString.textToNumber(false), null, 'boolean false did not return to null')
    })

    it('returns a number if a string number', function () {
      assert.equal(cString.textToNumber('456'), 456, 'string number did not return a number')
    })

    it('returns a number from a string with comma seperators', function () {
      assert.equal(cString.textToNumber('4,567,890'), 4567890, 'string number with commas not parsed correctly')
    })
  })

  describe('escapeHtml', function () {
    it('returns emptystring if null or undefined', function () {
      let html
      assert.equal(cString.escapeHtml(html), '', 'should handle undefined, returning empty string for display')

      html = null
      assert.equal(cString.escapeHtml(html), '', 'should handle null, returning empty string for display')

      html = 'someString ' + undefined
      assert.equal(cString.escapeHtml(html), 'someString undefined', 'should not clear undefined on coerced values')
    })

    it('escapes &, ", <, >', function () {
      const html = 'peas & carrots are < or > "what"?'
      const expectedOutput = 'peas &amp; carrots are &lt; or &gt; &quot;what&quot;?'
      assert.equal(cString.escapeHtml(html), expectedOutput, 'should escape for php safety')
    })
  })
})
