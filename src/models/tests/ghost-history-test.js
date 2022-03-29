import { assert } from 'chai'
import GhostHistory from '~/src/models/ghost-history'

import 'steal-mocha'

describe('GhostHistory Model', function () {
  let serializedVisitedPages
  let ghostHistory

  beforeEach(function () {
    serializedVisitedPages = [
      {
        interviewPage: '1-Introduction',
        key: 'A Nested Loop with inner multi vars-45-1/30/2017-'
      },
      {
        interviewPage: '2-Name',
        repeatVarValue: 1,
        parentVisitedPage: 0,
        parentButtonUsedIndex: 0
      },
      {
        interviewPage: '3-Gender',
        repeatVarValue: 11,
        outerLoopVarValue: 1,
        parentVisitedPage: 1,
        parentButtonUsedIndex: 0
      },
      {
        interviewPage: '1-Last Name',
        repeatVarValue: 11,
        outerLoopVarValue: 1,
        parentVisitedPage: 2,
        parentButtonUsedIndex: 0
      },
      {
        interviewPage: '2-Date',
        repeatVarValue: 11,
        outerLoopVarValue: 1,
        parentVisitedPage: 3,
        parentButtonUsedIndex: 0
      },
      {
        interviewPage: '3-TF is the answer',
        repeatVarValue: 11,
        outerLoopVarValue: 1,
        parentVisitedPage: 4,
        parentButtonUsedIndex: 0
      },
      {
        interviewPage: '4-Salary',
        repeatVarValue: 11,
        outerLoopVarValue: 1,
        parentVisitedPage: 5,
        parentButtonUsedIndex: 0
      },
      {
        interviewPage: '2-Name',
        repeatVarValue: 2,
        parentVisitedPage: 6,
        parentButtonUsedIndex: 0
      },
      {
        interviewPage: '3-Gender',
        repeatVarValue: 21,
        outerLoopVarValue: 2,
        parentVisitedPage: 7,
        parentButtonUsedIndex: 0
      },
      {
        interviewPage: '1-Last Name',
        repeatVarValue: 21,
        outerLoopVarValue: 2,
        parentVisitedPage: 8,
        parentButtonUsedIndex: 0
      },
      {
        interviewPage: '2-Date',
        repeatVarValue: 21,
        outerLoopVarValue: 2,
        parentVisitedPage: 9,
        parentButtonUsedIndex: 0,
        skipped: true
      },
      {
        interviewPage: '3-TF is the answer',
        repeatVarValue: 21,
        outerLoopVarValue: 2,
        parentVisitedPage: 10,
        parentButtonUsedIndex: 0,
        skipped: true
      },
      {
        interviewPage: '4-Salary',
        repeatVarValue: 21,
        outerLoopVarValue: 2,
        parentVisitedPage: 11,
        parentButtonUsedIndex: 0,
        selected: true
      },
      {
        interviewPage: '6-Answer',
        parentVisitedPage: 12,
        parentButtonUsedIndex: 1
      },
      {
        interviewPage: '2-Name',
        repeatVarValue: 3,
        parentVisitedPage: 12,
        parentButtonUsedIndex: 0
      },
      {
        interviewPage: '3-Gender',
        repeatVarValue: 31,
        outerLoopVarValue: 3,
        parentVisitedPage: 14,
        parentButtonUsedIndex: 0
      },
      {
        interviewPage: '1-Last Name',
        repeatVarValue: 31,
        outerLoopVarValue: 3,
        parentVisitedPage: 15,
        parentButtonUsedIndex: 0
      },
      {
        interviewPage: '2-Date',
        repeatVarValue: 31,
        outerLoopVarValue: 3,
        parentVisitedPage: 16,
        parentButtonUsedIndex: 0,
        skipped: true
      },
      {
        interviewPage: '3-TF is the answer',
        repeatVarValue: 31,
        outerLoopVarValue: 3,
        parentVisitedPage: 17,
        parentButtonUsedIndex: 0,
        skipped: true
      },
      {
        interviewPage: '4-Salary',
        repeatVarValue: 31,
        outerLoopVarValue: 3,
        parentVisitedPage: 18,
        parentButtonUsedIndex: 0
      },
      {
        interviewPage: '6-Answer',
        parentVisitedPage: 19,
        parentButtonUsedIndex: 1
      }
    ]
    ghostHistory = new GhostHistory({ serializedVisitedPages })
  })

  it('works', function () {
    assert.ok(ghostHistory, 'ghostHistory can be initialized')
    assert.equal(ghostHistory.serializedVisitedPages.length, 21, 'keeps a reference to the serializedVisitedPages')
    assert.equal(ghostHistory.activeSerializedList.length, 20, 'activeSerializedList removes branched timelines from consideration')
    assert.equal(ghostHistory.expectNextPageNameToBe, '1-Introduction', 'knows the first page is what\'s expected')
    assert.equal(ghostHistory.finished, false, 'is waiting')
  })

  it('allows the first expected page to come later', function () {
    let rootReached = ghostHistory.nextActiveIndex > 0
    assert.equal(rootReached, false, 'has not reached expected page 1 yet')
    assert.equal(ghostHistory.expectNextPageNameToBe, '1-Introduction', 'knows the first page is what\'s expected')

    let fakeVP = { interviewPage: { name: '0-Page', buttons: [] } }
    let suggestion = ghostHistory.suggestNextButtonIndex(fakeVP)
    assert.equal(suggestion, undefined, 'has no suggestion for an unexpected first page')
    rootReached = ghostHistory.nextActiveIndex > 0
    assert.equal(rootReached, false, 'has not reached expected page 1 yet')
    assert.equal(ghostHistory.finished, false, 'has not given up yet')

    fakeVP = { interviewPage: { name: '1-Introduction', buttons: [{ next: 'foobar' }, { next: '2-Name' }] } }
    suggestion = ghostHistory.suggestNextButtonIndex(fakeVP)
    rootReached = ghostHistory.nextActiveIndex > 0
    assert.equal(rootReached, true, 'has reached expected page 1')
    assert.equal(suggestion, 1, 'has correct suggested button index for the 2nd page')
    assert.equal(ghostHistory.finished, false, 'is still active')
    assert.equal(ghostHistory.nextActiveIndex, 1, 'is tracking the index correctly')
    assert.equal(ghostHistory.expectNextPageNameToBe, '2-Name', 'correct next page expected')
  })

  it('suggests buttons until the end if it\'s a match', function () {
    const asl = ghostHistory.activeSerializedList
    const asllen = asl.length
    const fakeVPs = asl.map((svp, i) => {
      const next = asl[i + 1] || {}
      return { interviewPage: { name: svp.interviewPage, buttons: [{ next: next.interviewPage }] } }
    })
    asl.forEach((svp, i) => {
      assert.equal(ghostHistory.finished, false)
      assert.equal(ghostHistory.suggestNextButtonIndex(fakeVPs[i]), (i === asllen - 1) ? undefined : 0, i)
    })
    assert.equal(ghostHistory.finished, true, 'moved on; automatically finishes at the end of the ghost history')
  })

  it('finishes early if the user\'s navigation doesn\'t follow the active ghost history', function () {
    const asl = ghostHistory.activeSerializedList
    const fakeVPs = asl.map((svp, i) => {
      const next = asl[i + 1] || {}
      return { interviewPage: { name: svp.interviewPage, buttons: [{ next: next.interviewPage }] } }
    })
    for (let i = 0; i < 13; i++) {
      assert.equal(ghostHistory.suggestNextButtonIndex(fakeVPs[i]), 0)
      assert.equal(ghostHistory.finished, false)
    }
    assert.equal(ghostHistory.nextActiveIndex, 13)
    assert.equal(ghostHistory.expectNextPageNameToBe, '2-Name')
    const lessTraveledVP = {
      interviewPage: { name: '6-Answer', buttons: [] },
      parentVisitedPage: 12,
      parentButtonUsedIndex: 1
    }
    assert.equal(ghostHistory.suggestNextButtonIndex(lessTraveledVP), undefined)
    assert.equal(ghostHistory.finished, true)
  })
})
