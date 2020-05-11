import CanMap from 'can-map'
import CanList from 'can-list'
import _find from 'lodash/find'
import Field from 'caja/viewer/models/field'

import 'can-map-define'

const Page = CanMap.extend({
  define: {
    step: {
      // forces the conversion of TStep objects when converting
      // `window.gGuide` to an Interview model instance.
      Type: CanMap
    },

    fields: {
      Type: Field.List
    },

    // whether this page has an 'user gender' or 'user avatar' field.
    hasUserGenderOrAvatarField: {
      serialize: false,

      get () {
        let fields = this.attr('fields')

        return !!_find(fields, function (field) {
          let fieldName = field.attr('name').toLowerCase()
          return fieldName === 'user gender' || fieldName === 'user avatar'
        })
      }
    }
  }
})

Page.List = CanList.extend({
  Map: Page
}, {
  find (name) {
    return _find(this, p => p.attr('name') === name)
  }
})

export default Page
