import DefineMap from 'can-define/map/map'
// import CanList from 'can-list'
// import DefineList from 'can-define/list/list'
import Component from 'can-component'
import template from './advance-panel.stache'

/**
 * @property {DefineMap} debugPanel.ViewModel
 * @parent <advance-panel>
 *
 * `<advance-panel>`'s viewModel.
 */
export let AdvancePanelVM = DefineMap.extend('AdvancePanelVM', {
  appState: {}
})

export default Component.extend({
  view: template,
  ViewModel: AdvancePanelVM,
  tag: 'advance-panel'
})
