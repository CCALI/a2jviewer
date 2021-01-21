import CanMap from 'can-map'
import Component from 'can-component'
import template from './evaluate.stache'
import $ from 'jquery'

import 'can-map-define'

/**
 * @property {can.Map} evaluatePanel.ViewModel
 * @parent <author-evaluate-panel>
 *
 * `<author-evaluate-panel>`'s viewModel.
 */
export let EvaluatePanelVM = CanMap.extend('EvaluatePanelVM', {
  define: {
    // passed in via pages.stache
    traceMessage: {}
  },

  /**
     * @function authorEvaluatePanel.ViewModel.prototype.evaluateScript evaluateScript
     * @parent authorEvaluatePanel.ViewModel
     *
     * fire A2J script expression
     *
     * Allows the Author to do live testing of expressions based on supplied values or
     * current values for variables in the interview.
     *
     * ex: [User Gender] = "Female" or DOLLARROUND(54332.64)
     */
  evaluateScript () {
    let evalResults
    let traceMessage = this.attr('traceMessage')
    let scriptText = $('#evaluate-input').val()
    if (scriptText) {
      evalResults = window.gLogic.evalBlock(scriptText)
    }

    if (evalResults.errors.length > 0) {
      evalResults.errors.forEach(function (error) {
        traceMessage.addMessage({
          key: 'expression',
          fragments: [ { format: 'valF', msg: 'ERROR' }, { format: 'code', msg: error.text } ]
        })
      })
    } else if (evalResults.text && traceMessage) {
      traceMessage.addMessage({
        key: 'expression',
        fragments: [ { format: 'code', msg: scriptText + ' evaluates to: ' }, { format: 'val', msg: evalResults.text } ]
      })
    }
  }
})

export default Component.extend({
  view: template,
  leakScope: false,
  ViewModel: EvaluatePanelVM,
  tag: 'author-evaluate-panel',

  events: {
    '#evaluate-input keyup': function (el, ev) {
      if (ev.keyCode === 13) {
        $('#evaluate-button').click()
      }
    }
  }
})
