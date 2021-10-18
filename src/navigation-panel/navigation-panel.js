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

  visitedPages: {
    get () {
      return this.appState.visitedPages
    }
  },

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

  connectedCallback (el) {
    const visitedPages = this.appState.visitedPages
    visitedPages.listenTo('length', (ev, val) => {
      const currentNavPage = document.querySelector('.active-nav-page-item')
      const currentNavPageTop = currentNavPage.offsetTop
      const $navPanelParent = $('#nav-panel-parent')
      // shows past 2 pages at top of list
      const modifier = 84

      setTimeout(() => {
        $navPanelParent.animate({ scrollTop: (currentNavPageTop - modifier) }, 100)
      }, 0)
    })
  }
})

export default Component.extend({
  view: template,
  ViewModel: NavigationPanelVM,
  tag: 'navigation-panel'
})
