import DefineMap from 'can-define/map/map'
import Component from 'can-component'
import template from './navigation-panel.stache'
import isMobile from '~/src/util/is-mobile'
import constants from '~/src/models/constants'

/**
 * @property {DefineMap} debugPanel.ViewModel
 * @parent <navigation-panel>
 *
 * `<navigation-panel>`'s viewModel.
 */
export let NavigationPanelVM = DefineMap.extend('NavigationPanelVM', {
  // passed in view debug-panel.stache
  appState: {},

  showPrunedBranches: {
    get () {
      // may become an author option for the interview later to disable this
      return true
    }
  },
  plus1 (v) {
    return v + 1
  },

  isMobile: {
    get () {
      return isMobile()
    }
  },

  mobileOpenToggle: {
    type: 'boolean',
    default: false
  },

  mobileAndOpen: {
    get () {
      return this.isMobile && this.mobileOpenToggle
    }
  },

  visitedPages: {
    get () {
      return this.appState.visitedPages
    }
  },

  logic: {
    get () {
      return this.appState.logic
    }
  },

  focusMainContent () {
    document.querySelector('.question-text-container').focus()
  },

  navToPage (visitedPage) {
    this.visitedPages.selected = visitedPage
    this.mobileOpenToggle = false // close the mobile nav panel once an item was clicked
    this.focusMainContent()
  },

  restoreAndNavToParentPage (inactiveVisitedPage) {
    inactiveVisitedPage.setActive()
    this.navToPage(inactiveVisitedPage.parentVisitedPage)
  },

  navToFuture (futureVisitedPage) {
    const visitedPages = this.visitedPages
    const futureVisitedPages = visitedPages.futureVisitedPages.slice()
    const fvpi = futureVisitedPages.indexOf(futureVisitedPage)
    // console.log("nav to future", fvpi, futureVisitedPages)
    if (fvpi > -1) {
      visitedPages.selected = visitedPages.activeLeaf
      let prevPage = visitedPages.activeLeaf.interviewPage
      for (let i = 0; i <= fvpi; i++) {
        this.setRepeatVariable(prevPage.buttons[0])
        const nextPage = futureVisitedPages[i].interviewPage
        visitedPages.visit(nextPage, 0, i < fvpi)
        // document.querySelector('a2j-pages').viewModel.navigate(prevPage.buttons[0])
        prevPage = nextPage
      }
    }
    this.mobileOpenToggle = false
    this.focusMainContent()
  },

  // TODO: this is a copy of the function in pages-vm.js, need to refactor so this happens differently or at least is in a shared spot
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

  connectedCallback (el) {
    const visitedPages = this.visitedPages
    visitedPages.listenTo('length', (ev, val) => {
      const currentNavPage = document.querySelector('.active-nav-page-item')
      if (currentNavPage) {
        const currentNavPageTop = currentNavPage.offsetTop
        const $navPanelParent = $('#nav-panel-parent')
        // shows past 2 pages at top of list
        const modifier = 84

        setTimeout(() => {
          $navPanelParent.animate({ scrollTop: (currentNavPageTop - modifier) }, 100)
        }, 0)
      }
    })
    visitedPages.listenTo('selected', (ev, visitedPage) => {
      // if we're coming BACK to a page that was previously skipped, un-flag it
      if (visitedPage && visitedPage.skipped && visitedPage.nextVisitedPage) {
        visitedPage.skipped = false
      }
    })
  }
})

export default Component.extend({
  view: template,
  ViewModel: NavigationPanelVM,
  tag: 'navigation-panel'
})
