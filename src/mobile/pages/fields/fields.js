import DefineMap from 'can-define/map/map'
import Component from 'can-component'
import template from './fields.stache'

/**
 * @property {can.Map} fields.ViewModel
 * @parent <a2j-fields>
 *
 * `<a2j-fields>`'s viewModel.
 */
export const FieldsVM = DefineMap.extend('FieldsVM', {
  // passed in via pages.stache bindings
  lang: {},
  logic: {},
  fields: {},
  appState: {},
  modalContent: {
    get () {
      return this.appState.modalContent
    }
  },

  lastIndexMap: {},

  groupValidationMap: {},

  buildGroupValidationMap () {
    const fields = this.fields
    const groupValidationMap = new DefineMap()

    if (fields.length) {
      fields.forEach((field) => {
        const varName = field.name
        groupValidationMap.set(varName, false)
      })
    }

    return groupValidationMap
  },

  buildLastIndexMap () {
    const fields = this.fields
    const lastIndexMap = new DefineMap()

    if (fields.length) {
      fields.forEach((field, index) => {
        const varName = field.name
        lastIndexMap.set(varName, index)
      })
    }

    return lastIndexMap
  },

  connectedCallback () {
    // first page
    this.groupValidationMap = this.buildGroupValidationMap()
    this.lastIndexMap = this.buildLastIndexMap()

    const fieldsHandler = () => {
      this.groupValidationMap = this.buildGroupValidationMap()
      this.lastIndexMap = this.buildLastIndexMap()
    }
    // navigated pages which resets fields list
    this.listenTo('fields', fieldsHandler)

    return () => {
      this.stopListening('fields', fieldsHandler)
    }
  }
})

/**
 * @module {Module} viewer/mobile/pages/fields/ <a2j-fields>
 * @parent api-components
 *
 * This component displays a list of `<a2j-field>` components.
 *
 * ## Use
 *
 * @codestart
 * <a2j-fields {(fields)}="fields"></a2j-fields>
 * @codeend
 */
export default Component.extend({
  view: template,
  leakScope: true,
  tag: 'a2j-fields',
  ViewModel: FieldsVM
})
