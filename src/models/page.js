import DefineMap from 'can-define/map/map'
import DefineList from 'can-define/list/list'
import _find from 'lodash/find'
import Field from '~/src/models/field'

const Page = DefineMap.extend('Page Model', {
  foobar: {
    default: "whatatest"
  },
  step: {
    // forces the conversion of TStep objects when converting
    // `window.gGuide` to an Interview model instance.
    Type: DefineMap
  },

  fields: {
    Type: Field.List,
    default: () => []
  },

  // whether this page has an 'user gender' or 'user avatar' field.
  hasUserGenderOrAvatarField: {
    serialize: false,

    get () {
      let fields = this.fields

      return !!_find(fields, function (field) {
        let fieldName = field.name.toLowerCase()
        return fieldName === 'user gender' || fieldName === 'user avatar'
      })
    }
  }
})

Page.List = DefineList.extend('PageList', {
  '#': Page,
  find (name) {
    return _find(this, p => p.name === name)
  }
})

export default Page
