import CanMap from 'can-map'
import eventQueue from 'can-event-queue/map/map'
import regex from 'caja/viewer/mobile/util/regex'
import tLogic from 'caja/viewer/mobile/util/tlogic'
import Lang from 'caja/viewer/mobile/util/lang'
import cString from 'caja/viewer/mobile/util/string'
import cDate from 'caja/viewer/mobile/util/date'
import constants from 'caja/viewer/models/constants'
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

    let stringMethods = ['ismdy', 'decodeEntities', 'escapeHtml', 'jquote', 'isNumber']

    let dateMethods = ['swapMonthAndDay', 'dateToString', 'dateToDays', 'daysToDate', 'todaysDate', 'dateDiff']

    let traceMethods = ['traceTag']
    let methods = [this.guide, regex, constants]

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
    var langID = this.attr('interview').language
    window.lang = new Lang(langID)
  },

  eval: function (str) {
    var output = this._tLogic.evalLogicHTML(str)

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
