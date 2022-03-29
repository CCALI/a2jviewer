import AppState from '~/src/models/app-state'
import FieldModel from '~/src/models/field'
import AnswerVM from '~/src/models/answervm'
import stache from 'can-stache'
import canViewModel from 'can-view-model'
import { assert } from 'chai'
import Lang from '~/src/mobile/util/lang.js'

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
      const appState = new AppState({ page: 'testPage' })
      const vm = render({ appState })
      appState.traceMessage.currentPageName = 'Test Page'

      const fieldModel = new FieldModel({ name: 'someName', type: 'text', sample: 'foo' })
      fieldModel._answerVm = new AnswerVM({ field: fieldModel, answer: fieldModel.emptyAnswer })

      const fields = [fieldModel]
      const fieldsTpl = stache('<a2j-fields appState:from="appState" fields:from="fields" />')
      document.querySelector('#test-area').appendChild(fieldsTpl({ appState, fields }))

      const fieldEl = document.querySelector('a2j-field')

      setTimeout(() => {
        vm.fillPageSample()
        const answerValue = fieldEl.querySelector('input').value
        assert.equal(answerValue, 'foo', 'should fill in field with sample value')
        done()
      })
    })

    it('fillPageSample-datefields', (done) => {
      const appState = new AppState()
      const lang = new Lang()
      const vm = render({ appState, lang })
      appState.traceMessage.currentPageName = 'Test Page'

      const fieldModel = new FieldModel({ name: 'someName', type: 'datemdy', sample: '02/02/1992', label: 'date' })
      fieldModel._answerVm = new AnswerVM({ field: fieldModel, answer: fieldModel.emptyAnswer })

      const fields = [fieldModel]
      const fieldsTpl = stache('<a2j-fields appState:from="appState" fields:from="fields" />')
      document.querySelector('#test-area').appendChild(fieldsTpl({ appState, fields }))

      const fieldEl = document.querySelector('a2j-field')

      const fieldVm = fieldEl.viewModel
      fieldVm.lang = lang

      let answerValue = fieldEl.querySelector('.datepicker-input')

      setTimeout(() => {
        vm.fillPageSample()
        answerValue = fieldEl.querySelector('input').value
        assert.equal(answerValue, '02/02/1992', 'should fill in field with sample value')
        done()
      })
    })
  })
})
