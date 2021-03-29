import { assert } from 'chai'
import { ViewerPreviewVM } from './preview'
import Interview from '~/src/models/interview'
import 'steal-mocha'

describe('<a2j-viewer-preview>', function () {
  describe('viewModel', function () {
    let vm = null

    describe('connectedCallback()', function () {
      beforeEach(function () {
        // this is parsed to get vars
        window.gGuide = {
          title: 'smashing interview',
          sendfeedback: false,
          vars: {
            someVar: { name: 'someVar', type: 'Text', values: [null] }
          }
        }
        vm = new ViewerPreviewVM({
          previewInterview: new Interview({
            answers: {
              someAnswer: {
                name: 'someAnswer',
                values: [null, 'foo']
              }
            }
          }),
          interview: new Interview({
            answers: {},
            steps: []
          })
        })
      })

      it('generates new answers from vars if no previewInterview', () => {
        const el = []
        // emulate first run or previewInterview clear from Interviews tab
        vm.previewInterview = undefined

        const expectedAnswerKeys = [ 'somevar' ]
        const previewCleanup = vm.connectedCallback(el)
        const connectedCallbackAnswerKeys = Object.keys(vm.interview.attr('answers').serialize())

        assert.deepEqual(expectedAnswerKeys, connectedCallbackAnswerKeys, 'connectedCallback should make new answers from vars')
        previewCleanup()
      })

      it('restores answers from previewInterview', () => {
        const el = []
        const expectedAnswerKeys = [ 'someAnswer' ]
        const previewCleanup = vm.connectedCallback(el)
        const connectedCallbackAnswerKeys = Object.keys(vm.interview.attr('answers').serialize())

        assert.deepEqual(expectedAnswerKeys, connectedCallbackAnswerKeys, 'connectedCallback should make new answers from vars')
        previewCleanup()
      })
    })
  })
})
