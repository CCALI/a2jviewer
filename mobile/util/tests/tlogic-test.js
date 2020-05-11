import { assert } from 'chai'
import Tlogic from 'caja/viewer/mobile/util/tlogic'
import cString from 'caja/viewer/mobile/util/string'

let testLogic = new Tlogic(null, null, null, null, cString.decodeEntities)

describe('Tlogic', function () {
  describe('DATE', function () {
    it('DATE returns empty string if passed value is falsey', function () {
      let emptyString = testLogic._CF('DATE', '')
      let nullString = testLogic._CF('DATE', null)
      let undefinedString = testLogic._CF('DATE', undefined)

      assert.equal(emptyString, '')
      assert.equal(nullString, '')
      assert.equal(undefinedString, '')
    })
  })

  describe('SUM', function () {
    it('SUM just returns the passed in value if given a number', function () {
      let totalValue = testLogic._CF('SUM', 42)
      assert.equal(totalValue, 42)
    })

    it('SUM converts readableList display string and totals values', function () {
      let totalValue = testLogic._CF('SUM', '100, 200 and 300')
      assert.equal(totalValue, 600)
    })

    it('SUM ignores non-number values in the readableList', function () {
      let totalValue = testLogic._CF('SUM', 'blue, 4, 8 and 12')
      assert.equal(totalValue, 24)
    })

    it('SUM handles non string values, returning 0 by default', function () {
      let totalValue = testLogic._CF('SUM', null)
      assert.equal(totalValue, 0)
    })
  })

  describe('DOLLAR and DOLLARROUND', function () {
    it('DOLLAR returns a string, with cents rounded to 2 decimals', function () {
      let dollarString = testLogic._CF('DOLLAR', 1345.678)
      assert.equal(dollarString, '1,345.68')
    })

    it('DOLLARROUND returns a string, to the nearest dollar', function () {
      let dollarString = testLogic._CF('DOLLARROUND', 9872.678)
      assert.equal(dollarString, '9,873')
    })
  })

  describe('ROUND and ROUND2', function () {
    it('ROUND returns a number rounded to the nearest integer', function () {
      let roundedNumber = testLogic._CF('ROUND', 2345.678)
      assert.equal(roundedNumber, 2346)
    })

    it('ROUND2 returns a number rounded to 2 decimal points', function () {
      let roundedNumber2 = testLogic._CF('ROUND2', 2345.678)
      assert.equal(roundedNumber2, 2345.68)
    })

    it('ROUND returns a number rounded to the nearest integer, if given a string number', function () {
      let roundedNumber = testLogic._CF('ROUND', '2345.678')
      assert.equal(roundedNumber, 2346)
    })

    it('ROUND2 returns a number rounded to 2 decimal points, if given a string number', function () {
      let roundedNumber2 = testLogic._CF('ROUND2', '2345.678')
      assert.equal(roundedNumber2, 2345.68)
    })
  })

  describe('TRUNC and TRUNC2', function () {
    it('TRUNC returns a number, discarding any decimals', function () {
      let truncatedNumber = testLogic._CF('TRUNC', 2345.678)
      assert.equal(truncatedNumber, 2345)
    })

    it('TRUNC2 returns a number, discarding any digits beyond 2 decimal points', function () {
      let truncatedNumber2 = testLogic._CF('TRUNC2', 2345.678)
      assert.equal(truncatedNumber2, 2345.67)
    })

    it('TRUNC2 returns a number with only one decimal point as needed', function () {
      let truncatedNumber2 = testLogic._CF('TRUNC2', 345.6)
      assert.equal(truncatedNumber2, 345.6)
    })

    it('TRUNC returns a number, discarding any decimals, if given a string number', function () {
      let truncatedNumber = testLogic._CF('TRUNC', '2345.678')
      assert.equal(truncatedNumber, 2345)
    })

    it('TRUNC2 returns a number, discarding any digits beyond 2 decimal points, if given a string number', function () {
      let truncatedNumber2 = testLogic._CF('TRUNC2', '2345.678')
      assert.equal(truncatedNumber2, 2345.67)
    })

    it('TRUNC2 returns a number with only one decimal point as needed, if given a string number', function () {
      let truncatedNumber2 = testLogic._CF('TRUNC2', '345.6')
      assert.equal(truncatedNumber2, 345.6)
    })
  })

  describe('CONTAINS', function () {
    it('returns true if the test string is found, regardless of case', function () {
      let varValue = 'Muddy Waters'
      let stringValue = 'mud'
      let hasString = testLogic._CF('CONTAINS', varValue, stringValue)

      assert.equal(hasString, true)
    })

    it('returns false if not found', function () {
      let varValue = 'Muddy Waters'
      let stringValue = 'lasers'
      let hasString = testLogic._CF('CONTAINS', varValue, stringValue)

      assert.equal(hasString, false)
    })
  })

  describe('comments are the devil', function () {
    it('surgically removes trailing comments from a2j logic statements, but not urls', function () {
      let output

      const commentGoto = 'GOTO "1-Question" //nother comment'
      output = testLogic.removeTrailingComments(commentGoto)
      assert.equal(output, 'GOTO "1-Question"', 'handles GOTO with comment')

      const commentWithSpace = '// this is a leading space comment'
      output = testLogic.removeTrailingComments(commentWithSpace)
      assert.equal(output, '', 'handles normal comments with leading spaces')

      const commentWithoutSpace = '//this has no leading space'
      output = testLogic.removeTrailingComments(commentWithoutSpace)
      assert.equal(output, '', 'handles normal comments without leading spaces')

      const url = 'SET [url] TO "http://www.google.com"  //comment 2'
      output = testLogic.removeTrailingComments(url)
      assert.equal(output, 'SET [url] TO "http://www.google.com"', 'handles url with no leading space comment')

      const escapedUrl = 'SET [url] TO "http:\/\/azlawhelp.org/A2JRedirect/A2J-ModestMeans-FullProcess.cfm" // comment 1'
      output = testLogic.removeTrailingComments(escapedUrl)
      assert.equal(output, 'SET [url] TO "http://azlawhelp.org/A2JRedirect/A2J-ModestMeans-FullProcess.cfm"', 'handles escaped urls with leading space comment')

      const urlInComment = '//SET [url] TO "http://www.google.com"  //comment 2'
      output = testLogic.removeTrailingComments(urlInComment)
      assert.equal(output, '', 'handles comments with urls in them')
    })
  })
})
