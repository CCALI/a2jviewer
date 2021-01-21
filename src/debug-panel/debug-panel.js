import DefineMap from 'can-define/map/map'
import DefineList from 'can-define/list/list'
import Component from 'can-component'
import template from './debug-panel.stache'
import A2JVariable from '@caliorg/a2jdeps/models/a2j-variable'
import { Gender, Hair, Skin } from '@caliorg/a2jdeps/avatar/colors'
// with the existing Guide model that works with a different data structure.

const Guide = DefineMap.extend('AppStateGuide', {
  variablesList: {
    get () {
      const vars = this.vars
      return A2JVariable.fromGuideVars(vars.serialize())
    }
  },

  guideGender: {
    type: Gender,
    default: Gender.defaultValue
  },

  avatarSkinTone: {
    type: Skin,
    default: Skin.defaultValue
  },

  avatarHairColor: {
    type: Hair,
    default: Hair.defaultValue
  }
})

/**
 * @property {DefineMap} debugPanel.ViewModel
 * @parent <debug-panel>
 *
 * `<debug-panel>`'s viewModel.
 */
export let DebugPanelVM = DefineMap.extend('DebugPanelVM', {
  // passed in via viewer-preview-layout.stache bindings
  interview: {
    set (interview = {}) {
      console.log('interview', interview)
      return new Guide(interview)
    }
  },
  traceMessage: {
    set (traceMessage) {
      console.log('traceMessage', traceMessage)
      return traceMessage
    }
  },
  previewPageName: {},
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
        ? interview.variablesList
        : new DefineList([])
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
    // this.listenTo('currentPageName', (ev, newVal, oldVal) => {
    //   const $pageName = $(`span.page:contains(${newVal})`)
    //   const pageNameTop = $pageName[0].offsetTop
    //   const $debugPanel = $('#logic-trace-panel')
    //   const modifier = 5

    //   setTimeout(() => {
    //     $debugPanel.animate({ scrollTop: (pageNameTop - modifier) }, 100)
    //   }, 0)
    // })

    // return () => {
    //   this.stopListening()
    // }
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
