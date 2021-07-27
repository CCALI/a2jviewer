import { VariablesTableVM } from './variables'
import { assert } from 'chai'
import Interview from '~/src/models/interview'

import 'steal-mocha'

describe('<author-debug-panel>', () => {
  describe('viewModel', () => {
    let vm = new VariablesTableVM()

    it('safeWindowsFilename()', () => {
      const testFileName = 'test<>:"/|?*\\file 06/15/2021'
      assert.equal(vm.safeWindowsFilename(testFileName), 'test-file 06-15-2021', 'should ')
    })

    it('clearAnswers()', () => {
      const interview = new Interview()
      const answers = interview.attr('answers')
      answers.varSet('foo', 'bar')
      vm = new VariablesTableVM({ interview })

      let expectedResult = answers.varGet('foo')
      assert.equal(expectedResult, 'bar', 'should get an answer')

      vm.clearAnswers()
      expectedResult = answers.varGet('foo')
      assert.equal(expectedResult, undefined, 'should clear answers')
    })
  })
})
