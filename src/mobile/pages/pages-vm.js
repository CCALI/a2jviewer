import $ from 'jquery'
import DefineMap from 'can-define/map/map'
import _some from 'lodash/some'
import _isString from 'lodash/isString'
import _forEach from 'lodash/forEach'
import queues from 'can-queues'
import AnswerVM from '~/src/models/answervm'
import Parser from '@caliorg/a2jdeps/utils/parser'
import { analytics } from '~/src/util/analytics'
import constants from '~/src/models/constants'
import moment from 'moment'

import 'bootstrap/js/modal'

/**
 * @property {DefineMap} pages.ViewModel
 * @parent viewer/mobile/pages/
 *
 * `<a2j-pages>` viewModel.
 */
export default DefineMap.extend('PagesVM', {
  // passed in via steps.stache or mobile.stache
  currentPage: {},
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
      const onExitPage = appState.saveAndExitActive && (appState.currentPage.name === vm.interview.attr('exitPage'))

      button.next = vm.handleCrossedUseOfResumeOrBack(button, onExitPage)

      vm.saveButtonValue(button, vm, page, logic) // buttons with variables assigned

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
    let hasProtocol = failURL.indexOf('http') === 0
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

  saveButtonValue (button, vm, page, logic) {
    if (!button.name) { return } // no variable assigned

    const buttonAnswer = vm.__ensureFieldAnswer(button)
    const repeatVar = page.repeatVar
    let buttonAnswerIndex = repeatVar ? logic.varGet(repeatVar) : 1
    let buttonValue = button.value

    // button source values are always text, so do type conversion here
    // TODO: should probably handle in answers.js model
    if (buttonAnswer.type === 'TF') {
      buttonValue = buttonValue.toLowerCase() === 'true'
    } else if (buttonAnswer.type === 'Number') {
      buttonValue = parseFloat(buttonValue)
    }

    vm.logVarMessage(button.name, buttonValue, false, buttonAnswerIndex)
    logic.varSet(button.name, buttonValue, buttonAnswerIndex)
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

  setRepeatVariable (button) {
    const repeatVar = button.repeatVar
    const repeatVarSet = button.repeatVarSet

    if (repeatVar && repeatVarSet) {
      const logic = this.logic
      const traceMessage = this.appState.traceMessage
      const traceMsg = {}

      switch (repeatVarSet) {
        case constants.RepeatVarSetOne:
          if (!logic.varExists(repeatVar)) {
            logic.varCreate(repeatVar, 'Number', false, 'Repeat variable index')
          }

          logic.varSet(repeatVar, 1)
          traceMsg.key = repeatVar + '-0'
          traceMsg.fragments = [{ format: '', msg: 'Setting [' + repeatVar + '] to 1' }]
          break

        case constants.RepeatVarSetPlusOne:
          const value = logic.varGet(repeatVar)

          logic.varSet(repeatVar, value + 1)
          traceMsg.key = repeatVar + '-' + value
          traceMsg.fragments = [{ format: '', msg: 'Incrementing [' + repeatVar + '] to ' + (value + 1) }]
          break
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
    // last visited page always at index 1
    const priorQuestionName = appState.visitedPages[1].name
    // override with new gotoPage
    logic.attr('gotoPage', priorQuestionName)
    button.next = priorQuestionName
  },

  // navigate util functions
  isSpecialButton (button) {
    return button.next === constants.qIDFAIL ||
    button.next === constants.qIDEXIT ||
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

  setCurrentPage () {
    const currentPage = this.currentPage

    if (currentPage && currentPage.name !== constants.qIDFAIL) {
      if (!currentPage) {
        console.warn(`Unknown page: ${currentPage.name}`)
        return
      }

      queues.batch.start()

      this.setFieldAnswers(currentPage.fields)

      this.mState.attr('header', currentPage.step.text)
      this.mState.attr('step', currentPage.step.number)

      queues.batch.stop()
    }
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
    const answerKey = field.name.toLowerCase()
    const answers = this.answers

    let answer = answers[answerKey]

    if (!answer) {
      answer = field.emptyAnswer
      answers.set(answerKey, answer)
    }

    return answer
  },

  setFieldAnswers (fields) {
    const logic = this.logic
    if (logic && fields.length) {
      const appState = this.appState
      const mState = this.mState
      const answerIndex = appState.answerIndex

      fields.forEach(field => {
        const answer = this.__ensureFieldAnswer(field)
        const avm = new AnswerVM({ field, answerIndex, answer, fields })

        if (field.type === 'textpick') {
          field.getOptions(mState.attr('fileDataURL'))
        }

        // Assign default value if it exists and no previous answer
        if (field.value && !avm.answer.values[answerIndex]) {
          this.setDefaultValue(field, avm, answer, answerIndex)
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
  },

  connectedCallback () {
    const vm = this
    vm.setCurrentPage()

    const appState = vm.appState

    appState.listenTo('selectedPageName', (ev, newVal, oldVal) => {
      const currentPage = vm.currentPage
      vm.setFieldAnswers(currentPage.fields)
    })

    return () => { vm.stopListening() }
  }
})
