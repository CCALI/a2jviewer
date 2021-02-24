import $ from 'jquery'
import DefineMap from 'can-define/map/map'
import Component from 'can-component'
import template from './debug-menu.stache'
import _isFunction from 'lodash/isFunction'

/**
 * @module {Module} author/debug-menu <author-debug-menu>
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
 *   <author-debug-menu {(app-state)}="appState" />
 * @codeend
 */

let DebugMenuVM = DefineMap.extend('DebugMenuVM', {
  appState: {},

  resumeEdit () {
    this.attr('appState.page', 'pages')
  }
})

export default Component.extend({
  view: template,
  ViewModel: DebugMenuVM,
  tag: 'author-debug-menu',

  events: {
    '.btn-variables-panel click': function () {
      this.viewModel.appState.toggleDebugPanel()
    },

    '.btn-fill-sample click': function () {
      $('#author-app').trigger('author:fill-page-sample')
    },

    '.btn-resume-edit click': function () {
      let vm = this.viewModel
      let appState = vm.appState
      let previewPageName = this.viewModel.appState.previewPageName

      let $pageEditDialog = $('.page-edit-form')
      let dialogInstance = $pageEditDialog.dialog('instance')

      // return user to the pages tab.
      vm.resumeEdit()

      // if user enters preview mode by clicking the preview tab, do not try
      // to open the edit page dialog, it should only be done when user clicks
      // the preview button in the edit page dialog.
      if (dialogInstance && previewPageName) {
        appState.previewPageName = ''
        // gotoPageEdit defined in A2J_Pages.js: 314
        window.gotoPageEdit(previewPageName)
      }
    },

    '.btn-edit-this click': function () {
      let vm = this.viewModel
      let appState = vm.appState
      let pageName = appState.interviewPageName

      if (_isFunction(window.gotoPageEdit)) {
        vm.resumeEdit()
        window.gotoPageEdit(pageName)
      }
    }
  },

  leakScope: true
})
