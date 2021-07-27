import { SlideoutContentVM } from './slideout-content'
import 'steal-mocha'
import { assert } from 'chai'

describe('<author-slideout-content>', () => {
  it('basic test', () => {
    let vm = SlideoutContentVM()
    assert.isTrue(vm instanceof SlideoutContentVM, 'should be an instance of slideout VM')
  })
})
