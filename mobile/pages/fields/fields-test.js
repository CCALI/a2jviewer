import { assert } from 'chai'
import { FieldsVM } from './fields'
import 'steal-mocha'

describe('<a2j-fields>', () => {
  describe('viewModel', () => {
    let vm

    beforeEach(() => {
      vm = new FieldsVM({
        fields: [
          { name: 'foo' },
          { name: 'foo' },
          { name: 'foobaroo' },
          { name: 'baz' },
          { name: 'baz' }
        ]
      })
    })

    afterEach(() => {
      vm = null
    })

    it('lastIndexMap', () => {
      let expectedResults = {
        foo: 1,
        foobaroo: 2,
        baz: 4
      }
      assert.deepEqual(vm.attr('lastIndexMap').serialize(), expectedResults, 'should build lastIndexMap based on passed in fields')

      expectedResults = {}
      vm.attr('fields', [])
      assert.deepEqual(vm.attr('lastIndexMap').serialize(), expectedResults, 'lastIndexMap should handle no fields')

      expectedResults = {
        foo: 0,
        bar: 2
      }
      vm.attr('fields', [{name: 'foo'}, {name: 'bar'}, {name: 'bar'}])
      assert.deepEqual(vm.attr('lastIndexMap').serialize(), expectedResults, 'lastIndexMap should update when fields changes')
    })

    it('groupValidationMap', () => {
      let expectedResults = {
        foo: false,
        foobaroo: false,
        baz: false
      }
      assert.deepEqual(vm.attr('groupValidationMap').serialize(), expectedResults, 'should build groupValidationMap based on passed in fields')

      expectedResults = {}
      vm.attr('fields', [])
      assert.deepEqual(vm.attr('groupValidationMap').serialize(), expectedResults, 'groupValidationMap should handle no fields')

      expectedResults = {
        foo: false,
        bar: false
      }
      vm.attr('fields', [{name: 'foo'}, {name: 'bar'}, {name: 'bar'}])
      assert.deepEqual(vm.attr('groupValidationMap').serialize(), expectedResults, 'groupValidationMap should update when fields changes')
    })
  })
})
