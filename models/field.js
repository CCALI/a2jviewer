import $ from 'jquery'
import CanMap from 'can-map'
import CanList from 'can-list'
import Answer from 'caja/viewer/models/answer'
import normalizePath from 'caja/viewer/util/normalize-path'
import setupPromise from 'can-reflect-promise'

import 'can-map-define'

/**
 * @module {can.Map} Field
 * @parent api-models
 *
 * A map representing a field of an interview page
 */
const Field = CanMap.extend('FieldModel', {
  define: {
    options: {
      value: ''
    },

    hasError: {},

    _answerVm: {},

    emptyAnswer: {
      get () {
        return new Answer({
          name: this.attr('name').toLowerCase(),
          repeating: this.attr('repeating'),
          type: this.attr('type'),
          values: [null]
        })
      }
    }
  },

  /**
   * @function getOptions
   * @return {jQuery.Deferred} A deferred object that resolves to a list
   *
   * List of options of a given field (e.g select box options)
   *
   * Some fields, like a select box, require a list of options for the
   * user to pick. The options might be already available in the listData
   * property or if listSrc is defined, an ajax request should be triggered to
   * get the options from a different endpoint or an XML stored in the guide
   * folder
   */
  getOptions (guidePath) {
    let dfd = $.Deferred()
    setupPromise(dfd)
    let listSrc = this.attr('listSrc')
    let listData = this.attr('listData')

    if (!listData && !listSrc) {
      return dfd.reject(new Error('Missing listData or listSrc values'))
    }

    if (listData) {
      this.attr('options', listData)
      return dfd.resolve(listData)
    }

    if (listSrc) {
      let ajaxOptions = {
        dataType: 'text',
        url: normalizePath(guidePath, listSrc)
      }

      $.ajax(ajaxOptions)
        .then(options => {
          // strip anything before or after option tags
          let formatted = options.replace(/<select>/ig, '').replace(/<\/select/ig, '')
          this.attr('options', formatted)
          dfd.resolve(formatted)
        })
        .then(null, function (error) {
          dfd.reject(error)
        })
    }

    return dfd
  }
})

Field.List = CanList.extend({
  Map: Field
}, {})

export default Field
