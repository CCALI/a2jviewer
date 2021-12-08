import { assert } from 'chai'
import FuturePages from '~/src/models/future-pages'
import Page from '~/src/models/page'

import 'steal-mocha'

describe('FuturePages Model', function () {
  it('works', function () {
    const page = new Page({
      name: 'fooPage',
      fields: [
        { name: 'firstname', type: 'text' },
        { name: 'lastname', type: 'text' }
      ],
      buttons: [{
        label: 'Continue',
        next: '02-Your name'
      }]
    })
    const page2 = new Page({
      name: page.buttons[0].next,
      fields: [
        { name: 'firstname', type: 'text' },
        { name: 'lastname', type: 'text' }
      ],
      buttons: [{
        label: 'Continue',
        next: '03-Their name'
      }]
    })
    const pagesByName = {
      [page.name]: page,
      [page.buttons[0].next]: page2,
      [page2.buttons[0].next]: {}
    }
    const futurePages = new FuturePages({
      interviewPage: page,
      interviewPagesByName: pagesByName
    })
    assert.equal(futurePages.hasStopper, false, 'should not have a stopper')
    assert.equal(futurePages.nextPageName, page.buttons[0].next, 'knows the next page name')
    assert.equal(futurePages.nextInterviewPage, page2, 'future page is returned')
    const allFuturePagesFromHere = futurePages.futureInterviewPages
    assert.equal(allFuturePagesFromHere.length, 2, 'knows the future until stopper')
    assert.equal(allFuturePagesFromHere[0].hasStopper, false, 'next page should not have a stopper')
    assert.equal(allFuturePagesFromHere[1].hasStopper, true, 'last page should have a stopper')
  })

  it('stops at a required field', function () {
    const requiredField = {
      name: 'firstname',
      type: 'text',
      repeating: false,
      values: [null],
      required: true
    }
    const page = new Page({
      name: 'fooPage',
      fields: [
        { name: 'firstname', type: 'text' },
        { name: 'lastname', type: 'text' }
      ],
      buttons: [{
        label: 'Continue',
        next: '02-Your name'
      }]
    })
    const page2 = new Page({
      name: page.buttons[0].next,
      fields: [
        requiredField,
        { name: 'lastname', type: 'text' }
      ],
      buttons: [{
        label: 'Continue',
        next: '03-Their name'
      }]
    })
    const pagesByName = {
      [page.name]: page,
      [page.buttons[0].next]: page2,
      [page2.buttons[0].next]: {}
    }
    const futurePages = new FuturePages({
      interviewPage: page,
      interviewPagesByName: pagesByName
    })
    assert.equal(futurePages.futureInterviewPages.length, 1, 'stopped at required field')
  })

  it('stops at a required field on first page', function () {
    const requiredField = {
      name: 'firstname',
      type: 'text',
      repeating: false,
      values: [null],
      required: true
    }
    const page = new Page({
      name: 'fooPage',
      fields: [
        requiredField,
        { name: 'lastname', type: 'text' }
      ],
      buttons: [{
        label: 'Continue',
        next: '02-Your name'
      }]
    })
    const page2 = new Page({
      name: page.buttons[0].next,
      fields: [
        { name: 'firstname', type: 'text' },
        { name: 'lastname', type: 'text' }
      ],
      buttons: [{
        label: 'Continue',
        next: '03-Their name'
      }]
    })
    const pagesByName = {
      [page.name]: page,
      [page.buttons[0].next]: page2,
      [page2.buttons[0].next]: {}
    }
    const futurePages = new FuturePages({
      interviewPage: page,
      interviewPagesByName: pagesByName
    })
    assert.equal(futurePages.futureInterviewPages.length, 0, 'stopped at required field')
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
    const pagesByName = {
      [page.name]: page,
      [page.buttons[0].next]: {}
    }
    const futurePages = new FuturePages({
      interviewPage: page,
      interviewPagesByName: pagesByName
    })
    assert.equal(futurePages.futureInterviewPages.length, 0, 'stopped at page with codeBefore logic')
    assert.equal(futurePages.hasPageLogic, true, 'should return true if the page has codeBefore logic')
  })

  it('handles codeAfter Logic', function () {
    const page = new Page({
      name: 'fooPage',
      fields: [
        { name: 'firstname', type: 'text' },
        { name: 'lastname', type: 'text' }
      ],
      buttons: [{
        label: 'Continue',
        next: '02-Your name'
      }]
    })
    const page2 = new Page({
      name: page.buttons[0].next,
      codeAfter: 'GO TO',
      fields: [
        { name: 'firstname', type: 'text' },
        { name: 'lastname', type: 'text' }
      ],
      buttons: [{
        label: 'Continue',
        next: '03-Their name'
      }]
    })
    const pagesByName = {
      [page.name]: page,
      [page.buttons[0].next]: page2,
      [page2.buttons[0].next]: {}
    }
    const futurePages = new FuturePages({
      interviewPage: page,
      interviewPagesByName: pagesByName
    })
    assert.equal(futurePages.hasPageLogic, false, 'should return false if the page has no logic')
    const allFuturePagesFromHere = futurePages.futureInterviewPages
    assert.equal(allFuturePagesFromHere.length, 1, 'stopped at page with codeAfter logic')
    assert.equal(allFuturePagesFromHere[0].hasPageLogic, true, 'should return true if the page has codeAfter logic')
  })
})
