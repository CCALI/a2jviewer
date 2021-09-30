import { assert } from 'chai'
import { hasRequiredField, hasPageLogic } from '../future-pages-setup'
import Page from '~/src/models/page'

import 'steal-mocha'

describe('future pages setup', function () {
  it('has a required field', function () {
    const fieldModel = [{
      name: 'firstname',
      type: 'text',
      repeating: false,
      values: [null],
      required: true
    }]
    assert.equal(hasRequiredField(fieldModel), true, 'should return true if the field is required')
  })

  it('handles codeBefore Logic', function () {
    const page = new Page({
      name: 'fooPage',
      codeBefore: 'GO TO',
      fields: [
        { name: 'firstname', type: 'text' },
        { name: 'lastname', type: 'text' }
      ],
      buttons: [{
        label: 'Continue',
        next: '02-Your name'
      }]
    })
    assert.equal(hasPageLogic(page), true, 'should return true if the page has codeBefore logic')
  })
  it('handles CodeAfter Logic', function () {
    const page = new Page({
      name: 'fooPage',
      codeAfter: 'GO TO',
      fields: [
        { name: 'firstname', type: 'text' },
        { name: 'lastname', type: 'text' }
      ],
      buttons: [{
        label: 'Continue',
        next: '02-Your name'
      }]
    })
    assert.equal(hasPageLogic(page), true, 'should return true if the page has CodeAfter Logic')
  })
})
