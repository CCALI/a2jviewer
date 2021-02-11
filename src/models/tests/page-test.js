import { assert } from 'chai'
import Page from '~/src/models/page'
import DefineMap from 'can-define/map/map'
import Field from '~/src/models/field'

import 'steal-mocha'

describe('Page Model', function () {
  it('forces Types', function () {
    const page = new Page()
    const step = { name: 'intro', number: '0' }
    const fields = [{ name: 'foo' }]
    page.step = step
    page.fields = fields
    const isDefineMap = page.step instanceof DefineMap
    const isFieldList = page.fields instanceof Field.List
    assert.isTrue(isDefineMap, 'should coerce POJO step to DefineMap')
    assert.isTrue(isFieldList, 'should coerce POJO fields array to Field.List')
  })

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
    assert.isFalse(page.hasUserGenderOrAvatarField)

    page = new Page({ fields: [{ name: 'User Gender' }] })
    assert.isTrue(page.hasUserGenderOrAvatarField)
  })
})
