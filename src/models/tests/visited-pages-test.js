import { assert } from 'chai'
import DefineMap from 'can-define/map/map'
import VisitedPages from '~/src/models/visited-pages'
import Page from '~/src/models/page'
import Interview from '~/src/models/interview'
import Logic from '~/src/mobile/util/logic'
import Answers from '~/src/models/answers'

// import '@caliorg/a2jdeps/models/fixtures/' // Interview.findOne({ url: '/interview.json' })

import 'steal-mocha'

describe('VisitedPages Model', function () {
  let visitedPages
  let interview
  let answers
  let logic
  let page
  let page2
  let page3
  let page3alt
  let page4

  beforeEach(function () {
    page = new Page({
      name: '01-Frost Walker',
      fields: [
        { name: 'firstname', type: 'text' },
        { name: 'lastname', type: 'text' }
      ],
      buttons: [{
        label: 'Continue',
        next: '02-Roads in the Yellow Wood'
      }]
    })
    page2 = new Page({
      name: page.buttons[0].next,
      fields: [
        { name: 'firstname', type: 'text' },
        { name: 'lastname', type: 'text' }
      ],
      buttons: [{
        label: 'Follow the crowd',
        next: '03-Common Path'
      }, {
        label: 'Use the road less traveled by',
        next: '03-All the difference'
      }]
    })
    page3 = new Page({
      name: page2.buttons[0].next,
      fields: [
        { name: 'firstname', type: 'text' },
        { name: 'lastname', type: 'text' }
      ],
      buttons: [{
        label: 'Continue',
        next: '04-Destiny'
      }]
    })
    page3alt = new Page({
      name: page2.buttons[1].next,
      fields: [
        { name: 'firstname', type: 'text' },
        { name: 'lastname', type: 'text' }
      ],
      buttons: [{
        label: 'Continue',
        next: '04-Destiny'
      }]
    })
    page4 = new Page({
      name: page3alt.buttons[0].next,
      fields: [
        { name: 'firstname', type: 'text' },
        { name: 'lastname', type: 'text' }
      ],
      buttons: []
    })
    interview = new Interview({
      pages: [page, page2, page3, page3alt, page4],
      firstPage: page.name // hydrate needs this
    })
    answers = new Answers()
    interview.attr('answers', answers)
    logic = new Logic({ interview })

    const sharedRefs = new DefineMap({ interview, logic, answers })
    visitedPages = new VisitedPages()
    visitedPages.assign({ sharedRefs })
  })

  it('works', function () {
    assert.ok(visitedPages, 'visitedPages can be initialized')
    assert.equal(visitedPages.length, 0, 'the underlying list is empty')
    assert.equal(visitedPages.root, undefined, 'there is no root')
    assert.equal(visitedPages.activeLeaf, undefined, 'there is no activeLeaf')
    assert.equal(visitedPages.selected, undefined, 'there is no selected node')
  })

  it('can visit a page', function () {
    visitedPages.visit(page)
    assert.equal(visitedPages.length, 1, 'can visit a page')
    assert.ok(visitedPages.root, 'visiting the first page sets the tree\'s root')
    // the standard JS linting consensus is wrong regarding " vs ' b/c ^ is so common. CSS and HTML are already #teamDoubleQuote too. :(
    assert.equal(visitedPages.activeLeaf, visitedPages.root, 'activeLeaf is also set and === the root when there\'s one page')
    assert.equal(visitedPages.selected, visitedPages.root, 'selected is auto set to the root on first visit()')
    assert.equal(visitedPages.hasNext, false, 'visited pages knows there\'s no future without further action')
    assert.equal(visitedPages.hasParent, false, 'the current visited page has no past, as it is the root')
    assert.equal(visitedPages.activeList[0], visitedPages.root, 'an active list can be generated and should begin at the root')
    assert.equal(visitedPages.activeList.length, 1, 'the current active list only contains one item')
  })

  it('can visit multiple pages', function () {
    visitedPages.visit(page)
    visitedPages.visit(page2)
    visitedPages.visit(page3, 0)
    assert.equal(visitedPages.length, 3, 'can visit multiple pages')
    assert.equal(visitedPages.root.interviewPage.name, page.name, 'the first page is always the tree\'s root')
    assert.notEqual(visitedPages.activeLeaf, visitedPages.root, 'activeLeaf is also set and !== the root')
    assert.equal(visitedPages.activeLeaf.interviewPage.name, page3.name, 'the last visited page is the tree\'s activeLeaf')
    assert.equal(visitedPages.selected, visitedPages.activeLeaf, 'selected is auto set to the last visit()ed page')
    assert.equal(visitedPages.hasNext, false, 'visited pages knows there\'s no future without further action')
    assert.equal(visitedPages.hasParent, true, 'the current visited page has a past where it followed the crowd')
  })

  it('can time travel', function () {
    visitedPages.visit(page)
    visitedPages.visit(page2)
    visitedPages.visit(page3, 0)

    const currentActiveLeaf = visitedPages.activeLeaf
    assert.equal(visitedPages.selected, currentActiveLeaf, 'selected is auto set to the last visit()ed page')

    visitedPages.selected = { setActive: () => {} }
    assert.equal(visitedPages.selected, undefined, 'selected cannot be set to a node not already in the tree')
    visitedPages.selected = currentActiveLeaf
    assert.equal(visitedPages.selected, currentActiveLeaf, 'selected can be set to a node already in the tree')

    visitedPages.selected = visitedPages.root.nextVisitedPage
    assert.notEqual(visitedPages.selected, currentActiveLeaf, 'selected can be set directly to any node already in the tree')
    assert.equal(visitedPages.selected, visitedPages.root.nextVisitedPage, 'selected is correct')
    assert.equal(visitedPages.length, 3, 'Still only 3 pages have been visited')
    assert.equal(visitedPages.activeList.length, 3, 'Still only 3 pages are in the active timeline branches')
    assert.equal(visitedPages.activeLeaf, currentActiveLeaf, 'the last visited page is still the tree\'s activeLeaf')
    assert.equal(visitedPages.root.interviewPage.name, page.name, 'the first page is still always the tree\'s root')
    assert.equal(visitedPages.hasNext, true, 'visited pages has already been to the future')
    assert.equal(visitedPages.hasParent, true, 'the current visited page has a past')
    assert.equal(visitedPages.selected.parentVisitedPage, visitedPages.root, '...and that past is the root.')

    let successfulTimeTravel = visitedPages.selectNext()
    assert.ok(successfulTimeTravel, 'we\'ve gone back to the future')
    assert.equal(visitedPages.selected, visitedPages.activeLeaf, 'selected can be set to the next page with selectNext()')

    successfulTimeTravel = visitedPages.selectNext()
    assert.notOk(successfulTimeTravel, 'there is no future')
    assert.equal(visitedPages.selected, visitedPages.activeLeaf, 'selected didn\'t change')

    successfulTimeTravel = visitedPages.selectParent()
    successfulTimeTravel = visitedPages.selectParent()
    assert.ok(successfulTimeTravel, 'what is this, 1885?')
    assert.equal(visitedPages.selected, visitedPages.root, 'Great Scott!')
    successfulTimeTravel = visitedPages.selectParent()
    assert.notOk(successfulTimeTravel, 'there is no past')
    assert.equal(visitedPages.selected, visitedPages.root, 'the present determines the past, and this present has no past')
  })

  it('can cause branches in the timeline when the past is changed', function () {
    visitedPages.visit(page)
    visitedPages.visit(page2)
    visitedPages.visit(page3, 0)
    const hereWeWere = visitedPages.selected
    visitedPages.selected = visitedPages.root
    visitedPages.visit(page2)
    visitedPages.visit(page3, 0)
    assert.equal(visitedPages.length, 3, 'Reliving the past, repeating your actions, doing the same thing again, changes nothing.')
    assert.equal(hereWeWere, visitedPages.selected, '...back when we already are')

    visitedPages.selectParent()
    visitedPages.visit(page3alt, 1)
    const al = visitedPages.activeList
    assert.equal(visitedPages.length, 4, 'if we alter the past and cause a new future, the original perspective still exists.')
    assert.equal(al.indexOf(hereWeWere), -1, '...but it isn\'t actively relevant')
    assert.equal(al.length, 3, 'only what\'s relevant to your present exists in your past')
    assert.equal(al[0], visitedPages.activeLeaf, 'where we are is where we are')
    assert.equal(al[2], visitedPages.root, 'where we were is where we were')
    const theRoadLessTraveled = visitedPages.selected
    assert.notEqual(hereWeWere, theRoadLessTraveled, 'all the difference')

    visitedPages.selected = hereWeWere
    assert.equal(visitedPages.activeList.indexOf(hereWeWere), 0, 'variant timelines can be visited too')
    assert.equal(visitedPages.activeList.indexOf(theRoadLessTraveled), -1, 'variants aren\'t pruned, they just aren\'t active')
    visitedPages.selected = theRoadLessTraveled
    assert.equal(visitedPages.activeList.indexOf(theRoadLessTraveled), 0, 'inactive branches are the roads untaken')
  })

  it('knows convergent destiny pages are distinct', function () {
    visitedPages.visit(page)
    visitedPages.visit(page2)
    const page2Visited = visitedPages.selected
    visitedPages.visit(page3, 0)
    visitedPages.visit(page4, 0) // button index param required - in app it's always passed in if one was used
    const destinyAfterTheRoadNotTaken = visitedPages.selected
    visitedPages.selected = page2Visited
    visitedPages.visit(page3alt, 1)
    visitedPages.visit(page4, 0) // button index param required - in app it's always passed in if one was used
    const destinyAfterTheRoadLessTaken = visitedPages.selected
    assert.equal(visitedPages.length, 6, 'when branched timelines converge, that page exists twice in the tree')
    assert.notEqual(destinyAfterTheRoadNotTaken, destinyAfterTheRoadLessTaken, 'the converged nodes are distinct')
    assert.equal(destinyAfterTheRoadNotTaken.interviewPage, destinyAfterTheRoadLessTaken.interviewPage, '...but point to the same page')
    assert.equal(destinyAfterTheRoadNotTaken.interviewPage, page4, '...and that page is page4')
  })

  const expectedSerialization = [
    {
      'interviewPage': '01-Frost Walker',
      'key': '---'
    },
    {
      'interviewPage': '02-Roads in the Yellow Wood',
      'parentVisitedPage': 0
    },
    {
      'interviewPage': '03-Common Path',
      'parentVisitedPage': 1,
      'parentButtonUsedIndex': 0
    },
    {
      'interviewPage': '04-Destiny',
      'parentVisitedPage': 2,
      'parentButtonUsedIndex': 0
    },
    {
      'interviewPage': '03-All the difference',
      'parentVisitedPage': 1,
      'parentButtonUsedIndex': 1,
      'selected': true
    },
    {
      'interviewPage': '04-Destiny',
      'parentVisitedPage': 4,
      'parentButtonUsedIndex': 0
    }
  ]
  it('correctly serializes', function () {
    visitedPages.visit(page)
    visitedPages.visit(page2)
    visitedPages.visit(page3, 0)
    visitedPages.visit(page4, 0)
    visitedPages.selectParent()
    visitedPages.selectParent()
    visitedPages.visit(page3alt, 1)
    visitedPages.visit(page4, 0)
    visitedPages.selectParent()
    const serialized = JSON.parse(JSON.stringify(visitedPages.serialize())) // JSON bits remove keys set to undefined so deepEqual works
    assert.equal(serialized.length, 6, 'serialized correct number of nodes')
    assert.deepEqual(serialized, expectedSerialization)
  })

  it('correctly hydrates', function () {
    visitedPages.hydrate(expectedSerialization)
    assert.equal(visitedPages.hydrate(expectedSerialization), true)
    assert.equal(visitedPages.length, 6)
    assert.equal(visitedPages.activeList.length, 4)
    assert.equal(visitedPages.root.interviewPage, page)
    assert.equal(visitedPages.root.nextVisitedPage.interviewPage, page2)
    assert.equal(visitedPages.root.nextVisitedPage.nextVisitedPage.interviewPage, page3alt)
    assert.equal(visitedPages.selected.interviewPage, page3alt)
    assert.equal(visitedPages.selected.nextVisitedPage.interviewPage, page4)
    assert.equal(visitedPages.selected.parentVisitedPage.branches[0].interviewPage, page3)
    assert.equal(visitedPages.selected.parentVisitedPage.branches[0].nextVisitedPage.interviewPage, page4)
    assert.notEqual(
      visitedPages.selected.nextVisitedPage,
      visitedPages.selected.parentVisitedPage.branches[0].nextVisitedPage
    )
    assert.equal(
      visitedPages.selected.nextVisitedPage.interviewPage,
      visitedPages.selected.parentVisitedPage.branches[0].nextVisitedPage.interviewPage
    )

    // hydrating again wipes visitedPages and rebuilds it again
    assert.equal(visitedPages.hydrate(expectedSerialization), true)
    assert.equal(visitedPages.length, 6)

    interview.attr('publishedVersion', '999999') // key won't match, hydrate won't allow it
    assert.equal(visitedPages.hydrate(expectedSerialization), false)
    assert.equal(visitedPages.length, 0)
  })
})
