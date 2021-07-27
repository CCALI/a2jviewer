import $ from 'jquery'
import DefineMap from 'can-define/map/map'
// import DefineList from 'can-define/list/list'
import Component from 'can-component'
import template from './variables.stache'
import parser from '@caliorg/a2jdeps/utils/parser'

export const VariablesTableVM = DefineMap.extend('VariablesTableVM', {
  // passed in from debug-panel.stache
  interview: {},
  variables: {},
  appState: {},

  downloadTextFile (fileTextContent, filename) {
    const safeFilename = this.safeWindowsFilename(filename)
    // 05/08/2014 Download generic text file directly from client to desktop.
    // Create an anchor, set its url to the data, use type application/octet-stream to force download rather than view in browser.
    if (window.navigator.msSaveBlob) {
      const blob = new window.Blob([fileTextContent], {type: 'application/octet-stream'})
      window.navigator.msSaveBlob(blob, safeFilename)
    } else {
      const a = window.document.createElement('a')
      a.href = window.URL.createObjectURL(new window.Blob([fileTextContent], {type: 'application/octet-stream'}))
      a.download = safeFilename
      // Append anchor to body.
      document.body.appendChild(a)
      a.click()
      // Remove anchor from body
      document.body.removeChild(a)
    }
  },

  // Write test for this, string to contain all the invalid file names.
  safeWindowsFilename (filename) {
    if (typeof filename === 'string') {
      // forward slashes become hypens for dates
      // all others removed
      const dateSafeFileName = filename.replace(/\//g, '-')
      return dateSafeFileName.replace(/[<>:"\\|?*]+/g, '')
    }
  },

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
      const answers = interview.attr('answers')
      const visitedPages = JSON.stringify(interview.attr('answers').visitedPages)
      answers.varSet('visitedpages', visitedPages)

      const serializedAnswers = answers.serialize()

      const hotDocsXML = parser.parseANX(serializedAnswers, pages)
      this.viewModel.downloadTextFile(hotDocsXML, 'answer.anx')
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
      let interview = this.viewModel.interview
      let $fileInput = $(this.element).find('#uploadAnswerFileInput')

      let file = $fileInput.get(0).files[0]
      let vars = interview.attr('vars').attr()

      let appState = this.viewModel.appState

      if (file && (file.type === '' || file.type.match(textTypeRegex))) {
        let reader = new window.FileReader()

        Promise.resolve(reader.onload = () => {
          let parsedAnswers = parser.parseJSON(reader.result, vars)
          const visitedPages = JSON.parse(parsedAnswers.visitedpages.values[1])

          // const visitedPagesToSave = new DefineList(visitedPages)
          appState.visitedPages.update(visitedPages)
          delete parsedAnswers.visitedpages
          interview.attr('answers').assign(parsedAnswers)

          let resumePage = interview.attr('answers').varGet('A2J Resume Page')
          let selectedIndex = appState.visitedPages.length - 1
          if (resumePage) {
            // remove last page; EXIT PAGE
            appState.visitedPages.shift()
            appState.visitedPages.forEach((pageObj, index) => {
              if (pageObj.name === resumePage) {
                selectedIndex = index
              }
            })
          }
          appState.selectedPageIndex = selectedIndex
          // for testing purposes
          return selectedIndex
        }).then(
          reader.readAsText(file)
        )
      }
    }
  }
})
