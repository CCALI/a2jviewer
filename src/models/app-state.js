import stache from 'can-stache'
import _findIndex from 'lodash/findIndex'
import Infinite from '~/src/mobile/util/infinite'
import DefineMap from 'can-define/map/map'
import DefineList from 'can-define/list/list'
import queues from 'can-queues'
import TraceMessage from '~/src/models/trace-message'

const UserAvatar = DefineMap.extend('UserAvatar', {
  gender: { default: 'female' },
  isOld: { default: false },
  hasWheelchair: { default: false },
  hairColor: { default: 'brownDark' },
  skinTone: { default: 'medium' }
})
const defaultUserAvatar = new UserAvatar()

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

  showSlideoutContent: {
    serialize: false,
    default: null
  },

  slideoutContent: {
    serialize: false,
    default: 'debug'
  },

  advanceNavToggleTrigger: {
    serialize: false,
    default: false
  },

  infinite: {
    Type: Infinite,
    Default: Infinite,
    serialize: false
  },

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
      return interview
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

  toggleSlideoutContent () {
    this.showSlideoutContent = !this.showSlideoutContent
  },

  toggleAdvancePanelDisplay () {
    this.slideoutContent = this.slideoutContent === 'debug' ? 'nav' : 'debug'
  },

  getVisitedPageIndex (visitedPage) {
    return _findIndex(this.visitedPages, function (page) {
      return visitedPage.name === page.name &&
      visitedPage.repeatVarValue == page.repeatVarValue && // eslint-disable-line
      visitedPage.outerLoopValue == page.outerLoopVarValue // eslint-disable-line
    })
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

  connectedCallback () {
    const vm = this

    const body = document.querySelector('body')
    // toggle lawn background color
    const toggleLawnHandler = (ev, showSlideoutContent) => {
      if (showSlideoutContent) {
        body.classList.remove('with-lawn')
      } else {
        body.classList.add('with-lawn')
      }
    }
    vm.listenTo('showSlideoutContent', toggleLawnHandler)

    // TODO: move this to helpers util and handle vm reference?
    // depends on html, answers, and logic.eval
    const parseTextHelper = (html) => {
      // re-eval if answer values have updated via beforeCode'
      const answersChanged = vm.interview && vm.interview.attr('answers').serialize() // eslint-disable-line
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

      const newVisitedPage = new DefineMap(this.currentPage)

      const stepNumber = parseInt(newVisitedPage.step.number)
      let questionNumber = parseInt(questionCountPerStep[stepNumber])
      newVisitedPage.set('questionNumber', questionNumber)
      questionCountPerStep[stepNumber] = questionNumber + 1

      newVisitedPage.set('repeatVarValue', repeatVarValue)
      newVisitedPage.set('outerLoopVarValue', outerLoopVarValue)
      const revisitedPageIndex = this.getVisitedPageIndex(newVisitedPage)

      if (revisitedPageIndex === -1) {
        this.repeatVarValue = repeatVarValue
        this.outerLoopVarValue = outerLoopVarValue
        this.visitedPages.unshift(newVisitedPage)
        this.lastVisitedPageName = newVisitedPage.name
        // make sure newly visited page is selected
        this.selectedPageIndex = 0
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
