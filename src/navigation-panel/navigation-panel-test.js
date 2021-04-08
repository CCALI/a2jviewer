import { NavigationPanelVM } from './navigation-panel'
import { assert } from 'chai'
// import app-state model
import AppState from '~/src/models/app-state'
import 'steal-mocha'

describe('<navigation-panel>', () => {
  describe('viewModel', () => {
    let vm
    let appState
    const visitedPages = [
      {text: 'Introduction', name: 'First Page', step: {number: '0'}},
      {text: 'Tell us more', name: 'Second Page', step: {number: '1'}}
    ]

    beforeEach(() => {
      // setup new appState because appState:from="appState" in the stache/view
      appState = new AppState({ visitedPages })
      vm = new NavigationPanelVM({ appState })
    })

    it('navPages', () => {
      // mock visitedPages: const visitedPages = [{somePage}, {someOtherPage}] -> satisfy the view/stache
      // navPages should be derived from visitedPages but reversed
      // length should be the same, can test that
      // push a new page into visitedPages, test navPages updates with the same new page (reversed of course)
      vm.appState.visitedPages.push({text: 'Test Page', name: 'Third Page', step: {number: '2'}})
      const expectedResult = [
        {text: 'Introduction', name: 'First Page', step: {number: '0'}},
        {text: 'Tell us more', name: 'Second Page', step: {number: '1'}},
        {text: 'Test Page', name: 'Third Page', step: {number: '2'}}
      ]
      assert.equal(vm.navPages.length, vm.appState.visitedPages.length, 'should be the same as visitedPages')
      assert.deepEqual(vm.navPages.reverse(), expectedResult, 'should be the same as visitedPages')
    })

    it('stripHTMLTags', () => {
      const expectedResult = 'some text %%[someVar TE]%% here'
      let testText = '<p><br>some text %%[someVar TE]%% here</p>'
      assert.equal(vm.stripHTMLTags(testText), expectedResult, 'should remove only html tags')

      // let testText = 'some other text'
      // assert.equal(vm.stripHTMLTags(testText), expectedResult, 'should not affect text with no tags')
    })

    it('navToPage', () => {
      // initialize selectedIndex value in the callback
      vm.connectedCallback()

      // when user selects the page from advance-nav we update the appstate.selectedPageIndex
      // this dispatches an event 'selectedPageIndexSet'
      const expectedResult = 0
      assert.equal(vm.navToPage(vm.appState.visitedPages[0].name), expectedResult, 'should be the same index')

      // this will likely test that the selectedIndex on appState has changed to match
      // because that's the way the MyProgress nav bar is wired up
    })
  })
})
