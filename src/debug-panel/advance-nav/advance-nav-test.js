import { AdvanceNavVM } from './advance-nav'
import { assert } from 'chai'
// import app-state model

import 'steal-mocha'

describe('<author-debug-panel>', () => {
  describe('viewModel', () => {
    let vm

    beforeEach(() => {
      // setup new appState because appState:from="appState" in the stache/view
      vm = new AdvanceNavVM({{ appState }})
    })

    it('navPages', () => {
      // mock visitedPages: const visitedPages = [{somePage}, {someOtherPage}] -> satisfy the view/stache
      // navPages should be derived from visitedPages but reversed
      // length should be the same, can test that
      // push a new page into visitedPages, test navPages updates with the same new page (reversed of course)
    })

    it('stripHTMLTags', () => {
      let testText = '<p><br>some text %%[someVar TE]%% here</p>'
      const expectedResult = 'some text here'
      assert.equal(vm.stripHTMLTags(testText), expectedResult, 'should remove only html tags')

      testText = 'some other text'
      assert.equal(vm.stripHTMLTags(testText), expectedResult, 'should not affect text with no tags')
    })

    it('navToPage', () => {
      // this will likely test that the selectedIndex on appState has changed to match
      // because that's the way the MyProgress nav bar is wired up
    })
  })
})
