import DefineMap from 'can-define/map/map'
import Component from 'can-component'
import template from './header.stache'

/**
 * @module {Module} viewer/mobile/header/ <a2j-header>
 * @parent api-components
 *
 * Represents the header of the mobile viewer.
 *
 * ## Use
 *
 * @codestart
 *   <a2j-header pState:from="pState" mState:from="mState" interview:from="interview" />
 * @codeend
 */

/**
 * @property {can.Map} header.ViewModel
 * @parent viewer/mobile/header/
 *
 * `<a2j-header>` viewModel.
 */
const HeaderVM = DefineMap.extend({
  // passed in from mobile.stache
  pState: {},
  mState: {},
  interview: {},
  /**
   * @property {Booelan} header.ViewModel.prototype.disableSaveButton disableSaveButton
   * @parent conditional.ViewModel
   *
   * Whether the save button should be disabled or not.
   */
  disableSaveButton: {
    default: false
  },

  /**
   * @property {Booelan} header.ViewModel.prototype.showSaveButton showSaveButton
   * @parent conditional.ViewModel
   *
   * Whether the display the save button.
   */
  showSaveButton: {
    get () {
      return !!this.mState.attr('autoSetDataURL')
    }
  },

  navPanelToggle: {},

  showNavPanel () {
    this.navPanelToggle = !this.navPanelToggle
  },

  toggleCredits () {
    const currentVal = this.mState.attr('showCredits')
    this.mState.showCredits = !currentVal
  },

  save () {
    this.disableSaveButton = true

    this.pState.save().always(() => {
      this.disableSaveButton = false
    })
  }
})

export default Component.extend({
  view: template,
  leakScope: false,
  tag: 'a2j-header',
  ViewModel: HeaderVM
})
