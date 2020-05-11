import $ from 'jquery'
import DefineMap from 'can-define/map/map'
import Component from 'can-component'
import _truncate from 'lodash/truncate'
import template from './navigation.stache'
import constants from 'caja/viewer/models/constants'
import { analytics } from 'caja/viewer/util/analytics'
import isMobile from 'caja/viewer/is-mobile'

import 'jquerypp/event/swipe/'

/**
 * @property {can.Map} viewerNavigation.ViewModel
 * @parent <a2j-viewer-navigation>
 *
 * `<a2j-viewer-navigation>`'s viewModel.
 */
export let ViewerNavigationVM = DefineMap.extend({
  // passed in via stache bindings
  rState: {},
  courthouseImage: {},
  interview: {},
  repeatVarValue: {},
  selectedPageName: {},
  selectedPageIndex: {},
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
      return this.rState.visitedPages
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
      return !this.rState.saveAndExitActive &&
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
      return this.rState.saveAndExitActive && !!this.rState.lastPageBeforeExit
    }
  },

  /**
   * @property {Boolean} viewerNavigation.ViewModel.canNavigateBack canNavigateBack
   * @parent viewerNavigation.ViewModel
   *
   * Whether user can navigate to the previous page.
   */
  canNavigateBack: {
    get () {
      let totalPages = this.visitedPages.length
      const canNavigateBack = totalPages > 1 && parseInt(this.selectedPageIndex) < totalPages - 1 && !this.rState.saveAndExitActive
      return canNavigateBack
    }
  },

  /**
   * @property {Boolean} viewerNavigation.ViewModel.canNavigateForward canNavigateForward
   * @parent viewerNavigation.ViewModel
   *
   * Whether user can navigate to the next page.
   */
  canNavigateForward: {
    get () {
      let totalPages = this.visitedPages.length
      const canNavigateForward = totalPages > 1 && parseInt(this.selectedPageIndex) > 0 && !this.rState.saveAndExitActive
      return canNavigateForward
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
      let pageName = this.selectedPageName
      let pages = this.interview.attr('pages')
      let page = pages.find(pageName)

      if (!page) return {}

      return {
        questionid: page.attr('name'),
        questiontext: page.attr('text'),
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
    const pageName = this.selectedPageName

    this.rState.lastPageBeforeExit = pageName

    if (window._paq) {
      analytics.trackCustomEvent('Save&Exit', 'from: ' + pageName)
    }

    if (answers) {
      answers.attr('a2j interview incomplete tf').attr('values.1', true)
    }

    this.rState.page = exitPage
    this.rState.selectedPageIndex = 0
  },

  /**
   * @property {Function} viewerNavigation.ViewModel.resumeInterview resumeInterview
   * @parent viewerNavigation.ViewModel
   *
   * Resumes saved interview.
   */
  resumeInterview () {
    const answers = this.interview.answers
    const resumeTargetPageName = this.rState.lastPageBeforeExit
    this.rState.lastPageBeforeExit = null

    // Special Exit page should only show in My Progress while on that page
    this.rState.visitedPages.shift()

    if (answers) {
      answers.attr('a2j interview incomplete tf').attr('values', [null])
    }
    if (window._paq) {
      analytics.trackCustomEvent('Resume-Interview', 'to: ' + resumeTargetPageName)
    }
    if (resumeTargetPageName) {
      this.rState.page = resumeTargetPageName
    }
  },

  /**
   * @property {Function} viewerNavigation.ViewModel.navigateBack navigateBack
   * @parent viewerNavigation.ViewModel
   *
   * Navigates to previous page.
   */
  navigateBack () {
    if (this.canNavigateBack) {
      this.selectedPageIndex = parseInt(this.selectedPageIndex) + 1
    }
  },

  /**
   * @property {Function} viewerNavigation.ViewModel.navigateForward navigateForward
   * @parent viewerNavigation.ViewModel
   *
   * Navigates to next page.
   */
  navigateForward () {
    if (this.canNavigateForward) {
      this.selectedPageIndex = parseInt(this.selectedPageIndex) - 1
    }
  },

  /**
   * @property {Function} viewerNavigation.ViewModel.disableOption disableOption
   * @parent viewerNavigation.ViewModel
   *
   * Used to disable My Progress options when saveAndExit is active
   */
  disableOption (index) {
    if (index !== 0 && this.rState.saveAndExitActive) {
      return true
    }
    return false
  },

  // DefineList of options to populate the myProgress selector
  myProgressOptions: {},

  // Create and re-create options list to update based on changed user input
  // but still preserve the state of the current myProgress options.
  // Specifically this handles the challenge of mapping multi-value variables
  // to their specific loop count/state.
  buildOptions (visitedPages) {
    return visitedPages.map((visitedPage) => {
      const questionText = visitedPage.text
      let resolvedText

      const foundMacros = this.findMacros(questionText)
      if (foundMacros) {
        const sortedMacros = this.sortMacros(foundMacros)
        const resolvedMacros = this.resolveMacros(sortedMacros, visitedPage.repeatVarValue)
        resolvedText = this.replaceMacros(resolvedMacros, questionText)
      }

      return this.formatOptionData({
        text: resolvedText || questionText,
        repeatVarValue: visitedPage.repeatVarValue,
        stepNumber: visitedPage.step.number,
        questionNumber: visitedPage.questionNumber
      })
    })
  },

  // Find A2J Macro Syntax %%someVar%%, %%[some Var]%%, %%ORDINAL(someVar)%%, %%ORDINAL([some var])%%
  // first pass, detect enclosing %%...%% denoting a macro of any kind
  findMacros (questionText) {
    const macroRegEx = /%%(.*?)%%/g
    const foundMacros = questionText.match(macroRegEx)

    return foundMacros
  },

  // second pass, detect variable or function macro and sort into type objects
  // param : array of foundMacros -> [ %%[some Var]%%, %%ORDINAL(someVar)%% ]
  sortMacros (foundMacros) {
    return foundMacros.map((macroText) => {
      // remove %% bookends %%[some var]%% -> [some var]
      const resolveText = macroText.replace(/%%/g, '')
      const funcRegEx = /\w\((.*?)\)/g
      const isFunctionMacro = resolveText.match(funcRegEx)
      const type = isFunctionMacro
        ? 'function' : 'variable'
      return {
        type,
        resolveText,
        replaceText: macroText
      }
    })
  },

  // 3rd -> resolve sortedMacros, and return a tuple of a replacement target, and string resolved displayValue
  // param: [{ type: 'variable', replaceText: '%%[some name TE]%%', resolveText: '[some name TE]' }]
  // return: [{replaceText: '%%[some name TE]%%', displayValue: 'JessBob'}]
  resolveMacros (sortedMacros, visitedPageRepeatVarValue) {
    const resolvedMacros = []

    sortedMacros.forEach((macro) => {
      if (macro.type === 'function') {
        resolvedMacros.push({
          replaceText: macro.replaceText,
          displayValue: this.getFunctionMacro(macro.resolveText, visitedPageRepeatVarValue)
        })
      } else {
        resolvedMacros.push({
          replaceText: macro.replaceText,
          displayValue: this.getVariableMacro(macro.resolveText, visitedPageRepeatVarValue)
        })
      }
    })

    return resolvedMacros
  },

  // 4th and last step, actually replace the macro syntax text with the resolved displayValue
  // Hello %%[First name TE]%%! -> Hello JessBob!
  replaceMacros (resolvedMacros, questionText) {
    let displayText = questionText

    if (resolvedMacros && resolvedMacros.length) {
      resolvedMacros.forEach((macro) => {
        displayText = displayText.replace(macro.replaceText, macro.displayValue)
      })
    }

    return displayText
  },

  // parse out function name and arguments from A2J Macros
  // %%ORDINAL([someVar])%% -> { funcName: "ordinal", funcArgs: ["someVar"]}
  parseFunctionMacro (functionString) {
    // remove var brackets `[some Var#count]` -> `some Var#count`
    functionString = functionString.replace('[', '').replace(']', '')
    // remove leading spaces
    functionString = $.trim(functionString)

    const funcRegEx = /(.*?)\((.*)\)/
    const match = functionString.match(funcRegEx)
    const funcName = match[1].toLowerCase()
    const funcArgs = match[2].split(',').map((arg) => {
      // remove leading whitespace and extra outer "" from args
      return $.trim(arg).replace(/^"|"$/gm, '')
    })

    return { funcName, funcArgs }
  },

  // answerIndex uses explicit counting var (someVar#3), visitedPage.repeatVarValue,
  // or null in that order - _tLogic._VG() knows how to resolve null based on var type
  // options: [varName#3], [varName#someCountingVar], [varName]
  varGet (varName, numberOrCountingVar, repeatVarValue) {
    let answerIndex = null
    if (numberOrCountingVar) {
      const numberIndex = +numberOrCountingVar
      const isCountingVar = isNaN(numberIndex)
      answerIndex = isCountingVar ? repeatVarValue : numberIndex
    } else if (repeatVarValue) {
      return repeatVarValue
    }

    // falsy values display nothing/empty string
    return this.logic._tLogic._VG(varName, answerIndex) || ''
  },

  getVariableMacro (resolveText, visitedPageRepeatVarValue) {
    resolveText = resolveText.replace(/\[|\]/g, '')
    resolveText = resolveText.replace(/\(|\)/g, '')
    const [varName, numberOrCountingVar] = resolveText.split('#')
    const displayValue = this.varGet(varName, numberOrCountingVar, visitedPageRepeatVarValue)
    return displayValue
  },

  // call Macro Functions to resolve display values
  getFunctionMacro (resolveText, visitedPageRepeatVarValue) {
    const userFunctions = this.logic._tLogic.userFunctions
    const { funcName, funcArgs } = this.parseFunctionMacro(resolveText)
    const func = funcName && userFunctions[funcName] && userFunctions[funcName].func
    const varValue = this.getVariableMacro(funcArgs[0], visitedPageRepeatVarValue)
    // edge case, CONTAINS macro is only one that takes second param
    const compareStringForContains = funcArgs[1]

    return func(varValue, compareStringForContains)
  },

  formatOptionData (optionData) {
    const repeatVarValue = optionData.repeatVarValue
    const stepQuestionText = `Step ${optionData.stepNumber} Q${optionData.questionNumber}: `
    let text = stepQuestionText + optionData.text
    // strip html tags
    text = text.replace(/(<([^>]+)>)/ig, '').trim()

    // truncate text to avoid https://github.com/CCALI/CAJA/issues/685
    text = _truncate(text, { length: 50, separator: ' ' })
    text = (typeof repeatVarValue === 'number') ? text + ' #' + repeatVarValue : text

    return text
  },

  // allows keyboard users to skip nav bar and go directly to either the first question input or nav button
  focusMainContent () {
    let focusTarget = $('#guideBubble')[0]
    focusTarget && focusTarget.focus()
  },

  connectedCallback () {
    const vm = this

    // initialize a myProgress select list for the first visited page
    vm.myProgressOptions = this.buildOptions(this.visitedPages)

    const updateMyProgressOptions = () => {
      vm.myProgressOptions.update(this.buildOptions(this.visitedPages))
    }
    // rebuild options on selectedPageIndexSet dispatched on app-state level rState
    // covers normal Continue button and navigation via this component, back/next or dropdown select
    vm.rState.listenTo('selectedPageIndexSet', updateMyProgressOptions)
    // Used to hide/show keyboard nav shortcut to GI Question content
    $('.focus-main-content a').on('focus', (ev) => {
      ev.currentTarget.textContent = 'Skip to Main Content'
    })
    $('.focus-main-content a').on('blur', (ev) => {
      ev.currentTarget.textContent = ''
    })

    const swipeRightHandler = function () {
      if (vm.canNavigateBack) {
        vm.navigateBack()
      }
    }
    const swipeLeftHandler = function () {
      if (vm.canNavigateForward) {
        vm.navigateForward()
      }
    }

    $('#viewer-app').on('swiperight', swipeRightHandler)
    $('#viewer-app').on('swipeleft', swipeLeftHandler)

    return () => {
      vm.rState.stopListening('selectedPageIndexSet', updateMyProgressOptions)
      $('.focus-main-content a').off()
      $('#viewer-app').off('swiperight', swipeRightHandler)
      $('#viewer-app').off('swipeleft', swipeLeftHandler)
    }
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
 *   {(selected-page-name)}="rState.page"
 *   {(app-state)}="rState"
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
