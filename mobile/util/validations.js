import CanMap from 'can-map'
import moment from 'moment'
import _isNull from 'lodash/isNull'
import _isUndefined from 'lodash/isUndefined'
import _isFinite from 'lodash/isFinite'

import 'can-map-define'

/**
 * @property {can.Map} validations.prototype.Config
 * @parent viewer/mobile/util/validations
 *
 * validations Config Constructor
 *
 * defines the type of each property in the validations Map
 */
let Config = CanMap.extend({
  define: {
    maxChars: {
      type: 'number'
    },

    /**
     * @property {String} validations.Config.prototype.min min
     * @parent validations.prototype.Config
     *
     * the minimum value of a property
     * if this is a datemdy type, min will be converted to a date
     * if this is a datemdy type and the value is 'TODAY', min will be converted to today's date
     * otherwise the value is returned as a number
     */
    min: {
      type: function (val) {
        if (this.attr('type') === 'datemdy') {
          if (!val) {
            return ''
          }
          let date = (val.toUpperCase() === 'TODAY') ? moment() : moment(val)
          return date.isValid() ? date.format('MM/DD/YYYY') : ''
        }

        return parseFloat(val)
      }
    },

    /**
     * @property {String} validations.Config.prototype.max max
     * @parent validations.prototype.Config
     *
     * the maximum value of a property
     * if this is a datemdy type, max will be converted to a date
     * if this is a datemdy type and the value is 'TODAY', max will be converted to today's date
     * otherwise the value is returned as a number
     */
    max: {
      type: function (val) {
        if (this.attr('type') === 'datemdy') {
          if (!val) {
            return ''
          }
          let date = (val.toUpperCase() === 'TODAY') ? moment() : moment(val)
          return date.isValid() ? date.format('MM/DD/YYYY') : ''
        }

        return parseFloat(val)
      }
    },

    /**
     * @property {Boolean} validations.Config.prototype.required required
     * @parent validations.prototype.Config
     *
     * whether the property is required
     */
    required: {
      type: 'boolean'
    },

    /**
     * @property {Boolean} validations.Config.prototype.isNumber isNumber
     * @parent validations.prototype.Config
     *
     * this value is always true to check number and numberdollar types
     */
    isNumber: {
      type: 'boolean'
    }
  }
})

/**
 * @module {can.Map} viewer/mobile/util/validations validations
 * @parent viewer/mobile/util
 *
 * Validations map
 *
 * ## Use
 *
 * @codestart
 *   var validations = new Validations({
 *      config: {
 *        type: 'datemdy',
 *        min: '12/01/2012',
 *        max: 'TODAY',
 *        required: true
 *     }
 *   });
 *   validations.attr('val', '12/15/2014');
 *   var error = validations.required() || validations.min() || validations.max();
 * @codeend
 */
export default CanMap.extend({
  define: {
    /**
     * @property {can.Map} validations.prototype.config config
     * @parent validations
     *
     * instance of Config map
     */
    config: {
      Type: Config,
      Value: Config
    },

    /**
     * @property {String} validations.prototype.val val
     * @parent validations
     *
     * current value
     */
    val: {}
  },

  /**
   * @property {String} validations.prototype.require require
   * @parent validations
   *
   * returns true if the val is required and empty
   */
  required: function () {
    if (this.config.required &&
      (_isNull(this.val) ||
        _isUndefined(this.val) ||
        (typeof this.val === 'string' && !this.val.length))) {
      return true
    }
  },

  /**
   * @property {String} validations.prototype.maxChars maxChars
   * @parent validations
   *
   * returns true if the val is longer than the configured maxChars
   */
  maxChars: function () {
    if (this.config.maxChars &&
      this.val && this.val.length > this.config.maxChars) {
      return true
    }
  },

  /**
   * @property {String} validations.prototype.min min
   * @parent validations
   *
   * returns true if the val is lower than the configured minimum
   */
  min: function () {
    if (this.config.min || this.config.min === 0) {
      // 0 is legit value to test against min
      if (!this.val && this.val !== 0) {
        return false
      }

      if (this.config.type === 'datemdy') {
        if (moment(this.val).isBefore(this.config.min)) {
          return true
        }
      } else {
        if (this.val < this.config.min) {
          return true
        }
      }
    }
  },

  /**
   * @property {String} validations.prototype.max max
   * @parent validations
   *
   * returns true if the val is higher than the configure maximum
   */
  max: function () {
    if (this.config.max || this.config.max === 0) {
      // 0 is legit value to test against min
      if (!this.val && this.val !== 0) {
        return false
      }

      if (this.config.type === 'datemdy') {
        if (moment(this.val).isAfter(this.config.max)) {
          return true
        }
      } else {
        if (this.val > this.config.max) {
          return true
        }
      }
    }
  },

  /**
   * @property {String} validations.prototype.isNumber isNumber
   * @parent validations
   *
   * using custom text input for number values, this assures it's a number
   */
  isNumber: function () {
    if (this.config.isNumber) {
      // null, empty string, and undefined are valid as unanswered number questions
      if (this.val == null || this.val === '') {
        return false
      } else {
      // infinity, NaN, and -infinity are invalid, as are string numbers
        return !_isFinite(this.val)
      }
    }
  },

  /**
   * @property {String} validations.prototype.date date
   * @parent validations
   *
   * check if valid date, return true if invalid, false === valid
   */
  isDate: function () {
    // null, empty string, and undefined are valid as unanswered number questions
    if (this.val == null || this.val === '') {
      return false
    // fail too short or too long values automatically
    } else if (this.val.length < 6 || this.val.length > 10) {
      return true
    } else {
      return !moment(this.val).isValid()
    }
  }
})
