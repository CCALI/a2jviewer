import $ from 'jquery'
import DefineMap from 'can-define/map/map'
import _some from 'lodash/some'
import _isString from 'lodash/isString'
import _forEach from 'lodash/forEach'
import queues from 'can-queues'
import AnswerVM from '~/src/models/answervm'
import Infinite from '~/src/mobile/util/infinite'
import GhostHistory from '~/src/models/ghost-history'
import Parser from '@caliorg/a2jdeps/utils/parser'
import { analytics } from '~/src/util/analytics'
import constants from '~/src/models/constants'
import moment from 'moment'

import 'bootstrap/js/modal'

// only exists in some cases,
// should be shared if pages-vm reloads (reload happens from author preview and when swapping to mobile),
// will be intiailized in the connectedCallback() if it's needed
// (todo: reload isn't working, partially because the visited pages are different objects... Fix Priority: nice to have, for devs only)
let ghostHistory

/**
 * @property {DefineMap} pages.ViewModel
 * @parent viewer/mobile/pages/
 *
 * `<a2j-pages>` viewModel.
 */
export default DefineMap.extend('PagesVM', {
  // visited page instance passed in (set) via steps.stache or mobile.stache (currentVisitedPage === visitedPages.selected)
  currentVisitedPage: {
    set (currentVisitedPage) {
      const currentPage = (currentVisitedPage || {}).interviewPage
      if (currentPage && currentPage.name !== constants.qIDFAIL) {
        if (!currentPage) {
          console.warn(`Unknown page: ${currentPage.name}`)
          return
        }

        // queues.batch.start()
        this.setFieldAnswers(currentPage.fields, currentVisitedPage)
        const mState = this.mState
        if (mState) {
          mState.attr('header', currentPage.step.text)
          mState.attr('step', currentPage.step.number)
        }

        // queues.batch.stop()

        // TODO: only serialize the answer on "Save & Exit" instead?
        if (this.appState && !this.reloadingHistory) {
          const svpStr = JSON.stringify(this.appState.visitedPages.serialize())
          this.answers.varSet(constants.PAGEHISTORY.toLowerCase(), svpStr)
        }
      }
      return currentVisitedPage
    }
  },

  // don't update our local currentPage until it has been actually visited.
  // on appState, currentPage updates as soon as route {page} does, which kicks off the tryToVisit() before-logic-redirect loop.
  // we don't need to rerender things until that resolves and sets the current visited page
  currentPage: {
    get () {
      return (this.currentVisitedPage || {}).interviewPage
    }
  },

  resumeInterview: {},
  lang: {},
  logic: {},
  appState: {},
  pState: {},
  mState: {},
  interview: {},
  // passed up from fields.js
  groupValidationMap: {},

  previewActive: {
    get (lastSet) {
      if (lastSet) { return lastSet } // for testing override
      return this.appState.previewActive
    }
  },

  repeatVarValue: {
    get () {
      return this.appState.repeatVarValue
    }
  },

  /**
   * @property {String} pages.ViewModel.prototype.backButton backButton
   * @parent pages.ViewModel
   *
   * String used to represent the button that sends the user back to the most
   * recently visited page.
   */
  backButton: {
    default: constants.qIDBACK
  },

  /**
   * @property {String} pages.ViewModel.prototype.saveAnswersButton saveAnswersButton
   * @parent pages.ViewModel
   *
   * String used to represent the button that saves the answers to the server
   * and replaces the viewer with the server's response.
   */
  saveAnswersButton: {
    default: constants.qIDSUCCESS
  },

  /**
   * @property {String} pages.ViewModel.prototype.exitButton exitButton
   * @parent pages.ViewModel
   *
   * String used to represent the button that saves the answers to the server
   * when the interview is only partially complete.
   */
  exitButton: {
    default: constants.qIDEXIT
  },

  /**
   * @property {String} pages.ViewModel.prototype.messageButton exitButton
   * @parent pages.ViewModel
   *
   * String used to represent the button that displays a message
   * when the interview is complete.
   */
  messageButton: {
    default: constants.qMESSAGE
  },

  /**
   * @property {String} pages.ViewModel.prototype.resumeButton resumeButton
   * @parent pages.ViewModel
   *
   * String used to represent the button that resumes the interview rather than Exit.
   */
  resumeButton: {
    default: constants.qIDRESUME
  },

  /**
   * @property {String} pages.ViewModel.prototype.assembleButton assembleButton
   * @parent pages.ViewModel
   *
   * String used to represent the button that generates a PDF document.
   */
  assembleButton: {
    default: constants.qIDASSEMBLE
  },

  /**
   * @property {String} pages.ViewModel.prototype.assembleAndSaveButton assembleAndSaveButton
   * @parent pages.ViewModel
   *
   * String used to represent the button that generates a PDF document and also
   * saves the answers to the server.
   */
  assembleAndSaveButton: {
    default: constants.qIDASSEMBLESUCCESS
  },

  /**
   * @property {String} pages.ViewModel.prototype.guideId guideId
   * @parent pages.ViewModel
   *
   * Id of the guided interview being "previewed" by the author.
   *
   * This property is not available (it's undefined) when the viewer runs
   * in standalone mode. It's used during document assembly to filter the
   * templates used to generate the final document.
   */
  guideId: {
    get () {
      return window.gGuideID
    }
  },

  /**
   * @property {String} pages.ViewModel.prototype.answersString answersString
   * @parent pages.ViewModel
   *
   * JSON representation of the `answers` entered by the user.
   *
   * This is used during document assembly to fill in the variables added by
   * the author to any of the templates.
   */
  answersString: {
    get () {
      const answers = this.pState.answers
      return JSON.stringify(answers.serialize())
    }
  },

  /**
   * @property {String} pages.ViewModel.prototype.answersString answersString
   * @parent pages.ViewModel
   *
   * XML version of the `answers` entered by the user.
   *
   * This is POSTed to `setDataURL` when user finishes the interview,
   * and populated when a user loads saved answers.
   */
  answersANX: {
    get () {
      const parsed = Parser.parseANX(this.answers.serialize())
      return parsed
    }
  },

  answersJSON: {
    get () {
      const parsed = JSON.stringify(this.answers.serialize())
      return parsed
    }
  },

  answers: {
    get () {
      return this.interview.attr('answers')
    }
  },

  infinite: {
    Type: Infinite,
    Default: Infinite,
    serialize: false
  },

  buttonUsedIndex: {
    serialize: false,
    type: 'number',
    default: -1
  },

  checkInfiniteLoop () {
    if (this.infinite.outOfRange) {
      const msg = 'INFINITE LOOP: Too many page jumps without user interaction. GOTO target: ' + this.page
      this.appState.traceMessage.addMessage({
        key: 'infinite loop',
        fragments: [{
          format: 'valF',
          msg: msg
        }]
      })
      throw new Error(msg)
    } else {
      this.infinite.inc()
    }
  },

  resetInfiniteLoop () {
    this.infinite.reset()
  },

  fireCodeBefore (currentPage, logic) {
    const preGotoPage = this.logic.attr('gotoPage')

    // batching here for performance reasons due to codeBefore string parsing
    queues.batch.start()
    logic.exec(currentPage.codeBefore)
    queues.batch.stop()

    const postGotoPage = this.logic.attr('gotoPage')

    // if preGotoPage does not match postGotoPage, codeBefore fired an A2J GOTO logic
    return preGotoPage !== postGotoPage ? postGotoPage : false
  },

  // when appState.page is set (by route or whatever), this fires
  tryToVisitPage () {
    this.checkInfiniteLoop()
    // current page is a page from the current interview instance, as determined by its getter in the appState route {page}
    const newInterviewPage = this.appState.currentPage // do NOT use this.currentPage here
    if (!newInterviewPage) { return }

    // handle codeBefore A2J logic
    if (newInterviewPage.codeBefore) {
      this.appState.traceMessage.addMessage({ key: 'codeBefore', fragments: [{ format: 'info', msg: 'Logic Before Question' }] })
      const newGotoPage = this.fireCodeBefore(newInterviewPage, this.logic)
      if (newGotoPage) {
        // calls this same tryToVisitPage fn again
        this.appState.page = newGotoPage
        return
      }
    }
    // safe to reset if past codeBefore logic
    this.resetInfiniteLoop()

    // visitation successful
    const visitedPages = this.appState.visitedPages
    // handle whether a page is visited or re-visited
    visitedPages && visitedPages.visit(newInterviewPage, this.buttonUsedIndex)
    this.buttonUsedIndex = -1
  },

  returnHome () {
    this.appState.update({})
  },

  validateAllFields () {
    const vm = this
    const fields = this.currentPage.fields

    _forEach(fields, function (field) {
      const hasError = !!field._answerVm.errors
      field.hasError = hasError
      // track radio button group validation
      const varName = field.name
      const groupValidationMap = vm.groupValidationMap
      if (groupValidationMap) {
        groupValidationMap[varName] = hasError
      }
    })

    return _some(fields, f => f.hasError)
  },

  traceButtonClicked (buttonLabel) {
    this.appState.traceMessage.addMessage({
      key: 'button',
      fragments: [
        { format: '', msg: 'You pressed' },
        { format: 'ui', msg: buttonLabel }
      ]
    })
  },

  traceMessageAfterQuestion () {
    this.appState.traceMessage.addMessage({
      key: 'codeAfter',
      fragments: [{ format: 'info', msg: 'Logic After Question' }]
    })
  },

  navigate (button, el, ev) {
    const vm = this // preserve navigate context for post/assemble stache forms
    const anyFieldHasError = vm.validateAllFields()

    vm.traceButtonClicked(button.label) // always show clicked button in debug-panel

    if (anyFieldHasError) { // do nothing if there are field(s) with error(s)
      ev && ev.preventDefault()
      return false
    } else { // no errors/normal navigation
      const appState = vm.appState
      const page = vm.currentPage
      const logic = vm.logic
      const previewActive = vm.previewActive
      const onExitPage = appState.visitedPages.selectedIsInterviewExitPage && (page.name === vm.interview.attr('exitPage'))

      button.next = vm.handleCrossedUseOfResumeOrBack(button, onExitPage)

      vm.saveButtonValue(button, page, logic) // buttons with variables assigned

      if (button.next === constants.qIDFAIL || button.next === constants.qIDRESUME) {
        vm.handleFailOrResumeButton(button, vm, onExitPage)
        return // these buttons skip rest of navigate
      }

      vm.handleCodeAfter(button, vm, page, logic) // afterLogic fired, but GOTO resolves later

      vm.setRepeatVariable(button) // set counting variables if exist

      vm.handleBackButton(button, appState, logic) // prior question

      if (previewActive && this.isSpecialButton(button)) {
        vm.handlePreviewResponses(button, ev) // a2j-viewer preview messages
        return // final preview buttons show Author note in modal and skip rest of navigate
      }

      if (this.isPostOrAssemble(button)) {
        vm.handleServerPost(button, vm, previewActive, ev) // normal post/assemble
        return // final POST buttons skip rest of navigate
      }

      const buttonUsedIndex = (page.buttons || []).indexOf(button)
      this.buttonUsedIndex = buttonUsedIndex

      // calls this.tryToVisitPage() (pages.js events listens to appState.page (route) changes, then calls tryToVisitPage)
      appState.page = vm.getNextPage(button, logic) // check for GOTO logic redirect, nav to next page

      return appState.page // return destination page for testing
    }
  },

  // toggle Resume/Back button based on exit page, otherwise don't change button.next
  handleCrossedUseOfResumeOrBack (button, onExitPage) {
    if (onExitPage && button.next === constants.qIDBACK) {
      return constants.qIDRESUME
    } else if (!onExitPage && button.next === constants.qIDRESUME) {
      return constants.qIDBACK
    } else {
      return button.next
    }
  },

  getNextPage (button, logic) {
    const gotoPage = logic.attr('gotoPage')
    const logicPageIsNotEmpty = _isString(gotoPage) && gotoPage.length

    if (logicPageIsNotEmpty && gotoPage !== button.next) { // GOTO nav
      logic.attr('gotoPage', null)
      return gotoPage
    } else if (!this.isSpecialButton(button)) { // normal nav
      return button.next
    }
  },

  handleFailOrResumeButton (button, vm) {
    if (button.next === constants.qIDRESUME) {
      vm.resumeInterview() // this function passed in via from navigation.stache to desktop.stache to pages-vm.js
      return
    }
    // Author can provide an external URL to explain why user did not qualify/failed out
    vm.setInterviewAsComplete()
    let failURL = button.url.toLowerCase()
    const hasProtocol = failURL.indexOf('http') === 0
    failURL = hasProtocol ? failURL : 'http://' + failURL
    if (failURL === 'http://') { // If Empty, standard message
      vm.appState.modalContent = {
        title: 'You did not Qualify',
        text: 'Unfortunately, you did not qualify to use this A2J Guided Interview. Please close your browser window or tab to exit the interview.'
      }
    } else {
      // track the external link
      if (window._paq) {
        analytics.trackExitLink(failURL, 'link')
      }
      window.open(failURL, '_blank')
    }
  },

  buttonValue (button) {
    if (!button.name) { return } // no variable assigned

    const buttonAnswer = this.__ensureFieldAnswer(button)
    let buttonValue = button.value

    // button source values are always text, so do type conversion here
    // TODO: should probably handle in answers.js model
    if (buttonAnswer.type === 'TF') {
      buttonValue = buttonValue.toLowerCase() === 'true'
    } else if (buttonAnswer.type === 'Number') {
      buttonValue = parseFloat(buttonValue)
    }

    return buttonValue
  },

  saveButtonValue (button, page, logic) {
    if (!button.name) { return } // no variable assigned

    const repeatVar = page.repeatVar
    const buttonAnswerIndex = repeatVar ? logic.varGet(repeatVar) : 1
    const buttonValue = this.buttonValue(button)

    this.logVarMessage(button.name, buttonValue, false, buttonAnswerIndex)
    logic.varSet(button.name, buttonValue, buttonAnswerIndex)
  },

  // document.querySelector("a2j-pages").viewModel.ghostHistory
  ghostHistory: { get (lsv) { return lsv || ghostHistory } },

  // returns the button that leads to the next visited page if there is one.
  // helps indicate what button was used previously after the user has navigated to a previous page
  previouslySelectedButton () {
    const currentVisitedPage = this.currentVisitedPage
    const nextVP = currentVisitedPage && currentVisitedPage.nextVisitedPage
    const currentPage = this.currentPage
    const buttons = (currentPage && currentPage.buttons) || []

    const vpNextButton = nextVP && buttons[nextVP.parentButtonUsedIndex]
    const ghostNextButton = (!vpNextButton) && ghostHistory && buttons[ghostHistory.suggestNextButtonIndex(currentVisitedPage)]
    if (ghostHistory && ghostHistory.finished) {
      this.ghostHistory = ghostHistory = undefined
    }
    const buttonThatTakesUsBackToTheFuture = vpNextButton || ghostNextButton
    if (buttonThatTakesUsBackToTheFuture) {
      return buttonThatTakesUsBackToTheFuture
    }

    // the rest is a best-guess algorithm to determine which button might have been used.
    // if an interview is loaded with old answers w/o the visited pages history, this will help guide them back to where they left off
    const repeatVar = currentPage && currentPage.repeatVar
    const buttonAnswerIndex = repeatVar ? this.logic.varGet(repeatVar) : 1
    const buttonsWithMatchingAnswers = buttons.filter(b => {
      const buttonValue = this.buttonValue(b)
      return (buttonValue !== undefined) && (this.answers.varGet(b.name.toLowerCase(), buttonAnswerIndex) === buttonValue)
    })
    const nextPageName = (nextVP && nextVP.interviewPage.name) || (ghostHistory && ghostHistory.expectNextPageNameToBe)

    // return the last button that sets an answer to the same value we already have from a previous visit to this page/question
    // OR, if there isn't one, return the last non-answer-bound button whos .next target is the same name of the next page in the visitedPages history
    // else no buttons match, so return undefined
    return buttonsWithMatchingAnswers.pop() || buttons.filter(b => nextPageName && b.next === nextPageName && !b.name).pop()
  },

  focusedButtonRendering () {
    const focusedButtonClass = 'previously-used-button'
    setTimeout(() => {
      const focusedButton = document.querySelector('.' + focusedButtonClass)
      focusedButton && focusedButton.focus()
    })
    return focusedButtonClass
  },

  handleCodeAfter (button, vm, page, logic) {
    const codeAfter = page.codeAfter
    // default next page is derived from the button pressed.
    // might be overridden by the After logic or special
    // back to prior question button.
    logic.attr('gotoPage', button.next)

    // execute After logic only if not going to a prior question
    if (codeAfter && button.next !== constants.qIDBACK) {
      vm.traceMessageAfterQuestion()

      // parsing codeAfter causes several re-renders, batching for performance
      // TODO: might not need this once afterLogic parsing is refactored to canjs
      queues.batch.start()
      logic.exec(codeAfter)
      queues.batch.stop()
    }
  },

  // TODO: this function is copied into navigation-panel.js, need to refactor so this happens differently or move it into a shared spot.
  setRepeatVariable (button) {
    const repeatVar = button.repeatVar
    const repeatVarSet = button.repeatVarSet

    if (repeatVar && repeatVarSet) {
      const logic = this.logic
      const traceMessage = this.appState.traceMessage
      const traceMsg = {}

      switch (repeatVarSet) {
        case constants.RepeatVarSetOne: {
          if (!logic.varExists(repeatVar)) {
            logic.varCreate(repeatVar, 'Number', false, 'Repeat variable index')
          }

          logic.varSet(repeatVar, 1)
          traceMsg.key = repeatVar + '-0'
          traceMsg.fragments = [{ format: '', msg: 'Setting [' + repeatVar + '] to 1' }]
          break
        }

        case constants.RepeatVarSetPlusOne: {
          const value = logic.varGet(repeatVar)

          logic.varSet(repeatVar, value + 1)
          traceMsg.key = repeatVar + '-' + value
          traceMsg.fragments = [{ format: '', msg: 'Incrementing [' + repeatVar + '] to ' + (value + 1) }]
          break
        }
      }

      traceMessage.addMessage(traceMsg)
    }
  },

  handlePreviewResponses (button, ev) {
    ev && ev.preventDefault()
    switch (button.next) {
      case constants.qIDFAIL:
        this.appState.modalContent = {
          title: 'Author note:',
          text: 'User would be redirected to \n(' + button.url + ')'
        }
        break

      case constants.qIDEXIT:
        this.appState.modalContent = {
          title: 'Author note:',
          text: "User's INCOMPLETE data would upload to the server."
        }
        break

      case constants.qMESSAGE:
        this.appState.modalContent = {
          title: 'Author note:',
          text: button.message || 'You have completed this A2J Guided Interview. Please close your browser window to exit.'
        }
        break

      case constants.qIDASSEMBLE:
        this.appState.modalContent = {
          title: 'Author note:',
          text: 'Document Assembly would happen here.  Use Test Assemble under the Templates tab to assemble in A2J Author'
        }
        break

      case constants.qIDSUCCESS:
        this.appState.modalContent = {
          title: 'Author note:',
          text: "User's data would upload to the server."
        }
        break
      case constants.qIDASSEMBLESUCCESS:
        this.appState.modalContent = {
          title: 'Author note:',
          text: "User's data would upload to the server, then assemble their document.  Use Test Assemble under the Templates tab to assemble in A2J Author"
        }
        break
    }
  },

  handleServerPost (button, vm, previewActive, ev) {
    // do nothing if in preview
    if (previewActive) { return }

    if (button.next !== constants.qIDEXIT) {
      vm.setInterviewAsComplete()
    }

    // This modal and disable is for LHI/HotDocs issue taking too long to process
    // prompting users to repeatedly press submit, crashing HotDocs
    // Matches A2J4 functionality, but should really be handled better on LHI's server
    vm.appState.modalContent = {
      title: 'Answers Submitted :',
      text: 'Page will redirect shortly'
    }

    if (button.next !== constants.qIDASSEMBLE) {
      vm.dispatch('post-answers-to-server')

      // qIDASSEMBLESUCCESS requires the default event to trigger the assemble post
      // and the manual submit triggered by the dispatched event above to save answers
      // TODO: there should be a better way to control these dual submits
      if (button.next !== constants.qIDASSEMBLESUCCESS) {
        ev && ev.preventDefault()
      }
    }
    // disable the previously clicked button
    setTimeout(() => {
      $('button:contains(' + button.label + ')').prop('disabled', true)
    })
  },

  handleBackButton (button, appState, logic) {
    if (button.next !== constants.qIDBACK) { return }

    const cvp = this.currentVisitedPage || {}
    const prevPage = cvp.parentVisitedPage || {}
    const prevInterviewPage = prevPage.interviewPage || {}
    const priorQuestionName = prevInterviewPage.name
    // override with new gotoPage
    logic.attr('gotoPage', priorQuestionName)
    button.next = priorQuestionName
  },

  // navigate util functions
  isSpecialButton (button) {
    return button.next === constants.qIDFAIL ||
    button.next === constants.qIDEXIT ||
    button.next === constants.qMESSAGE ||
    button.next === constants.qIDSUCCESS ||
    button.next === constants.qIDASSEMBLESUCCESS ||
    button.next === constants.qIDASSEMBLE
  },

  isPostOrAssemble (button) {
    return button.next === constants.qIDEXIT ||
    button.next === constants.qIDSUCCESS ||
    button.next === constants.qIDASSEMBLESUCCESS ||
    button.next === constants.qIDASSEMBLE
  },

  setInterviewAsComplete () {
    const answers = this.answers
    const interviewCompleteKey = constants.vnInterviewIncompleteTF.toLowerCase()
    answers.varSet(interviewCompleteKey, false, 0)
  },

  reloadingHistory: {
    type: 'boolean',
    default: false
  },

  connected: { type: 'boolean', default: false }, // ghost history needs the page to render after everything is set up
  connectedCallback () {
    const vm = this
    const ans = vm.answers
    const history = ans && JSON.parse(ans.varGet(constants.PAGEHISTORY.toLowerCase()) || '[]')
    let hydrated = false
    if (history && history.length) {
      this.reloadingHistory = true
      hydrated = !!vm.appState.visitedPages.hydrate(history)
      this.reloadingHistory = false
    }

    !hydrated && vm.appState.visitedPages.visit(this.appState.currentPage)

    // ghost-history next page stack for the previouslySelectedButton fallback alg
    if (!hydrated && history && history.length) {
      ghostHistory = new GhostHistory({ serializedVisitedPages: history })
    }
    this.connected = true
    return () => { vm.stopListening() }
  },

  /**
   * @function pages.ViewModel.prototype.__ensureFieldAnswer __ensureFieldAnswer
   * @parent pages.ViewModel
   *
   * Returns an Answer instance of the given field name.
   *
   * This method takes a `field` model instance and checks if there is an
   * `answer` object already set in the `interview.answers` list, if that's
   * the case the object is returned, otherwise an empty answer is created
   * using the `field` data, that answer is set to the answers list and returned.
   *
   * ** This is doing too many things, it probably does not belong here either.
   */
  __ensureFieldAnswer (field) {
    let answerKey = field.name.toLowerCase()
    if (!answerKey) {
      answerKey = 'missingVarName' + ~~(Math.random() * 1000000)
      field.name = answerKey
      console.warn('Field is missing a Variable Name', field)
    }
    const answers = this.answers

    let answer = answers[answerKey]

    if (!answer) {
      answer = field.emptyAnswer
      answers.set(answerKey, answer)
    }

    return answer
  },

  setFieldAnswers (fields, cvp) {
    const logic = this.logic
    if (logic && fields.length && cvp) {
      const mState = this.mState
      const answerIndex = cvp.repeatVarValue || 1
      // This setFieldAnswers fn is called as soon as currentVisitedPage changes
      // so appState.answerIndex isn't recalculated until the next event loop...

      fields.forEach(field => {
        const answer = this.__ensureFieldAnswer(field)
        const avm = new AnswerVM({ field, answerIndex, answer, fields })

        if (field.type === 'textpick') {
          field.getOptions(mState.attr('fileDataURL'))
        }

        // Assign default value if it exists and no previous answer
        if (field.value && !avm.answer.values[answerIndex]) {
          this.setDefaultValue(field, avm, answer, answerIndex)
          // mirror all default values to the old answers https://github.com/CCALI/a2jauthor/issues/279
          this.interview.answers.varSet(answer.name.toLowerCase(), avm.answer.values[answerIndex], answerIndex)
        }

        field._answerVm = avm
        // if repeating true, show var#count in debug-panel
        const answerValue = avm.answer.values[answerIndex]
        this.logVarMessage(answer.name, answerValue, answer.repeating, answerIndex)
      })
    }
  },

  setDefaultValue (field, avm, answer, answerIndex) {
    const fieldIsNumber = (
      field.type === constants.ftNumber ||
      field.type === constants.ftNumberDollar ||
      field.type === constants.ftNumberPick
    )

    const fieldIsDate = field.type === constants.ftDateMDY

    // Default values used differently or not at all for these field types
    const defaultAllowed = (
      field.type !== constants.ftRadioButton &&
      field.type !== constants.ftCheckBox &&
      field.type !== constants.ftCheckBoxNOTA &&
      field.type !== constants.ftGender
    )

    if (defaultAllowed) {
      if (fieldIsNumber) {
        avm.answer.values[answerIndex] = parseFloat(field.value, 10)
      } else if (fieldIsDate && field.value.toUpperCase() === 'TODAY') {
        // resolve special value TODAY
        avm.answer.values[answerIndex] = moment().format('MM/DD/YYYY')
      } else {
        avm.answer.values[answerIndex] = field.value
      }
    }

    return avm
  },

  logVarMessage (answerName, answerValue, isRepeating, answerIndex) {
    const answerIndexDisplay = isRepeating ? `#${answerIndex}` : ''

    this.appState.traceMessage.addMessage({
      key: answerName,
      fragments: [
        { format: 'var', msg: answerName + answerIndexDisplay },
        { format: '', msg: ' = ' },
        { format: 'val', msg: answerValue }
      ]
    })
  }
})
