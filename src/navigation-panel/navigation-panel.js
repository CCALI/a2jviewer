import DefineMap from 'can-define/map/map'
import Component from 'can-component'
import template from './navigation-panel.stache'
import buildOptions from '../util/build-options-steps'

/**
 * @property {DefineMap} debugPanel.ViewModel
 * @parent <navigation-panel>
 *
 * `<navigation-panel>`'s viewModel.
 */
export let NavigationPanelVM = DefineMap.extend('NavigationPanelVM', {
  // passed in view debug-panel.stache
  appState: {},

  logic: {
    get () {
      return this.appState.logic
    }
  },

  navPages: {
    get () {
      let navPages = this.appState.visitedPages.serialize()
      return buildOptions(navPages.reverse(), this.logic)
    }
  },

  futurePages: {
    get () {
      let futurePages = this.appState.futurePages.serialize()
      return buildOptions(futurePages, this.logic)
    }
  },

  isPageActive (pageName) {
    if (this.appState.visitedPages[this.appState.selectedPageIndex].name === pageName) {
      return true
    }
    return false
  },

  navToPage (pageName) {
    // a click should nav to the selected page,
    // it should also match the MyProgress state.
    let selectedIndex
    this.appState.visitedPages.forEach((pageObj, index) => {
      if (pageObj.name === pageName) {
        selectedIndex = index
      }
    })
    this.appState.selectedPageIndex = selectedIndex
    // for testing purposes
    return selectedIndex
  },

  // connectedCallback (el) {
  //   const vm = this
  //   vm.appState.listenTo('currentPage', (ev, currentPageModel) => {
  //     console.log(currentPageModel, '-------')
  //     const currentPageName = currentPageModel.name
  //     let indexMatch
  //     vm.navPages.forEach((page, index) => {
  //       if (page.name === currentPageName) {
  //         indexMatch = index
  //       }
  //     })
  //     const selectorTarget = vm.navPages[indexMatch].text.split(':')[0]
  //     const $currentPageElement = $(`a.nav-page-item:contains(${selectorTarget})`)
  //     console.log($currentPageElement)
  //     // const pageNameTop = $pageName[0].offsetTop
  //     // const $debugPanel = $('#logic-trace-panel')
  //     // const modifier = 5

  //     // setTimeout(() => {
  //     //   $debugPanel.animate({ scrollTop: (pageNameTop - modifier) }, 100)
  //     // }, 0)
  //   })

  //   return () => {
  //     this.stopListening()
  //   }
  // }
})

export default Component.extend({
  view: template,
  ViewModel: NavigationPanelVM,
  tag: 'navigation-panel'
})
