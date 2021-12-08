import Component from 'can-component'
import template from './footer.stache'
import DefineMap from 'can-define/map/map'
import version from './footerVersion'
import moment from 'moment'

import 'can-map-define'

export const FooterVM = DefineMap.extend('FooterVM', {
  // passed in from desktop.stache
  appState: {},

  viewerVersion: {
    get () {
      return 'A2J ' + version.number + '-' + version.date
    }
  },
  currentYear: {
    get () {
      return moment().year()
    }
  },
  // Used to hide status updates in Author preview mode
  showCAJAStatus: {
    get () {
      return !this.appState.previewActive
    }
  }
})

export default Component.extend({
  view: template,
  ViewModel: FooterVM,
  leakScope: false,
  tag: 'app-footer'
})
