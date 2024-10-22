import $ from 'jquery'
import PagesVM from './pages-vm'
import Component from 'can-component'
import template from './pages.stache'
import assembleFormTpl from './assemble-form.stache'
import saveAnswersFormTpl from './save-answers-form.stache'
import Preview from '~/src/models/preview'
import { analytics } from '~/src/util/analytics'
import stache from 'can-stache'
import '~/src/mobile/util/helpers'
import constants from '~/src/models/constants'
import DefineMap from 'can-define/map/map'

stache.registerPartial('assemble-form', assembleFormTpl)
stache.registerPartial('save-answers-form', saveAnswersFormTpl)

/**
 * @module {Module} viewer/mobile/pages/ <a2j-pages>
 * @parent api-components
 *
 * This component renders each of the interview pages and handle the
 * navigation between those pages.
 *
 * ## Use
 *
 * @codestart
 *   <a2j-pages
 *     {lang}="lang"
 *     {(logic)}="logic"
 *     {(r-state)}="routeState"
 *     {(m-state)}="memoryState"
 *     {(interview)}="interview"
 *     {(p-state)}="persistedState" />
 * @codeend
 */

export default Component.extend({
  view: template,
  tag: 'a2j-pages',
  leakScope: true,
  ViewModel: PagesVM,

  helpers: {
    getButtonLabel (label) {
      return label || this.lang['Continue']
    },
    trim (str) {
      return (str || '').trim()
    }
  },

  events: {
    'a click': function (el, ev) {
      if (el.href && el.href.toLowerCase().indexOf('popup') === 0) {
        ev.preventDefault()
        const vm = this.viewModel
        const pages = vm.interview.pages

        if (pages) {
          const pageName = decodeURIComponent(el.href.replace('popup://', '').replace('POPUP://', '').replace('/', ''))
          const page = pages.find(pageName)
          const sourcePageName = vm.currentPage.name

          // piwik tracking of popups
          if (window._paq) {
            analytics.trackCustomEvent('Pop-Up', 'from: ' + sourcePageName, pageName)
          }

          // popups now have text, audio, video and their alt-text values
          // title (page.name) is more of internal descriptor for popups
          vm.appState.modalContent = {
            title: '',
            text: page.text,
            textAudioURL: (page.textAudioURL || '').trim(),
            imageURL: (page.helpImageURL || '').trim(),
            altText: page.helpAltText,
            mediaLabel: page.helpMediaLabel,
            audioURL: (page.helpAudioURL || '').trim(),
            videoURL: (page.helpVideoURL || '').trim(),
            helpReader: page.helpReader
          }
        }
      } else { // external link
        const $el = $(el)
        $el.attr('target', '_blank')
      }
    },

    'a.learn-more click': function fireLearnMoreModal () {
      // this is almost a line for line duplicate
      // of src/desktop/steps.js
      // should probably refactor
      const vm = this.viewModel
      const pages = this.viewModel.interview.pages
      const pageName = this.viewModel.currentPage.name
      // vm.appState.page

      if (pages && pageName) {
        const page = pages.find(pageName)

        // piwik tracking of learn-more clicks
        if (window._paq) {
          analytics.trackCustomEvent('Learn-More', 'from: ' + pageName, page.learn)
        }

        vm.appState.modalContent = {
          // name undefined prevents stache warnings
          title: page.learn,
          text: page.help,
          imageURL: (page.helpImageURL || '').trim(),
          altText: page.helpAltText,
          mediaLabel: page.helpMediaLabel,
          audioURL: (page.helpAudioURL || '').trim(),
          videoURL: (page.helpVideoURL || '').trim(),
          helpReader: page.helpReader
        }
      }
    },

    'button.open-preview click': function (el, ev) {
      ev.preventDefault()

      const vm = this.viewModel

      const previewData = {
        answers: vm.answersString,
        fileDataUrl: vm.mState.fileDataURL,
        guideId: vm.guideId,
        guideTitle: vm.interview.title
      }

      Preview.findOne(previewData).then(preview => {
        vm.appState.modalContent = {
          title: 'Document preview',
          iframeMarkup: preview.html,
          allowFullscreen: true
        }
      }, error => {
        vm.appState.modalContent = {
          title: 'Error generating document preview',
          text: error.toString()
        }
      })
    },

    'button.save-answers click': function (el, ev) {
      ev.preventDefault()

      const button = new DefineMap({ next: constants.qIDSUCCESS })

      const vm = this.viewModel
      

      /***
       *  !!! Change this in pproduction to prod server!!!
       */
      if (!vm.appState.previewActive){
        let postBody = {
          authorid: vm.interview.authorId,
          interviewPath: vm.interview.interviewPath,
          guideTitle: vm.interview.title,
          invalidAnswers: vm.invalidAnswers,
          url: window.location.href,
          uri: document.documentURI,
          viewerversion: constants.A2JVersionNum
        }

        $.ajax({
          url: 'https://staging.a2jauthor.org/a2jauthor/bad-answer-alert.php',
          type: 'POST',
          data: JSON.stringify(postBody),
          dataType: 'json'
        })
          .then((response) => response.json())
          .then((json) => console.log(json))
      }

      vm.navigate(button, el, ev)
    },

    // This event is fired when the Exit, Success, or AssembleSuccess button is clicked,
    // it waits to asynchronously submit the form that posts the XML answers
    // to the `setDataURL` endpoint.
    '{viewModel} post-answers-to-server': function () {
      const $el = $(this.element)
      // multiple answer forms can be on the page at once, only submit the first
      // as the answers to post in each instance of the form are the same
      const $form = $el.find('.post-answers-form')[0]
      // prevent double clicks on submit
      if (this._isSubmitting) {
        return
      }

      this._isSubmitting = true
      // this timeout allows final page answers to be saved before posting
      setTimeout(function () {
        $form.submit()
      }, 500)
    },

    '{appState.visitedPages} selected': function () {
      this.viewModel.buttonUsedIndex = -1
    },

    // if route page changes, try to switch to that page. (run before logic, check for infinite loops, etc)
    '{appState} page-setter': function () {
      this.viewModel.tryToVisitPage()
    }
  }
})
