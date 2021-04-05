import DefineMap from 'can-define/map/map'
// import CanList from 'can-list'
// import DefineList from 'can-define/list/list'
import Component from 'can-component'
import template from './advance-nav.stache'

/**
 * @property {DefineMap} debugPanel.ViewModel
 * @parent <advance-nav>
 *
 * `<advance-nav>`'s viewModel.
 */
export let AdvanceNavVM = DefineMap.extend('AdvanceNavVM', {
  // passed in view debug-panel.stache
  appState: {},

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
  ViewModel: AdvanceNavVM,
  tag: 'advance-nav'
})
