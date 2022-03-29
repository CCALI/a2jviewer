import $ from 'jquery'
import DefineMap from 'can-define/map/map'
import Component from 'can-component'
import template from './variables.stache'
import parser from '@caliorg/a2jdeps/utils/parser'

const VariablesTableVM = DefineMap.extend('VariablesTableVM', {
  // passed in from debug-panel.stache
  interview: {},
  variables: {},

  clearAnswers () {
    if (this.interview) {
      this.interview.clearAnswers()
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
      const interview = this.viewModel.interview
      const pages = interview.attr('_pages').serialize()
      const answers = interview.attr('answers').serialize()

      const hotDocsXML = parser.parseANX(answers, pages)
      window.downloadTextFile(hotDocsXML, 'answer.anx')
    },

    '#viewer-var-filter keyup': function () {
      const $el = $(this.element)
      const $input = $el.find('#viewer-var-filter')
      const filter = $input.val().toLowerCase()

      $el.find('tbody tr').each(function () {
        const $row = $(this)
        const rowText = $row.text().toLowerCase()
        $row.toggle(rowText.indexOf(filter) !== -1)
      })
    },

    // Browse for answer file on local desktop to upload to client (no server).
    '#uploadAnswerFileInput change': function () {
      const textTypeRegex = /text.*/
      const interview = this.viewModel.interview
      const $fileInput = $(this.element).find('#uploadAnswerFileInput')

      const file = $fileInput.get(0).files[0]
      const vars = interview.attr('vars').attr()

      if (file && (file.type === '' || file.type.match(textTypeRegex))) {
        const reader = new window.FileReader()

        reader.onload = () => {
          const answers = parser.parseJSON(reader.result, vars)
          interview.attr('answers').assign(answers)
        }

        reader.readAsText(file)
      }
    }
  }
})
