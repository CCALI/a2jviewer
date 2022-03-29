import CanMap from 'can-map'
import eventQueue from 'can-event-queue/map/map'
import regex from '~/src/mobile/util/regex'
import tLogic from '~/src/mobile/util/tlogic'
import Lang from '~/src/mobile/util/lang'
import cString from '@caliorg/a2jdeps/utils/string'
import cDate from '@caliorg/a2jdeps/utils/date'
import constants from '~/src/models/constants'
import _forEach from 'lodash/forEach'
import numeral from 'numeral'

import 'can-map-define'

export default CanMap.extend({
  define: {
    gotoPage: {
      get: function () {
        return this._tLogic.GOTOPAGE
      },

      set: function (val) {
        this._tLogic.GOTOPAGE = val
      }
    }
  },

  init: function () {
    this.guide = this.attr('interview').createGuide()

    const stringMethods = ['ismdy', 'decodeEntities', 'escapeHtml', 'jquote', 'isNumber']

    const dateMethods = ['swapMonthAndDay', 'dateToString', 'dateToDays', 'daysToDate', 'todaysDate', 'dateDiff']

    const traceMethods = ['traceTag']
    const methods = [this.guide, regex, constants]

    _forEach(stringMethods, function (fn) {
      methods.push(cString[fn].bind(cString))
    })

    _forEach(dateMethods, function (fn) {
      methods.push(cDate[fn].bind(cDate))
    })

    _forEach(traceMethods, function () {
      methods.push(function () {})
    })

    // numeral replaces the jquery NumberFormatter plugin dependency in tlogic.js
    methods.push(numeral)
    methods.push(eventQueue)

    this._tLogic = tLogic.apply(this, methods)

    // TODO: This exposure is due to creating a function on the fly within
    // tlogic.js, line 539
    window.gLogic = this._tLogic

    // Exposed `lang` is required in mobile/util/tlogic.js
    const langID = this.attr('interview').language
    window.lang = new Lang(langID)
  },

  eval: function (str) {
    const output = this._tLogic.evalLogicHTML(str)

    return output.html
  },

  exec: function (cajascript) {
    return this._tLogic.executeScript(cajascript)
  },

  varExists (...args) {
    return this.guide.varExists(...args)
  },

  varCreate (...args) {
    return this.guide.varCreate(...args)
  },

  varSet (...args) {
    return this.guide.varSet(...args)
  },

  varGet (...args) {
    return this.guide.varGet(...args)
  }
})
