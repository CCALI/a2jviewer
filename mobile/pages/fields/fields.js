import CanMap from 'can-map'
import Component from 'can-component'
import template from './fields.stache'

import 'a2jviewer/mobile/pages/fields/field/'
import 'can-map-define'

/**
 * @property {can.Map} fields.ViewModel
 * @parent <a2j-fields>
 *
 * `<a2j-fields>`'s viewModel.
 */
export const FieldsVM = CanMap.extend('FieldsVM', {
  define: {
    // passed in via pages.stache bindings
    lang: {},
    logic: {},
    fields: {},
    rState: {},
    modalContent: {},

    lastIndexMap: {},

    groupValidationMap: {}
  },

  buildGroupValidationMap () {
    console.log('building gvMap')
    const fields = this.attr('fields')
    const groupValidationMap = new CanMap()

    if (fields.length) {
      fields.forEach((field) => {
        const varName = field.attr('name')
        groupValidationMap.attr(varName, false)
      })
    }

    return groupValidationMap
  },

  buildLastIndexMap () {
    const fields = this.attr('fields')
    const lastIndexMap = new CanMap()

    if (fields.length) {
      fields.forEach((field, index) => {
        const varName = field.attr('name')
        lastIndexMap.attr(varName, index)
      })
    }

    return lastIndexMap
  },

  connectedCallback () {
    // first page
    this.attr('groupValidationMap', this.buildGroupValidationMap())
    this.attr('lastIndexMap', this.buildLastIndexMap())

    // navigated pages
    this.listenTo('fields', () => {
      this.attr('groupValidationMap', this.buildGroupValidationMap())
      this.attr('lastIndexMap', this.buildLastIndexMap())
    })
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
