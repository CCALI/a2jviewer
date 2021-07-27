import $ from 'jquery'
import PagesVM from './pages-vm'
import Component from 'can-component'
import template from './pages.stache'
import assembleFormTpl from './assemble-form.stache'
import saveAnswersFormTpl from './save-answers-form.stache'
import { analytics } from '~/src/util/analytics'
import stache from 'can-stache'
import '~/src/mobile/util/helpers'

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
    }
  },

  events: {
    'a.learn-more click': function (el, ev) {
      ev.preventDefault()

      const vm = this.viewModel
      const pages = vm.interview.pages
      const pageName = vm.appState.page

      if (pages && pageName) {
        const page = pages.find(pageName)
        // piwik tracking of learn-more clicks
        if (window._paq) {
          analytics.trackCustomEvent('Learn-More', 'from: ' + pageName, page.learn)
        }

        vm.appState.modalContent = {
          title: page.learn,
          text: page.help,
          imageURL: page.helpImageURL,
          altText: page.helpAltText,
          mediaLabel: page.helpMediaLabel,
          audioURL: page.helpAudioURL,
          videoURL: page.helpVideoURL,
          helpReader: page.helpReader
        }
      }
    },

    'a click': function (el, ev) {
      if (el.href && el.href.toLowerCase().indexOf('popup') === 0) {
        ev.preventDefault()
        const vm = this.viewModel
        const pages = vm.interview.pages

        if (pages) {
          const pageName = el.href.replace('popup://', '').replace('POPUP://', '').replace('/', '') // pathname is not supported in FF and IE.
          const page = pages.find(pageName)
          const sourcePageName = vm.currentPage.name

          // piwik tracking of popups
          if (window._paq) {
            analytics.trackCustomEvent('Pop-Up', 'from: ' + sourcePageName, pageName)
          }

          // popups only have text, textAudioURL possible values
          // title (page.name) is more of internal descriptor for popups
          vm.appState.modalContent = {
            title: '',
            text: page.text,
            altText: page.helpAltText,
            audioURL: page.textAudioURL
          }
        }
      } else { // external link
        const $el = $(el)
        $el.attr('target', '_blank')
      }
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

    // any navigation from myProgress, check for and re-render page fields for loop values
    '{appState} selectedPageIndexSet': function () {
      const vm = this.viewModel
      // repeatVarValue means we're in a loop
      if (vm.appState.repeatVarValue) {
        const fields = vm.currentPage.fields
        vm.setFieldAnswers(fields)
      }
    },

    '{appState} setCurrentPage': function () {
      this.viewModel.setCurrentPage()
    }
  }
})
