import stache from 'can-stache'
import DefineMap from 'can-define/map/map'
import DefineList from 'can-define/list/list'
import TraceMessage from '~/src/models/trace-message'
import VisitedPages from '~/src/models/visited-pages'
import isMobile from '~/src/util/is-mobile'

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

  showDebugPanel: {
    serialize: false,
    default: null
  },

  showNavPanel: {
    serialize: false,
    default: false
  },

  // TODO: change this to currentPageName (fix viewer app.js routes)
  // to match currentPage which is the Map holding all page info
  page: {
    type: 'string',
    value ({ lastSet, listenTo, resolve }) {
      // this.page = foo
      listenTo(lastSet, (pageName) => {
        resolve(pageName)
      })
      listenTo(this.visitedPages, 'selected', (ev, selectedVisitedPage) => {
        resolve(selectedVisitedPage.interviewPage.name)
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

  visitedPages: {
    serialize: false,
    default: function () {
      const vps = new VisitedPages()
      vps.assign({ sharedRefs: this })
      return vps
    }
  },

  get currentVisitedPage () {
    return (this.visitedPages || []).selected
  },

  repeatVarValue: {
    type: 'number',
    serialize: true,
    value ({ lastSet, listenTo, resolve }) {
      listenTo(lastSet, (rvv) => {
        // only set by routes from app.js when a2j-viewer-preview is used in author. (shouldn't be set directly otherwise.)
        // setting this via route isn't well defined so there are no expectations yet. For now, just force the value change
        const cvp = this.currentVisitedPage
        if (cvp) {
          cvp.repeatVarValue = rvv
        }
        resolve(rvv)
      })
      listenTo(this.visitedPages, 'selected', (ev, selectedVisitedPage) => {
        const v = selectedVisitedPage.interviewPage.repeatVar
        const vv = selectedVisitedPage.repeatVarValue
        v && this.logic.varSet(v, vv)
        resolve(vv)
      })
    }
  },

  outerLoopVarValue: {
    type: 'number',
    serialize: true,
    value ({ lastSet, listenTo, resolve }) {
      listenTo(lastSet, (olvv) => {
        resolve(olvv)
        // only set by routes from app.js when a2j-viewer-preview is used in author. (shouldn't be set directly otherwise.)
        // setting this via route isn't well defined so there are no expectations yet. For now, just force the value change
        const cvp = this.currentVisitedPage
        if (cvp) {
          cvp.outerLoopVarValue = olvv
        }
      })
      listenTo(this.visitedPages, 'selected', (ev, selectedVisitedPage) => {
        const v = selectedVisitedPage.interviewPage.outerLoopVar
        const vv = selectedVisitedPage.outerLoopVarValue
        v && this.logic.varSet(v, vv)
        resolve(vv)
      })
    }
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

  logic: {
    serialize: false
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

  useMobileUI: {
    get () {
      const notMobile = !isMobile()
      const useMobileFlag = !!(this.interview && this.interview.attr('useMobileUI'))
      return notMobile && useMobileFlag
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

  connectedCallback () {
    const vm = this

    const body = document.querySelector('body')
    // toggle lawn background color
    const toggleLawnHandler = (ev, showDebugPanel) => {
      if (showDebugPanel || vm.useMobileUI) {
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
