import DefineMap from 'can-define/map/map'
import DefineList from 'can-define/list/list'
import Component from 'can-component'
import template from './debug-alerts.stache'

/**
 * @module {Module} author/debug-alerts <author-debug-alerts>
 * @parent api-components
 *
 * List of warnings/errors regarding the interview (e.g variable names that
 * are too long for HotDocs) shown to the author in preview mode.
 *
 * ## Use
 *
 * @codestart
 *  <author-debug-alerts {(alert-messages)}="alertMessages" />
 * @codeend
 */

/**
 * @property {can.Map} debugAlerts.viewModel
 * @parent author/debug-alerts
 *
 * `<author-debug-alerts>`'s viewModel.
 */
const DebugAlerts = DefineMap.extend('DebugAlerts', {
  /**
   * @property {can.List} debugAlerts.viewModel.prototype.define.alertMessages alertMessages
   * @parent debugAlerts.viewModel
   *
   * List of error/warning messages related to an interview.
   */
  alertMessages: {
    Default: DefineList
  },

  /**
   * @property {Number} debugAlerts.viewModel.prototype.define.messagesCount messagesCount
   * @parent debugAlerts.viewModel
   *
   * Number of messages currently visible to the user (when the user dismisses
   * a message this number gets updated).
   */
  messagesCount: {
    get () {
      const messages = this.alertMessages

      return messages
        .filter(m => m.open)
        .length
    }
  }
})

export default Component.extend({
  view: template,
  ViewModel: DebugAlerts,
  tag: 'author-debug-alerts',

  events: {
    '.btn-dismiss click': function () {
      const $el = $(this.element)
      const vm = this.viewModel

      $el.slideUp('slow', function () {
        vm.alertMessages.update([])
      })
    }
  }
})
