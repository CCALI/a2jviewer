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

  navPages: {
    get () {
      let navPages = this.appState.visitedPages.serialize()
      return buildOptions(navPages.reverse())
    }
  },

  futurePages: {
    get () {
      let futurePages = this.appState.futurePages.serialize()
      return buildOptions(futurePages)
    }
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
  }
})

export default Component.extend({
  view: template,
  ViewModel: NavigationPanelVM,
  tag: 'navigation-panel'
})
