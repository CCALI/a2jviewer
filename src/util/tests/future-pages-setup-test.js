import { assert } from 'chai'
import { isFieldRequired, hasGoToLogic } from '../future-pages-setup'
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
    assert.equal(isFieldRequired(fieldModel), true, 'should return true if the field is required')
  })

  it('has code before GoTo Logic', function () {
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
    assert.equal(hasGoToLogic(page), true, 'should return true if the page has any goto logic')
  })
  it('has code after GoTo Logic', function () {
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
    assert.equal(hasGoToLogic(page), true, 'should return true if the page has any goto logic')
  })
})
