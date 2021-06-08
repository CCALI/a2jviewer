import DefineMap from 'can-define/map/map'
import CanList from 'can-list'
import Component from 'can-component'
import template from './debug-panel.stache'

/**
 * @property {DefineMap} debugPanel.ViewModel
 * @parent <debug-panel>
 *
 * `<debug-panel>`'s viewModel.
 */
export let DebugPanelVM = DefineMap.extend('DebugPanelVM', {
  // passed in via viewer-preview-layout.stache bindings
  interview: {},
  traceMessage: {},
  previewPageName: {},
  appState: {},
  currentPageName: {
    get () {
      return this.traceMessage.currentPageName
    }
  },

  /**
   * @property {can.List} authorDebugPanel.ViewModel.prototype.variables variables
   * @parent authorDebugPanel.ViewModel
   *
   * list of variables used in the interview and their values
   */
  variables: {
    get () {
      const interview = this.interview

      return interview
        ? interview.attr('variablesList')
        : new CanList([])
    }
  },

  /**
   * @function authorDebugPanel.ViewModel.prototype.clearMessageLog clearMessageLog
   * @parent authorDebugPanel.ViewModel
   *
   * clear messages from the trace logic list
   *
   * Remove all message from the list, but leave a single entry for the current page.
   * This allows new messages to be added before the user navigates to a new page.
   */
  clearMessageLog () {
    this.traceMessage.clearMessageLog()
  },

  connectedCallback (el) {
    this.listenTo('currentPageName', (ev, newVal, oldVal) => {
      const $pageName = $(`span.page:contains(${newVal})`)
      const pageNameTop = $pageName[0].offsetTop
      const $debugPanel = $('#logic-trace-panel')
      const modifier = 5

      setTimeout(() => {
        $debugPanel.animate({ scrollTop: (pageNameTop - modifier) }, 100)
      }, 0)
    })

    return () => {
      this.stopListening()
    }
  }
})

/**
 * @module {Module} author/debug-panel/ <debug-panel>
 * @parent api-components
 *
 * this component displays the debug-panel for the author view
 *
 * ## Use
 *
 * @codestart
 *   <debug-panel
 *     interview:from="interview" />
 * @codeend
 */
export default Component.extend({
  view: template,
  ViewModel: DebugPanelVM,
  tag: 'debug-panel',

  helpers: {
    /**
     * @function authorDebugPanel.prototype.traceMessageFormat traceMessageFormat
     * @parent authorDebugPanel
     *
     * helper used to get the class name to format each message fragment's span
     */
    traceMessageFormat (format, msg) {
      if (format === 'val') {
        format = (!msg) ? 'valBlank'
          : ((msg === true || msg === 'true') ? 'valT'
            : ((msg === false || msg === 'false') ? 'valF' : format.toLowerCase()))
      }

      return format
    },
    /**
     * @function authorDebugPanel.prototype.blankValFormat blankValFormat
     * @parent authorDebugPanel
     *
     * Format a message - used for providing "blank" for empty values set by the user
     */
    blankValFormat (format, msg) {
      return (format === 'val' && !msg) ? 'blank' : msg
    }
  }

  // leakScope: true
})
