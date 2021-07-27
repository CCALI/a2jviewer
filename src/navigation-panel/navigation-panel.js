import DefineMap from 'can-define/map/map'
// import CanList from 'can-list'
// import DefineList from 'can-define/list/list'
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
  navPanelToggle: {},

  navPages: {
    get () {
      let navPages = this.appState.visitedPages.serialize()
      return navPages.reverse()
    }
  },

  stripHTMLTags (text) {
    // strip html tags
    return text.replace(/(<([^>]+)>)/ig, '').trim()
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
    this.navPanelToggle = !this.navPanelToggle
    // for testing purposes
    return selectedIndex
  },

  connectedCallback (el) {
    return () => {
    }
  }
})

export default Component.extend({
  view: template,
  ViewModel: NavigationPanelVM,
  tag: 'navigation-panel'
})
