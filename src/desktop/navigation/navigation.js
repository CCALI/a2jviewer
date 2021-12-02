import $ from 'jquery'
import DefineMap from 'can-define/map/map'
import Component from 'can-component'
import template from './navigation.stache'
import constants from '~/src/models/constants'
import { analytics } from '~/src/util/analytics'
import isMobile from '~/src/util/is-mobile'

/**
 * @property {can.Map} viewerNavigation.ViewModel
 * @parent <a2j-viewer-navigation>
 *
 * `<a2j-viewer-navigation>`'s viewModel.
 */
export let ViewerNavigationVM = DefineMap.extend({
  // passed in via stache bindings
  appState: {},
  courthouseImage: {},
  interview: {},
  lang: {},

  /**
   * @property {can.compute} viewerNavigation.ViewModel.isMobile isMobile
   *
   * used to detect mobile viewer loaded
   *
   * */
  isMobile: {
    get () {
      return isMobile()
    }
  },

  /**
   * @property {DefineList} viewerNavigation.ViewModel.visitedPages visitedPages
   * @parent viewerNavigation.ViewModel
   *
   * list of pages visited by the user.
   */
  visitedPages: {
    get () {
      return this.appState.visitedPages
    }
  },

  selectedAVPIndex: {
    get () {
      const vps = this.visitedPages || []
      const avps = vps.activeList || []
      return avps.indexOf(vps.selected)
    }
  },

  /**
   * @property {Boolean} viewerNavigation.ViewModel.canSaveAndExit canSaveAndExit
   * @parent viewerNavigation.ViewModel
   *
   * Whether user can save and exit interview.
   */
  canSaveAndExit: {
    get () {
      return !this.appState.saveAndExitActive &&
      this.interview.attr('exitPage') !== constants.qIDNOWHERE
    }
  },

  /**
   * @property {Boolean} viewerNavigation.ViewModel.canResumeInterview canResumeInterview
   * @parent viewerNavigation.ViewModel
   *
   * Whether user can resume interview.
   */
  canResumeInterview: {
    get () {
      return this.appState.saveAndExitActive
    }
  },

  /**
   * @property {Object} viewerNavigation.ViewModel.feedbackData feedbackData
   * @parent viewerNavigation.ViewModel
   *
   * Data to be submitted when user sends feedback.
   */
  feedbackData: {
    get () {
      const pages = this.interview.attr('pages')
      const page = pages.find(this.appState.selectedPageName)

      if (!page) return {}

      return {
        questionid: page.name,
        questiontext: page.text,
        interviewid: this.interview.attr('version'),
        viewerversion: constants.A2JVersionNum,
        emailto: this.interview.attr('emailContact'),
        interviewtitle: this.interview.attr('title')
      }
    }
  },

  showDemoNotice: {
    type: 'boolean'
  },

  /**
   * @property {Function} viewerNavigation.ViewModel.saveAndExit saveAndExit
   * @parent viewerNavigation.ViewModel
   *
   * Saves interview and exits.
   */
  saveAndExit () {
    const answers = this.interview.attr('answers')
    const exitPage = this.interview.attr('exitPage')
    const pageName = this.appState.selectedPageName

    this.appState.lastPageBeforeExit = pageName

    if (window._paq) {
      analytics.trackCustomEvent('Save&Exit', 'from: ' + pageName)
    }

    if (answers) {
      answers.varSet('a2j interview incomplete tf', true, 1)
    }

    this.appState.page = exitPage
  },

  /**
   * @property {Function} viewerNavigation.ViewModel.resumeInterview resumeInterview
   * @parent viewerNavigation.ViewModel
   *
   * Resumes saved interview.
   */
  resumeInterview () {
    const answers = this.interview.answers
    const resumeTargetPageName = this.appState.lastPageBeforeExit
    this.appState.lastPageBeforeExit = null

    // Special Exit page should only show in My Progress while on that page
    this.appState.visitedPages.shift()

    if (answers) {
      // sets answer values prop to default value of [null]
      answers.varSet('a2j interview incomplete tf', null, 0)
    }
    if (window._paq) {
      analytics.trackCustomEvent('Resume-Interview', 'to: ' + resumeTargetPageName)
    }
    if (resumeTargetPageName) {
      this.appState.page = resumeTargetPageName
    }
  },

  /**
   * @property {Function} viewerNavigation.ViewModel.disableOption disableOption
   * @parent viewerNavigation.ViewModel
   *
   * Used to disable My Progress options when saveAndExit is active
   */
  disableOption (visitedPage) {
    const isNotTheLastVisitedPage = !!visitedPage.nextVisitedPage
    if (isNotTheLastVisitedPage && this.appState.saveAndExitActive) {
      return true
    }
    return false
  }
})
/**
 * @module {Module} viewer/desktop/navigation/ <a2j-viewer-navigation>
 * @parent api-components
 *
 * This component displays the navigation bar for the viewer app.
 *
 * ## Use
 *
 * @codestart
 * <a2j-viewer-navigation>
 *   {(selected-page-name)}="appState.page"
 *   {(app-state)}="appState"
 *   {(interview)}="interview">
 * </a2j-viewer-navigation>
 * @codeend
 */
export default Component.extend({
  view: template,
  leakScope: false,
  tag: 'a2j-viewer-navigation',
  ViewModel: ViewerNavigationVM,

  helpers: {
    feedbackFormUrl () {
      let feedbackData = this.feedbackData
      let baseUrl = 'http://www.a2jauthor.org/A2JFeedbackForm.php?'
      return baseUrl + $.param(feedbackData)
    }
  }
})
