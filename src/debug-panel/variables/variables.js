import $ from 'jquery'
import CanMap from 'can-map'
import Component from 'can-component'
import template from './variables.stache'
import parser from '@caliorg/a2jdeps/utils/parser'

let VariablesTableVM = CanMap.extend('VariablesTableVM', {
  // passed in from debug-panel.stache
  interview: {},
  variables: {},

  clearAnswers () {
    const interview = this.attr('interview')

    if (interview) {
      interview.clearAnswers()
    }
  }
})

export default Component.extend({
  view: template,
  leakScope: false,
  ViewModel: VariablesTableVM,
  tag: 'author-variables-table',

  events: {
    // Download answer file directly from client to desktop.
    '#downloadAnswer click': function () {
      const interview = this.viewModel.attr('interview')
      const pages = interview.attr('_pages').serialize()
      const answers = interview.attr('answers').serialize()

      const hotDocsXML = parser.parseANX(answers, pages)
      window.downloadTextFile(hotDocsXML, 'answer.anx')
    },

    '#viewer-var-filter keyup': function () {
      const $el = $(this.element)
      let $input = $el.find('#viewer-var-filter')
      let filter = $input.val().toLowerCase()

      $el.find('tbody tr').each(function () {
        let $row = $(this)
        let rowText = $row.text().toLowerCase()
        $row.toggle(rowText.indexOf(filter) !== -1)
      })
    },

    // Browse for answer file on local desktop to upload to client (no server).
    '#uploadAnswerFileInput change': function () {
      let textTypeRegex = /text.*/
      let interview = this.viewModel.attr('interview')
      let $fileInput = $(this.element).find('#uploadAnswerFileInput')

      let file = $fileInput.get(0).files[0]
      let vars = interview.attr('vars').attr()

      if (file && (file.type === '' || file.type.match(textTypeRegex))) {
        let reader = new window.FileReader()

        reader.onload = () => {
          const answers = parser.parseJSON(reader.result, vars)

          // This updates current answers keeping single source
          // of truth for A2J scripts and canjs components
          interview.attr('answers').attr(answers)
        }

        reader.readAsText(file)
      }
    }
  }
})