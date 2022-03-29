import DefineMap from 'can-define/map/map'
import Component from 'can-component'
import template from './debug-menu.stache'
import constants from '~/src/models/constants'
import _includes from 'lodash/includes'

/**
 * @module {Module} author/debug-menu <debug-menu>
 * @parent api-components
 *
 * This component renders some buttons that allow the user (author) to debug
 * the interview in the "preview" tab. Among these options there is the button
 * that toggles the variables panel and the button that takes the user straight
 * to the page edit modal.
 *
 * ## Use
 *
 * @codestart
 *   <debug-menu {(app-state)}="appState" />
 * @codeend
 */

// List of field types that can be filled with the `sample` property.
const canUseSampleValues = [
  constants.ftText, constants.ftTextLong,
  constants.ftTextPick, constants.ftNumber,
  constants.ftNumberDollar, constants.ftNumberSSN,
  constants.ftNumberPhone, constants.ftNumberZIP,
  constants.ftNumberPick, constants.ftDateMDY
]

const DebugMenuVM = DefineMap.extend('DebugMenuVM', {
  // passed in via stache
  appState: {},

  currentPageName: {
    get () {
      return this.appState.page
    }
  },

  validateSampleFill (fieldVM, context, fieldEl) {
    return fieldVM.validateField(context, fieldEl)
  },

  fillPageSample () {
    // fieldElements NodeList used to access individual FieldVMs & validate
    const fieldElements = document.querySelectorAll('a2j-field')
    // do nothing if `a2j-field` components not in the DOM.
    if (!fieldElements.length) return

    let fieldVM
    let fieldModel

    for (const fieldEl of fieldElements) {
      fieldVM = fieldEl.viewModel
      fieldModel = fieldVM.field
      if (_includes(canUseSampleValues, fieldModel.type)) {
        // this emulates user input and onBlur validation
        fieldEl.value = fieldModel.sample
        this.validateSampleFill(fieldVM, null, fieldEl)
      }
    }
  }
})

export default Component.extend({
  view: template,
  ViewModel: DebugMenuVM,
  tag: 'debug-menu',

  leakScope: true
})
