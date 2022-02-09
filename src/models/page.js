import DefineMap from 'can-define/map/map'
import DefineList from 'can-define/list/list'
import _find from 'lodash/find'
// import constants from '~/src/models/constants'
import Field from '~/src/models/field'

const Page = DefineMap.extend('Page Model', {
  step: {
    // forces the conversion of TStep objects when converting
    // `window.gGuide` to an Interview model instance.
    Type: DefineMap
  },

  fields: {
    Type: Field.List,
    default: () => []
  },

  // Whether the UI should show the preview button for the page.
  // The button should show if there are Assemble or Assemble & Save buttons.
  // In the future, this button will only be shown when particular requirements are met: https://github.com/CCALI/a2jviewer/issues/176
  canPreview: {
    serialize: false,

    get () {
      return false // disable showing this button until further QA - prod hotfix 02-09-2022
      // const buttons = this.buttons

      // return buttons && buttons.length > 0 ? buttons.some(button => {
      //   return button.next === constants.qIDASSEMBLE || button.next === constants.qIDASSEMBLESUCCESS
      // }) : false
    }
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
