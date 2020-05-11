import CanMap from 'can-map'
import Component from 'can-component'
import template from './header.stache'

import 'can-map-define'

/**
 * @module {Module} viewer/mobile/header/ <a2j-header>
 * @parent api-components
 *
 * Represents the header of the mobile viewer.
 *
 * ## Use
 *
 * @codestart
 *   <a2j-header {m-state}="mState" {p-state}="pState" />
 * @codeend
 */

/**
 * @property {can.Map} header.ViewModel
 * @parent viewer/mobile/header/
 *
 * `<a2j-header>` viewModel.
 */
const HeaderVM = CanMap.extend({
  define: {
    /**
     * @property {Booelan} header.ViewModel.prototype.disableSaveButton disableSaveButton
     * @parent conditional.ViewModel
     *
     * Whether the save button should be disabled or not.
     */
    disableSaveButton: {
      value: false
    },

    /**
     * @property {Booelan} header.ViewModel.prototype.showSaveButton showSaveButton
     * @parent conditional.ViewModel
     *
     * Whether the display the save button.
     */
    showSaveButton: {
      get () {
        return !!this.attr('mState.autoSetDataURL')
      }
    }
  },

  toggleCredits () {
    const currentVal = this.attr('mState.showCredits')
    this.attr('mState.showCredits', !currentVal)
  },

  save () {
    this.attr('disableSaveButton', true)

    this.attr('pState').save().always(() => {
      this.attr('disableSaveButton', false)
    })
  }
})

export default Component.extend({
  view: template,
  leakScope: false,
  tag: 'a2j-header',
  ViewModel: HeaderVM
})
