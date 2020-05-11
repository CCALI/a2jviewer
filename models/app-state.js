import route from 'can-route'
import _findIndex from 'lodash/findIndex'
import Infinite from 'caja/viewer/mobile/util/infinite'
import DefineMap from 'can-define/map/map'
import DefineList from 'can-define/list/list'
import canReflect from 'can-reflect'
import queues from 'can-queues'

export const ViewerAppState = DefineMap.extend('ViewerAppState', {
  // skinTone, hairColor, gender, isOld, hasWheelChair
  userAvatar: {
    serialize: false,
    get () {
      const defaultUserAvatar = { gender: 'female', isOld: false, hasWheelchair: false, hairColor: 'brownDark', skinTone: 'medium' }
      const answers = this.interview && this.interview.attr('answers')
      const savedUserAvatar = answers.attr('user avatar') && answers.attr('user avatar').values[1]
      const userAvatar = savedUserAvatar ? JSON.parse(savedUserAvatar) : defaultUserAvatar
      return new DefineMap(userAvatar)
    }
  },

  traceMessage: {
    serialize: false
  },

  infinite: {
    Type: Infinite,
    Default: Infinite,
    serialize: false
  },

  selectedPageIndex: {
    serialize: false,
    type: 'string',
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
    default () { return new DefineList([]) }
  },

  previewActive: {
    serialize: false,
    get () {
      return canReflect.getKeyValue(route.data, 'page') === 'preview'
    }
  },

  saveAndExitActive: {
    get () {
      return !!this.lastPageBeforeExit
    },
    serialize: false
  },

  lastPageBeforeExit: {
    default: null,
    serialize: false
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

  modalContent: {
    serialize: false
  },

  logic: {
    serialize: false
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
    logic.exec(currentPage.attr('codeBefore'))
    queues.batch.stop()

    let postGotoPage = this.logic.attr('gotoPage')

    // if preGotoPage does not match postGotoPage, codeBefore fired an A2J GOTO logic
    return preGotoPage !== postGotoPage ? postGotoPage : false
  },

  checkInfiniteLoop () {
    if (this.infinite.attr('outOfRange')) {
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
    const questionCountPerStep = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]

    const visitedPageHandler = (ev) => {
      this.checkInfiniteLoop()
      if (!this.currentPage) { return }

      // handle codeBefore A2J logic
      if (this.currentPage.attr('codeBefore')) {
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
    return () => { this.stopListening() }
  }
})

export default ViewerAppState
