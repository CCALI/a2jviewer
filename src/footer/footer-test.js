import { assert } from 'chai'
import 'steal-mocha'

import { FooterVM } from '~/src/footer/'

describe('<a2j-viewer-steps>', function () {
  let vm
  beforeEach(() => {
    vm = new FooterVM()
  })
  describe('ViewModel', function () {
    it('viewerVersion', () => {
      assert.equal(typeof vm.viewerVersion, 'string', 'should create the viewerVersion')
    })
  })
})
