import { assert } from 'chai'
import MemoryState from 'caja/viewer/models/memory-state'

import 'steal-mocha'

describe('MemoryState model', function () {
  it('xml to json suffix', function () {
    let mState = new MemoryState({
      templateURL: 'foo.xml'
    })

    let templateURL = mState.attr('templateURL')

    assert.equal(templateURL, 'foo.json', 'suffix is modified correctly')
    assert.notEqual(templateURL, 'foo.xml', 'suffix is modified incorrectly')
  })
})
