import DefineMap from 'can-define/map/map'
// import CanList from 'can-list'
import DefineList from 'can-define/list/list'
import Component from 'can-component'
import template from './advance-nav.stache'

/**
 * @property {DefineMap} debugPanel.ViewModel
 * @parent <advance-nav>
 *
 * `<advance-nav>`'s viewModel.
 */
export let AdvanceNavVM = DefineMap.extend('AdvanceNavVM', {
  appState: {},
  myProgressOptions: {
    get () {
      const options = [{name: 'hhhhh'}, {name: 'jjjjjjj'}, {name: 'bbbbbb'}]

      return new DefineList(options)
    }
  },

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
    console.log(pageName, 'page')
  },

  connectedCallback (el) {
    return () => {
    }
  }
})

export default Component.extend({
  view: template,
  ViewModel: AdvanceNavVM,
  tag: 'advance-nav',

  helpers: {
  }
})
