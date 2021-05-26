import { assert } from 'chai'
import { ViewerPreviewVM } from './preview'
import 'steal-mocha'
import Interview from '~/src/models/interview'
import Answers from '~/src/models/answers'

describe('<a2j-viewer-preview>', function () {
  describe('viewModel', function () {
    let vm = null

    describe('connectedCallback()', function () {
      let oldGuide

      beforeEach(function () {
        // save global
        oldGuide = window.gGuide
        // this is parsed to get vars
        window.gGuide = {
          vars: {
            someVar: { name: 'someVar', type: 'Text', values: [null] }
          }
        }

        const previewAnswers = new Answers()
        const previewInterview = new Interview({ steps: [] })
        const interview = new Interview({ steps: [] })

        vm = new ViewerPreviewVM({
          previewInterview,
          interview
        })
      })

      afterEach(function () {
        // restore global
        window.gGuide = oldGuide
      })

      it('generates new answers from vars if no previewInterview', () => {
        const el = []
        // emulate first run or previewInterview clear from Interviews tab
        vm.attr('previewInterview', undefined)

        const expectedAnswerKeys = [ 'somevar' ]
        const previewCleanup = vm.connectedCallback(el)
        const connectedCallbackAnswerKeys = Object.keys(vm.attr('interview.answers')._data)

        assert.deepEqual(expectedAnswerKeys, connectedCallbackAnswerKeys, 'connectedCallback should make new answers from vars')
        previewCleanup()
      })

      it('restores answers from previewInterview', () => {
        const testAnswer = vm.attr('previewAnswers').varCreate('someAnswer')
        const el = []
        const expectedAnswerKeys = [ 'someAnswer' ]
        const previewCleanup = vm.connectedCallback(el)
        const connectedCallbackAnswerKeys = Object.keys(vm.attr('interview.answers')._data)

        assert.deepEqual(expectedAnswerKeys, connectedCallbackAnswerKeys, 'connectedCallback should make new answers from vars')
        previewCleanup()
      })
    })
  })
})
