import { assert } from 'chai'
import { ViewerPreviewVM } from './preview'
import 'steal-mocha'
import Interview from '~/src/models/interview'
import Answers from '~/src/models/answers'
import PersistedState from '~/src/models/persisted-state'
import AppState from '~/src/models/app-state'
import _assign from 'lodash/assign'
import interviewJSON from '@caliorg/a2jdeps/models/fixtures/real_interview_1.json'

describe('<a2j-viewer-preview>', function () {
  describe('viewModel', function () {
    let vm = null

    describe('connectedCallback()', function () {
      beforeEach(function () {
        const previewInterview = new Interview({ steps: [] })
        const rawData = _assign({}, interviewJSON)
        const parsedData = Interview.parseModel(rawData)
        const interview = new Interview(parsedData)

        vm = new ViewerPreviewVM({
          previewInterview,
          interview
        })
      })

      it('generates new answers from vars if no previewInterview', () => {
        // emulate first run or previewInterview clear from Interviews tab
        vm.attr('previewInterview', undefined)
        const expectedAnswer = Object.keys(interviewJSON.vars)
        const appState = new AppState()
        const pState = new PersistedState()
        const newAnswers = Object.keys(vm.setAnswers(pState, appState, vm.interview))
        assert.deepEqual(expectedAnswer, newAnswers, 'connectedCallback should make new answers from vars')
      })

      it('restores answers from previewInterview', () => {
        vm.attr('previewInterview.answers').varCreate('someAnswer')
        const expectedAnswer = new Answers({
          'someanswer': {
            name: 'someAnswer',
            values: [null]
          }
        })
        const appState = new AppState()
        const pState = new PersistedState()
        assert.deepEqual(expectedAnswer, vm.setAnswers(pState, appState, vm.interview), 'connectedCallback should make new answers from vars')
      })

      it('renders the first page without A2J Resume Page and previewPageName', () => {
        const expectedPage = '01-Introduction'
        assert.equal(expectedPage, vm.getStartPage(vm.interview), 'should render the first page')
      })

      it('renders the preview page from QDE', () => {
        vm.attr('previewPageName', 'foo')
        const expectedPage = 'foo'
        assert.equal(expectedPage, vm.getStartPage(vm.interview), 'should render the first page')
      })

      it('renders the last page saved before exiting', () => {
        const visitedPages = [
          { text: 'Welcome to the interview', step: { number: '0' }, questionNumber: 1, repeatVarValue: undefined },
          { text: 'Enter your info, as this is a very long question text', step: { number: '0' }, questionNumber: 2, repeatVarValue: 1 }
        ]
        const answers = new Answers()
        const appState = new AppState()
        appState.visitedPages = visitedPages
        answers.varCreate('A2J Resume Page')
        answers.varSet('A2J Resume Page', 'resumePageName')
        vm.interview.attr('answers', answers)
        const expectedPage = 'resumePageName'
        assert.equal(expectedPage, vm.getStartPage(vm.interview, appState), 'should render the page set in A2J Resume Page variable')
      })
    })
  })
})
