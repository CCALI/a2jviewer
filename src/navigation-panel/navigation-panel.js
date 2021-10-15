import DefineMap from 'can-define/map/map'
import Component from 'can-component'
import template from './navigation-panel.stache'

/**
 * @property {DefineMap} debugPanel.ViewModel
 * @parent <navigation-panel>
 *
 * `<navigation-panel>`'s viewModel.
 */
export let NavigationPanelVM = DefineMap.extend('NavigationPanelVM', {
  // passed in view debug-panel.stache
  appState: {},

  getInverseIndex (index) {
    const offset = this.appState.visitedPages.length - 1
    return offset - index
  },

  // this reverses the page order from MyProgress
  getNavPanelPage (index) {
    const inverseIndex = this.getInverseIndex(index)
    const page = this.appState.visitedPages[inverseIndex]
    return { page, vm: this }
  },

  navToPage (clickedIndex) {
    // nav panel pages are in reverse order, handle that
    const selectedIndex = this.getInverseIndex(clickedIndex)
    this.appState.selectedPageIndex = selectedIndex

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
