import { assert } from 'chai'
import { ViewerPreviewVM } from './preview'
import 'steal-mocha'

describe('<a2j-viewer-preview>', function () {
  describe('viewModel', function () {
    let vm = null

    describe('connectedCallback()', function () {
      beforeEach(function () {
        // this is parsed to get vars
        window.gGuide = {
          vars: {
            someVar: { name: 'someVar', values: [null] }
          }
        }
        vm = new ViewerPreviewVM({
          previewInterview: {
            answers: {
              someAnswer: {
                name: 'someAnswer',
                values: [null, 'foo']
              }
            }
          },
          interview: {
            answers: {},
            steps: [],
            sendfeedback: {}
          }
        })
      })

      it('generates new answers from vars if no previewInterview', () => {
        const el = []
        // emulate first run or previewInterview clear from Interviews tab
        vm.attr('previewInterview', undefined)

        const expectedAnswerKeys = [ 'lang', 'somevar' ]
        const previewCleanup = vm.connectedCallback(el)
        const connectedCallbackAnswerKeys = Object.keys(vm.attr('interview.answers')._data)

        assert.deepEqual(expectedAnswerKeys, connectedCallbackAnswerKeys, 'connectedCallback should make new answers from vars')
        previewCleanup()
      })

      it('restores answers from previewInterview', () => {
        const el = []
        const expectedAnswerKeys = [ 'lang', 'someAnswer' ]
        const previewCleanup = vm.connectedCallback(el)
        const connectedCallbackAnswerKeys = Object.keys(vm.attr('interview.answers')._data)

        assert.deepEqual(expectedAnswerKeys, connectedCallbackAnswerKeys, 'connectedCallback should make new answers from vars')
        previewCleanup()
      })
    })
  })
})
