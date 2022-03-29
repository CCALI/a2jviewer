import { assert } from 'chai'
import MemoryState from '~/src/models/memory-state'

import 'steal-mocha'

describe('MemoryState model', function () {
  it('xml to json suffix', function () {
    const mState = new MemoryState({
      templateURL: 'foo.xml'
    })

    const templateURL = mState.attr('templateURL')

    assert.equal(templateURL, 'foo.json', 'suffix is modified correctly')
    assert.notEqual(templateURL, 'foo.xml', 'suffix is modified incorrectly')
  })
})
