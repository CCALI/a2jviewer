import { assert } from 'chai'
import { FieldsVM } from './fields'
import Field from '~/src/models/field'
import 'steal-mocha'

describe('<a2j-fields>', () => {
  describe('viewModel', () => {
    let vm

    beforeEach(() => {
      vm = new FieldsVM({
        fields: new Field.List([
          { name: 'foo' },
          { name: 'foo' },
          { name: 'foobaroo' },
          { name: 'baz' },
          { name: 'baz' }
        ])
      })
    })

    afterEach(() => {
      vm = null
    })

    it('lastIndexMap', () => {
      vm.connectedCallback()
      let expectedResults = {
        foo: 1,
        foobaroo: 2,
        baz: 4
      }
      assert.deepEqual(vm.lastIndexMap.serialize(), expectedResults, 'should build lastIndexMap based on passed in fields')

      expectedResults = {}
      vm.fields = []
      assert.deepEqual(vm.lastIndexMap.serialize(), expectedResults, 'lastIndexMap should handle no fields')

      expectedResults = {
        foo: 0,
        bar: 2
      }
      vm.fields = [{ name: 'foo' }, { name: 'bar' }, { name: 'bar' }]
      assert.deepEqual(vm.lastIndexMap.serialize(), expectedResults, 'lastIndexMap should update when fields changes')
    })

    it('groupValidationMap', () => {
      vm.connectedCallback()
      let expectedResults = {
        foo: false,
        foobaroo: false,
        baz: false
      }
      assert.deepEqual(vm.groupValidationMap.serialize(), expectedResults, 'should build groupValidationMap based on passed in fields')

      expectedResults = {}
      vm.fields = []
      assert.deepEqual(vm.groupValidationMap.serialize(), expectedResults, 'groupValidationMap should handle no fields')

      expectedResults = {
        foo: false,
        bar: false
      }
      vm.fields = [{ name: 'foo' }, { name: 'bar' }, { name: 'bar' }]
      assert.deepEqual(vm.groupValidationMap.serialize(), expectedResults, 'groupValidationMap should update when fields changes')
    })
  })
})
