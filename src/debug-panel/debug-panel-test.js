import { DebugPanelVM } from './debug-panel'
import { assert } from 'chai'

import 'steal-mocha'

describe('<author-debug-panel>', () => {
  describe('viewModel', () => {
    let vm = new DebugPanelVM()
    it('traceFormat', () => {
      assert.equal(vm.traceMessage)
    })
  })
})
