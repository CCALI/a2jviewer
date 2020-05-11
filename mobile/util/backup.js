/*!
 * CanJS - 2.1.4
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Fri, 21 Nov 2014 22:25:48 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */
import $ from 'jquery'

import CanMap from 'can-map'
// import 'can/util/object/'
// import 'can/util/library'

let flatProps = function (a, cur) {
  var obj = {}
  for (var prop in a) {
    if (typeof a[prop] !== 'object' || a[prop] === null || a[prop] instanceof Date) {
      obj[prop] = a[prop]
    } else {
      obj[prop] = cur.attr(prop)
    }
  }

  return obj
}

let oldSetup = CanMap.prototype.setup

$.extend(CanMap.prototype, {
  setup: function () {
    this._backupStore = compute()
    return oldSetup.apply(this, arguments)
  },

  backup: function () {
    this._backupStore(this.attr())
    return this
  },

  isDirty: function (checkAssociations) {
    return this._backupStore() && !can.Object.same(this.attr(), this._backupStore(), undefined, undefined, undefined, !!checkAssociations)
  },

  restore: function (restoreAssociations) {
    var props = restoreAssociations ? this._backupStore() : flatProps(this._backupStore(), this)
    if (this.isDirty(restoreAssociations)) {
      this.attr(props, true)
    }

    return this
  }
})
