import $ from 'jquery'
import DefineMap from 'can-define/map/map'
import DefineList from 'can-define/list/list'
import Answer from '~/src/models/answer'
import normalizePath from '~/src/util/normalize-path'
import setupPromise from 'can-reflect-promise'

/**
 * @module {can.Map} Field
 * @parent api-models
 *
 * A map representing a field of an interview page
 */
const Field = DefineMap.extend('Field', {
  // these props set in src/models/page.fields which is of Type: Field.List
  calculator: {},
  invalidPrompt: {},
  label: {},
  listData: {},
  listSrc: {},
  max: {},
  maxChars: {},
  min: {},
  name: {},
  order: {},
  required: {},
  sample: {},
  type: {},
  repeating: {},
  values: {},

  options: {
    default: () => ''
  },

  hasError: {},

  _answerVm: {},

  emptyAnswer: {
    get () {
      return new Answer({
        name: this.name.toLowerCase(),
        type: this.type,
        repeating: this.repeating,
        values: [null]
      })
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
    let listSrc = this.listSrc
    let listData = this.listData

    if (!listData && !listSrc) {
      return dfd.reject(new Error('Missing listData or listSrc values'))
    }

    if (listData) {
      this.options = listData
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
          this.options = formatted
          dfd.resolve(formatted)
        })
        .then(null, function (error) {
          dfd.reject(error)
        })
    }

    return dfd
  }
})

Field.List = DefineList.extend('FieldList', {
  '#': Field
})

export default Field
