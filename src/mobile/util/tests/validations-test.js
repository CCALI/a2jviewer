import { assert } from 'chai'
import Validations from '~/src/mobile/util/validations'
import moment from 'moment'

describe('Validations', function () {
  let validations

  describe('config', () => {
    it('empty', function () {
      validations = new Validations()

      let invalid = validations.required() ||
        validations.maxChars() ||
        validations.min() ||
        validations.max()

      assert.ok(!invalid, 'empty config attrs are ignored')
    })

    it('min', () => {
      validations = new Validations({
        config: {
          type: 'datemdy'
        }
      })

      validations.config.min = 'TODAY'
      assert.equal(validations.config.min.toString(), moment().format('MM/DD/YYYY'), 'min - TODAY')

      validations.config.min = 'FOOBAR'
      assert.equal(validations.config.min, '', 'min - FOOBAR')
    })

    it('max', () => {
      validations = new Validations({
        config: {
          type: 'datemdy'
        }
      })

      validations.config.max = 'TODAY'
      assert.equal(validations.config.max.toString(), moment().format('MM/DD/YYYY'), 'max - TODAY')

      validations.config.max = 'FOOBAR'
      assert.equal(validations.config.max, '', 'max - FOOBAR')
    })
  })

  describe('validations:required', function () {
    beforeEach(function () {
      validations = new Validations({
        config: {
          required: true
        }
      })
    })

    it('simple', function () {
      validations.val = ''
      assert.ok(validations.required(), 'val is invalid')

      validations.val = 'foo'
      assert.ok(!validations.required(), 'val is valid')
    })

    it('null/undefined', function () {
      assert.ok(validations.required(), 'val is invalid')

      validations.val = null
      assert.ok(validations.required(), 'val is invalid')
    })

    it('object val', function () {
      assert.ok(validations.required(), 'val is invalid')

      validations.val = {}
      assert.ok(!validations.required(), 'val is valid')
    })
  })

  describe('validations:maxChars', function () {
    beforeEach(function () {
      validations = new Validations({
        config: {
          maxChars: 1
        }
      })
    })

    it('simple', function () {
      validations.val = 'f'
      assert.ok(!validations.maxChars(), 'valid')

      validations.val = 'foo'
      assert.ok(validations.maxChars(), 'invalid')
    })
  })

  describe('validations:min', function () {
    beforeEach(function () {
      validations = new Validations()
    })

    it('number', function () {
      validations.config.min = 10
      validations.val = 10
      assert.ok(!validations.min(), 'valid')

      validations.val = 9
      assert.ok(validations.min(), 'invalid')
    })

    it('handles min values of 0', function () {
      validations.config.min = 0
      validations.val = 10
      assert.ok(!validations.min(), 'valid')

      validations.val = -1
      assert.ok(validations.min(), 'invalid')
    })

    it('handles entered value of 0 against higher min', function () {
      validations.config.min = 1
      validations.val = 1
      assert.ok(!validations.min(), 'valid')

      validations.val = 0
      assert.ok(validations.min(), 'invalid')
    })

    it('date', function () {
      validations.config.type = 'datemdy'
      validations.config.min = ''
      validations.val = '11/30/2014'
      assert.ok(!validations.min(), 'valid - no min')

      validations.config.min = '12/01/2014'
      assert.ok(validations.min(), 'invalid')

      validations.val = '12/01/2014'
      assert.ok(!validations.min(), 'valid')
    })
  })

  describe('validations:max', function () {
    beforeEach(function () {
      validations = new Validations()
    })

    it('number', function () {
      validations.config.max = 10
      validations.val = 10
      assert.ok(!validations.max(), 'valid')

      validations.val = 11
      assert.ok(validations.max(), 'invalid')
    })

    it('handles max values of 0', function () {
      validations.config.max = 0
      validations.val = -10
      assert.ok(!validations.max(), 'valid')

      validations.val = 3
      assert.ok(validations.max(), 'invalid')
    })

    it('handles entered value of 0 against higher max', function () {
      validations.config.max = 1
      validations.val = 0
      assert.ok(!validations.max(), 'valid')

      validations.val = 2
      assert.ok(validations.max(), 'invalid')
    })

    it('date', function () {
      validations.config.type = 'datemdy'
      validations.config.max = ''
      validations.val = '01/01/2015'
      assert.ok(!validations.max(), 'valid - no max')

      validations.config.max = '12/31/2014'
      assert.ok(validations.max(), 'invalid')

      validations.val = '12/31/2014'
      assert.ok(!validations.max(), 'valid')
    })
  })

  describe('validations:isNumber', function () {
    beforeEach(function () {
      validations = new Validations({
        config: {
          isNumber: true
        }
      })
    })

    it('isNumber', function () {
      // test is for `invalid`, so true is bad and false is good (valid number)
      validations.val = null
      assert.equal(validations.isNumber(), false, 'null is ok as unanswered value')
      validations.val = undefined
      assert.equal(validations.isNumber(), false, 'undefined is ok as unanswered value')
      validations.val = ''
      assert.equal(validations.isNumber(), false, 'empty string is ok as unanswered value')
      // handles numbers including zero, and negative numbers
      validations.val = 42
      assert.equal(validations.isNumber(), false, '42 is a valid number')
      validations.val = 0
      assert.equal(validations.isNumber(), false, 'zero is a valid number')
      validations.val = -43.67
      assert.equal(validations.isNumber(), false, '-43.67 (negative number) is a valid number')

      // handles string
      validations.val = 'lasercats'
      assert.equal(validations.isNumber(), true, 'strings other than empty string are invalid')
      validations.val = '42'
      assert.equal(validations.isNumber(), true, 'strings other than empty string are invalid')
      validations.val = '0'
      assert.equal(validations.isNumber(), true, 'strings other than empty string are invalid')

      // handles infinity, -infinity, and NaN which are all not numbers for our use case
      validations.val = Infinity
      assert.equal(validations.isNumber(), true, 'Infinity is invalid for A2J purposes')
      validations.val = -Infinity
      assert.equal(validations.isNumber(), true, '-Infinity is invalid for A2J purposes')
      validations.val = NaN
      assert.equal(validations.isNumber(), true, 'NaN is invalid for A2J purposes')
    })
  })

  describe('validations:isDate', function () {
    beforeEach(function () {
      validations = new Validations({
        config: {
          isDate: true
        }
      })
    })

    it('handles unanswered dates', function () {
      // test is for `invalid`, so true is bad and false is good (valid number)
      validations.val = null
      assert.equal(validations.isDate(), false, 'null is ok as unanswered value')
      validations.val = undefined
      assert.equal(validations.isDate(), false, 'undefined is ok as unanswered value')
      validations.val = ''
      assert.equal(validations.isDate(), false, 'empty string is ok as unanswered value')
    })

    it('fails on string dates that are too short or too long', function () {
      validations.val = '12345'
      assert.equal(validations.isDate(), true, '5 too short, need 6 digits for valid mdy date sans slashes, ex: 020499')

      validations.val = '12345678911'
      assert.equal(validations.isDate(), true, '11 too long, 10 digits is max with slashes, ex: 02/03/2014')
    })

    it('uses moment test valid dates for other cases', function () {
      validations.val = 'crazydate'
      assert.equal(validations.isDate(), true, 'invalid string dates caught by moment library')

      validations.val = '02/02/1980'
      assert.equal(validations.isDate(), false, 'invalid string dates caught by moment library')
    })
  })
})
