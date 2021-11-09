import stache from 'can-stache'
import _findIndex from 'lodash/findIndex'
import _find from 'lodash/find'
import Infinite from '~/src/mobile/util/infinite'
import DefineMap from 'can-define/map/map'
import DefineList from 'can-define/list/list'
import queues from 'can-queues'
import TraceMessage from '~/src/models/trace-message'
import HistTree from '~/src/models/hist-tree'
import { hasPageLogic, hasMultipleButtons, hasRequiredField, hasSpecialButton, hasNoNextPageTarget } from '~/src/util/future-pages-setup'
import formatDisplayText from '~/src/util/format-display-text'

const UserAvatar = DefineMap.extend('UserAvatar', {
  gender: { default: 'female' },
  isOld: { default: false },
  hasWheelchair: { default: false },
  hairColor: { default: 'brownDark' },
  skinTone: { default: 'medium' }
})
const defaultUserAvatar = new UserAvatar()

const VisitedPage = DefineMap.extend('VisitedPage', {
  display: {
    get () {
      // re-eval if answer values have updated via beforeCode
      const answersChanged = this.answers && this.answers.serialize() // eslint-disable-line
      const questionText = this.text || ''
      const resolvedText = this.logic && this.logic.eval(questionText)

      return formatDisplayText({
        name: this.name,
        text: resolvedText || questionText,
        repeatVarValue: this.repeatVarValue,
        stepNumber: this.step.number,
        questionNumber: this.questionNumber
      })
    }
  },
  repeatVarValue: {},
  outerLoopVarValue: {},
  questionNumber: {},
  logic: {},
  answers: {}
})

export const ViewerAppState = DefineMap.extend('ViewerAppState', {
  // set in preview.js
  resumeEdit: {},

  // skinTone, hairColor, gender, isOld, hasWheelChair
  userAvatar: {
    serialize: false,
    get () {
      const answers = this.interview && this.interview.attr('answers')
      const savedUserAvatar = answers.varGet('user avatar', 1)
      return savedUserAvatar ? new UserAvatar((JSON.parse(savedUserAvatar))) : defaultUserAvatar
    }
  },

  traceMessage: {
    serialize: false,
    Type: TraceMessage,
    Default: TraceMessage
  },

  showDebugPanel: {
    serialize: false,
    default: null
  },

  showNavPanel: {
    serialize: false,
    default: false
  },

  infinite: {
    Type: Infinite,
    Default: Infinite,
    serialize: false
  },

  // which visitedPages[] is selected
  selectedPageIndex: {
    serialize: false,
    type: 'number',
    value ({ lastSet, listenTo, resolve }) {
      resolve(0)

      listenTo(lastSet, (index) => {
        const revisitedPage = this.visitedPages[index]
        this.restoreLoopVars(revisitedPage)
        resolve(index)
        // listenTo is in navigation.js to rebuild options list
        // handles new pages and revisited pages
        this.dispatch('selectedPageIndexSet')
      })
    }
  },

  selectedPageName: {
    serialize: false,
    get () {
      if (this.visitedPages.length) {
        return this.visitedPages[this.selectedPageIndex].name
      }
    }
  },

  // TODO: change this to currentPageName (fix viewer app.js routes)
  // to match currentPage which is the Map holding all page info
  page: {
    type: 'string',
    value ({ lastSet, listenTo, resolve }) {
      // this.page = foo
      listenTo(lastSet, (pageName) => {
        resolve(pageName)
        this.dispatch('pageSet')
      })
      // page set by drop down navigation
      listenTo('selectedPageName', (ev, selectedPageName) => {
        resolve(selectedPageName)
      })
    }
  },

  // CanMap based on current page name (this.page)
  currentPage: {
    serialize: false,
    get () {
      return this.interview && this.interview.getPageByName(this.page)
    }
  },

  repeatVarValue: {
    type: 'number'
  },

  outerLoopVarValue: {
    type: 'number'
  },

  visitedPages: {
    serialize: false,
    default: () => new DefineList()
  },

  futurePages: {
    serialize: false,
    default: () => new DefineList()
  },

  // set when launched via preview.js during Author Preview
  previewActive: {
    serialize: false
  },

  saveAndExitActive: {
    serialize: false,
    get () {
      return !!this.lastPageBeforeExit
    }
  },

  lastPageBeforeExit: {
    serialize: false,
    default: null
  },

  lastVisitedPageName: {
    serialize: false
  },

  interview: {
    serialize: false,
    set (interview) {
      document.title = 'A2J Guided Interview called ' + interview.title
      if (interview.attr('showNavDefault')) {
        this.showDebugPanel = true
        this.showNavPanel = true
      }
      return interview
    }
  },

  answers: {
    get () {
      return this.interview && this.interview.attr('answers')
    }
  },

  // used for internal page routing in preview.js
  view: {},

  // answerIndex is 1 if repeatVarValue is null, undefined, 0, or empty string
  answerIndex: {
    serialize: false,
    get () {
      return !this.repeatVarValue ? 1 : this.repeatVarValue
    }
  },

  // passed into modal.stache - shows modal on new values
  modalContent: {
    serialize: false,
    default: null
  },

  logic: {
    serialize: false
  },

  viewerAlertMessages: {
    serialize: false,
    default: () => new DefineList()
  },

  toggleDebugPanel (showNav) {
    this.showDebugPanel = !this.showDebugPanel
    if (showNav) {
      this.showNavPanel = true
    }
  },

  toggleNavPanel () {
    this.showNavPanel = !this.showNavPanel
  },

  restoreLoopVars (visitedPage) {
    const repeatVar = visitedPage.repeatVar
    if (repeatVar) {
      this.logic.varSet(repeatVar, visitedPage.repeatVarValue)
      this.repeatVarValue = visitedPage.repeatVarValue
    } else {
      this.repeatVarValue = undefined
    }
    const outerLoopVar = visitedPage.outerLoopVar
    if (outerLoopVar) {
      this.logic.varSet(outerLoopVar, visitedPage.outerLoopVarValue)
      this.outerLoopVarValue = visitedPage.outerLoopVarValue
    } else {
      this.outerLoopVarValue = undefined
    }
  },

  fireCodeBefore (currentPage, logic) {
    let preGotoPage = this.logic.attr('gotoPage')

    // batching here for performance reasons due to codeBefore string parsing
    queues.batch.start()
    logic.exec(currentPage.codeBefore)
    queues.batch.stop()

    let postGotoPage = this.logic.attr('gotoPage')

    // if preGotoPage does not match postGotoPage, codeBefore fired an A2J GOTO logic
    return preGotoPage !== postGotoPage ? postGotoPage : false
  },

  checkInfiniteLoop () {
    if (this.infinite.outOfRange) {
      this.traceMessage.addMessage({
        key: 'infinite loop',
        fragments: [{
          format: 'valF',
          msg: 'INFINITE LOOP: Too many page jumps without user interaction. GOTO target: ' + this.page
        }]
      })
      throw new Error('INFINITE LOOP: Too many page jumps without user interaction. GOTO target: ' + this.page)
    } else {
      this.infinite.inc()
    }
  },

  resetInfiniteLoop () {
    this.infinite.reset()
  },

  // checks if page is already present in visitedPages
  checkVisitedPages (pageName) {
    return !!_find(this.visitedPages, (page) => page.name === pageName)
  },

  hasStopper (page) {
    return hasMultipleButtons(page.buttons) ||
    hasSpecialButton(page.buttons) ||
    hasNoNextPageTarget(page.buttons) ||
    hasRequiredField(page.fields) ||
    hasPageLogic(page)
  },

  handleFuturePages (page) {
    // testing current page target, stop recursion if has stopper
    const hasStopper = this.hasStopper(page)
    if (hasStopper) { return }

    const nextPageName = page.buttons && page.buttons[0].next
    if (nextPageName) {
      const nextPage = this.interview.pages.find(nextPageName)

      // if no stopper on current page, then safe to add next page to futurePages
      const futurePage = new VisitedPage(nextPage)
      futurePage.answers = this.answers
      futurePage.logic = this.logic
      this.futurePages.push(futurePage)

      // recurse
      this.handleFuturePages(nextPage)
    }
  },

  serializeVisitedPages () {
    const vps = this.visitedPages || []
    const serializedVisitedPages = []
    vps.forEach(vp => serializedVisitedPages.push({
      name: vp.name,
      repeatVarValue: vp.repeatVarValue,
      outerLoopVarValue: vp.outerLoopVarValue,
      questionNumber: vp.questionNumber
    }))
    return serializedVisitedPages
  },

  hydrateVisitedPages (serializedVisitedPages) {
    const vm = this
    const pagesList = this.interview.pages
    const pagesByName = pagesList.reduce((acc, p) => {
      acc[p.name] = p
      return acc
    }, {})
    const hydratedVisitedPages = serializedVisitedPages.map(svp => {
      const p = pagesByName[svp.name] // TODO: what if this is missing? Abort restore and start at first page?
      const vp = new VisitedPage(p)

      vp.set('questionNumber', svp.questionNumber)
      vp.set('repeatVarValue', svp.repeatVarValue)
      vp.set('outerLoopVarValue', svp.outerLoopVarValue)
      vp.answers = vm.answers
      vp.logic = vm.logic
      return vp
    })
    if (hydratedVisitedPages && hydratedVisitedPages[0]) {
      this.visitedPages = hydratedVisitedPages
      this.lastVisitedPageName = hydratedVisitedPages[0].name
      this.selectedPageIndex = 0
      this.futurePages.length = 0
      this.handleFuturePages(hydratedVisitedPages[0])
    }
    return hydratedVisitedPages
  },

  connectedCallback () {
    const vm = this

    const body = document.querySelector('body')
    // toggle lawn background color
    const toggleLawnHandler = (ev, showDebugPanel) => {
      if (showDebugPanel) {
        body.classList.remove('with-lawn')
      } else {
        body.classList.add('with-lawn')
      }
    }
    vm.listenTo('showDebugPanel', toggleLawnHandler)

    // TODO: move this to helpers util and handle vm reference?
    // depends on html, answers, and logic.eval
    const parseTextHelper = (html) => {
      // re-eval if answer values have updated via beforeCode'
      const answersChanged = vm.answers.serialize() // eslint-disable-line
      return (html && vm.logic) && vm.logic.eval(html)
    }
    stache.registerHelper('parseText', parseTextHelper)

    const questionCountPerStep = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]

    const visitedPageHandler = (ev) => {
      this.checkInfiniteLoop()
      if (!this.currentPage) { return }

      // handle codeBefore A2J logic
      if (this.currentPage.codeBefore) {
        this.traceMessage.addMessage({ key: 'codeBefore', fragments: [{ format: 'info', msg: 'Logic Before Question' }] })
        const newGotoPage = this.fireCodeBefore(this.currentPage, this.logic)
        if (newGotoPage) {
          this.page = newGotoPage
          return
        }
      }

      // safe to reset if past codeBefore logic
      this.resetInfiniteLoop()

      // handle whether a page is visited or re-visited
      const repeatVar = this.currentPage.repeatVar
      const outerLoopVar = this.currentPage.outerLoopVar
      const repeatVarValue = repeatVar ? this.logic.varGet(repeatVar) : undefined
      const outerLoopVarValue = outerLoopVar ? this.logic.varGet(outerLoopVar) : undefined

      const newVisitedPage = new VisitedPage(this.currentPage)

      const stepNumber = parseInt(newVisitedPage.step.number)
      let questionNumber = parseInt(questionCountPerStep[stepNumber])
      newVisitedPage.set('questionNumber', questionNumber)
      questionCountPerStep[stepNumber] = questionNumber + 1

      newVisitedPage.set('repeatVarValue', repeatVarValue)
      newVisitedPage.set('outerLoopVarValue', outerLoopVarValue)
      const revisitedPageIndex = _findIndex(this.visitedPages, page => (
        newVisitedPage.name === page.name &&
        newVisitedPage.repeatVarValue == page.repeatVarValue && // eslint-disable-line
        newVisitedPage.outerLoopValue == page.outerLoopVarValue // eslint-disable-line
      ))

      if (revisitedPageIndex === -1) {
        newVisitedPage.answers = this.answers
        newVisitedPage.logic = this.logic
        this.repeatVarValue = repeatVarValue
        this.outerLoopVarValue = outerLoopVarValue
        this.visitedPages.unshift(newVisitedPage)
        this.lastVisitedPageName = newVisitedPage.name

        // make sure newly visited page is selected
        this.selectedPageIndex = 0

        if (!this.futurePages.length) {
          // generate new futurePages when it empties out
          this.handleFuturePages(newVisitedPage)
        } else {
          this.futurePages.shift()
        }
      } else {
        this.selectedPageIndex = revisitedPageIndex
      }

      // listened for in pages.js, fires setCurrentPage() in pages-vm.js
      this.dispatch('setCurrentPage')
    }

    // any time one of the loopVars update, check for new visitedPage
    this.listenTo('pageSet', visitedPageHandler)

    // update traceMessage page that messages belong to as page changes
    this.listenTo('page', (ev, currentPageName) => {
      this.traceMessage.currentPageName = currentPageName
    })

    // cleanup memory
    return () => {
      body.classList.remove('with-lawn')
      this.stopListening()
    }
  }
})

export default ViewerAppState
