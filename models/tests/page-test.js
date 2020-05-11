import { assert } from 'chai'
import Page from 'caja/viewer/models/page'

import 'steal-mocha'

describe('Page Model', function () {
  it('find', function () {
    let page = new Page({
      name: '1-Introduction'
    })
    let pages = new Page.List()

    pages.push(page)
    assert.equal(pages.find('1-Introduction'), page, 'page found by name')
  })

  it('hasUserGenderOrAvatarField - whether page has an "user gender" field', function () {
    let page = new Page({ fields: [{ name: 'Foo Bar' }] })
    assert.isFalse(page.attr('hasUserGenderOrAvatarField'))

    page = new Page({ fields: [{ name: 'User Gender' }] })
    assert.isTrue(page.attr('hasUserGenderOrAvatarField'))
  })
})
