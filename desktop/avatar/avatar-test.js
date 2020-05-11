import $ from 'jquery'
import { assert } from 'chai'
import stache from 'can-stache'
import { ViewerAvatarVM } from 'caja/viewer/desktop/avatar/'

import 'steal-mocha'

describe('<a2j-viewer-avatar>', function () {
  describe('viewModel', function () {
    let vm

    beforeEach(function () {
      vm = new ViewerAvatarVM()
    })

    it('default "gender" to "female"', function () {
      assert.equal(vm.attr('gender'), 'female')
    })

    it('enforces "gender" enum type', function () {
      let testValues = [
        { gender: 'male', expected: 'male' },
        { gender: 'foo', expected: 'female' }, // when invalid, default value is returned
        { gender: 'female', expected: 'female' }
      ]

      testValues.forEach(function (val) {
        vm.attr('gender', val.gender)
        assert.equal(vm.attr('gender'), val.expected)
      })
    })

    it('defaults "skin" to "light"', function () {
      assert.equal(vm.attr('skin'), 'medium')
    })

    it('enforces "skin" enum type', function () {
      let testValues = [
        { skin: 'dark', expected: 'dark' },
        { gender: 'foo', expected: 'medium' }, // when invalid, default value is returned
        { skin: 'lighter', expected: 'lighter' }
      ]

      testValues.forEach(function (val) {
        vm.attr('skin', val.skin)
        assert.equal(vm.attr('skin'), val.expected)
      })
    })

    it('computes the correct avatar image name', function () {
      let testValues = [
        { gender: 'male', facing: 'front', expected: 'avatar-male-front.svg' },
        { gender: 'male', facing: 'right', expected: 'avatar-male-right.svg' },
        { gender: 'female', facing: 'front', expected: 'avatar-female-front.svg' },
        { gender: 'female', facing: 'right', expected: 'avatar-female-right.svg' }
      ]

      testValues.forEach(function (val) {
        vm.attr({ gender: val.gender, facing: val.facing })
        assert.equal(vm.attr('avatarImageName'), val.expected)
      })
    })
  })

  describe('Component', function () {
    beforeEach(function () {
      let frag = stache('<a2j-viewer-avatar />')
      $('#test-area').html(frag({}))
    })

    afterEach(function () {
      $('#test-area').empty()
    })

    it('works', function () {
      assert($('a2j-viewer-avatar').length)
    })
  })
})
