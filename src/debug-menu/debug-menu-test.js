import AppState from '~/src/models/app-state'
import FieldModel from '~/src/models/field'
import AnswerVM from '~/src/models/answervm'
import stache from 'can-stache'
import canViewModel from 'can-view-model'
import { assert } from 'chai'

import 'steal-mocha'
import './debug-menu'
import '~/src/mobile/pages/fields/'

describe('<debug-panel>', () => {
  describe('Component', () => {
    afterEach(() => {
      $('#test-area').empty()
    })

    const render = (data) => {
      const tpl = stache('<debug-menu appState:from="appState" />')
      document.querySelector('#test-area').appendChild(tpl(data))
      return canViewModel('debug-menu')
    }

    it('fillPageSample', (done) => {
      const appState = new AppState()
      const vm = render({ appState })

      // validation is tested in ~/src/mobile/pages/fields/field/field-test.js
      const oldValidateSampleFill = vm.validateSampleFill
      vm.constructor.prototype.validateSampleFill = () => {}

      const fieldModel = new FieldModel({ name: 'someName', type: 'text', sample: 'foo' })
      fieldModel._answerVm = new AnswerVM({ field: fieldModel, answer: fieldModel.emptyAnswer })

      const fields = [ fieldModel ]
      const fieldsTpl = stache('<a2j-fields appState:from="appState" fields:from="fields" />')
      document.querySelector('#test-area').appendChild(fieldsTpl({ appState, fields }))

      const fieldEl = document.querySelector('a2j-field')

      setTimeout(() => {
        vm.fillPageSample()
        assert.equal(fieldEl.value, 'foo', 'should fill in field with sample value')
        vm.constructor.prototype.validateSampleFill = oldValidateSampleFill
        done()
      })
    })
  })
})
