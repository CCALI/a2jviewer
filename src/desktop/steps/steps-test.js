import CanMap from 'can-map'
import { assert } from 'chai'
import _round from 'lodash/round'
import _assign from 'lodash/assign'
import stache from 'can-stache'
import AppState from '~/src/models/app-state'
import Interview from '~/src/models/interview'
import Logic from '~/src/mobile/util/logic'
import TraceMessage from '@caliorg/a2jdeps/models/trace-message'
import $ from 'jquery'
import { ViewerStepsVM } from '~/src/desktop/steps/'
import interviewJSON from '@caliorg/a2jdeps/models/fixtures/real_interview_1.json'
import sinon from 'sinon'
import F from 'funcunit'

import 'steal-mocha'
/* global describe it beforeEach afterEach */

describe('<a2j-viewer-steps>', function () {
  describe('ViewModel', function () {
    let vm
    let appStateTeardown
    let currentPage

    beforeEach(() => {
      const appState = new AppState()

      const logicStub = new CanMap({
        exec: $.noop,
        infinite: {
          errors: $.noop,
          reset: $.noop,
          _counter: 0,
          inc: $.noop
        },
        varExists: sinon.spy(),
        varCreate: sinon.spy(),
        varGet: sinon.stub(),
        varSet: sinon.spy(),
        eval: sinon.spy()
      })

      currentPage = new CanMap({
        step: {
          number: '2',
          text: 'Audio Test'
        }
      })

      const answers = new CanMap({
        'a2j step 0': {
          name: 'A2J Step 0',
          values: [null]
        }
      })

      const interview = new CanMap({
        getPageByName () {
          return currentPage
        },

        steps: [
          { number: '2', text: 'Audio Test' },
          { number: '3', text: 'Graphic Test' },
          { number: '4', text: 'Graphic with Audio Test' },
          { number: '5', text: 'Video' }
        ],

        answers
      })

      appStateTeardown = appState.connectedCallback()
      appState.interview = interview
      appState.logic = logicStub
      appState.traceMessage = new TraceMessage()
      appState.page = '01-Introduction'

      vm = new ViewerStepsVM({ appState, interview })
    })

    afterEach(() => {
      appStateTeardown()
    })

    it('hasAvatarPicker', () => {
      vm.currentPage.fields = [{ type: 'text' }, { type: 'useravatar' }]

      assert.isTrue(vm.hasAvatarPicker, 'should detect if fields contains avatarpicker field type')
    })

    it('getTextForStep', () => {
      const step = vm.interview.attr('steps.0')
      const stepVar = vm.interview.attr('answers.a2j step 0')

      assert.equal(vm.getTextForStep(step), 'Audio Test', 'show default step sign text')
      // update matching step var
      stepVar.attr('values.1', 'New Sign Text')
      assert.equal(vm.getTextForStep(step), 'New Sign Text', 'Authors can set new sign displayText')
      // clear custom value
      stepVar.values[1] = ''
      assert.equal(vm.getTextForStep(step), 'Audio Test', 'should restore text when step var set to empty string')
    })

    it('getStepIndex', () => {
      const step = vm.interview.attr('steps.2')

      assert.equal(vm.getStepIndex(step), 2, 'it did not return the correct index for the step')
    })

    it('truncateText', () => {
      const step = vm.interview.attr('steps.0')
      assert.equal(vm.truncateText(step.text), 'Audio Test', 'should not change short text')

      step.attr('text', 'slightly longer text with a space as the 51st char that gets truncated')

      assert.equal(
        vm.truncateText(step.text),
        'slightly longer text with a space as the 51st char...',
        'should truncate to 50 chars and add an ellipsis'
      )

      step.attr('text', 'long text with a space as the 50th character in the middle of a word')

      assert.equal(
        vm.truncateText(step.text),
        'long text with a space as the 50th character in...',
        'should truncate to last full word before 50th char and add an ellipsis'
      )
    })

    it('computes nextSteps & remainingSteps based on current step', function () {
      const expectedNextSteps = [
        { number: '3', text: 'Graphic Test' },
        { number: '4', text: 'Graphic with Audio Test' },
        { number: '5', text: 'Video' }
      ]

      assert.deepEqual(
        vm.nextSteps.serialize(),
        expectedNextSteps,
        'it should match expected fixtures'
      )

      assert.equal(
        vm.remainingSteps,
        expectedNextSteps.length,
        'there should be 3 steps remaining'
      )
    })

    it('maxDisplayedSteps', () => {
      vm.interview.attr('steps', [1, 2, 3, 4, 5])
      vm.sidewalkHeight = 50

      assert.equal(vm.maxDisplayedSteps, 1, 'show 1 step when sidewalk < 100px')

      vm.sidewalkHeight = 100
      assert.equal(vm.maxDisplayedSteps, 2, 'show 2 steps when sidewalk is 100-450px')
      vm.sidewalkHeight = 449
      assert.equal(vm.maxDisplayedSteps, 2, 'show 2 steps when sidewalk is 100-449px')

      vm.sidewalkHeight = 450
      assert.equal(vm.maxDisplayedSteps, 3, 'show 3 steps when sidewalk is 450-549')
      vm.sidewalkHeight = 549
      assert.equal(vm.maxDisplayedSteps, 3, 'show 3 steps when sidewalk is 450-549')

      vm.sidewalkHeight = 550
      assert.equal(vm.maxDisplayedSteps, 4, 'show 4 steps when sidewalk is 550-749')
      vm.sidewalkHeight = 749
      assert.equal(vm.maxDisplayedSteps, 4, 'show 4 steps when sidewalk is 550-749')

      vm.sidewalkHeight = 750
      assert.equal(vm.maxDisplayedSteps, 5, 'show 5 steps when sidewalk is 750px or above')

      vm.interview.attr('steps').length = 4
      assert.equal(vm.maxDisplayedSteps, 4, 'never show more steps than interview has')
    })

    it('guideAvatarSkinTone', () => {
      vm.assign({
        interview: new CanMap(),
        mState: new CanMap()
      })

      vm.interview.attr('avatarSkinTone', 'avatar')
      assert.equal(vm.guideAvatarSkinTone, 'avatar', 'should use interview skin tone if set')

      vm.interview.attr('avatarSkinTone', '')
      vm.mState.attr('avatarSkinTone', 'global')
      assert.equal(vm.guideAvatarSkinTone, 'global', 'should use global skin tone if set')

      vm.interview.attr('avatarSkinTone', 'avatar')
      assert.equal(vm.guideAvatarSkinTone, 'global', 'should use global skin tone if both are set')
    })

    it('showUserAvatar / guideAvatarFacingDirection', () => {
      currentPage = new CanMap()

      vm.assign({
        interview: new CanMap({
          avatarGender: '',
          getPageByName () {
            return currentPage
          }
        })
      })

      assert.ok(!vm.showUserAvatar, 'should not show user avatar')
      assert.equal(
        vm.guideAvatarFacingDirection,
        'front',
        'should show guide avatar facing front'
      )

      vm.interview.attr('avatarGender', 'gender')
      currentPage.attr('hasUserGenderOrAvatarField', true)
      assert.ok(!vm.showUserAvatar, 'should not show user avatar when current page has the user gender field')
      assert.equal(
        vm.guideAvatarFacingDirection,
        'front',
        'should still show guide avatar facing front'
      )

      currentPage.attr('hasUserGenderOrAvatarField', false)
      assert.ok(!!vm.showUserAvatar, 'should show user avatar when user has a gender')
      assert.equal(
        vm.guideAvatarFacingDirection,
        'right',
        'should show guide avatar facing right'
      )
    })

    it('sidewalkLength', () => {
      vm.sidewalkHeight = 4
      vm.sidewalkWidth = 3
      assert.equal(vm.sidewalkLength, 5)
    })

    it('sidewalkAngleA', () => {
      vm.sidewalkHeight = 600

      // set sidewalkLength to 1200 by doing 1200^2 - 600^2 = sidewalkWidth^2
      vm.sidewalkWidth = Math.pow(Math.pow(1200, 2) - Math.pow(600, 2), 0.5)

      // angle A is then PI/6 radians (30 degrees)
      assert.equal(_round(vm.sidewalkAngleA, 5), _round(Math.PI / 6, 5))
    })

    it('guideBubbleTallerThanAvatar', () => {
      vm.guideBubbleHeight = 100
      vm.avatarHeight = 100
      assert.equal(vm.guideBubbleTallerThanAvatar, false, 'false')

      vm.avatarHeight = 99
      assert.equal(vm.guideBubbleTallerThanAvatar, true, 'true')
    })

    it('userBubbleTallerThanAvatar', () => {
      vm.clientBubbleHeight = 100
      vm.avatarHeight = 100
      assert.equal(vm.userBubbleTallerThanAvatar, false, 'false')

      vm.avatarHeight = 99
      assert.equal(vm.userBubbleTallerThanAvatar, true, 'true')
    })

    it('minusHeader', () => {
      vm.bodyHeight = 100
      vm.sidewalkHeight = 50
      assert.equal(vm.minusHeader, 25)
    })

    it('getStepWidth()', () => {
      vm.avatarOffsetTop = 211
      vm.minusHeader = 98
      vm.bodyHeight = 768
      vm.sidewalkHeight = 573
      vm.sidewalkWidth = 512

      assert.equal(Math.ceil(vm.getStepWidth(true)), 303)
      assert.equal(Math.ceil(vm.getStepWidth(false, 378.156)), 195)
      assert.equal(Math.ceil(vm.getStepWidth(false, 524.078)), 98)
    })

    it('formatStepStyles()', () => {
      assert.equal(vm.formatStepStyles(303), 'margin-right: -31px;width: calc(0% + 394px);')
      assert.equal(vm.formatStepStyles(195), 'margin-right: -20px;width: calc(0% + 254px);')
      assert.equal(vm.formatStepStyles(98), 'margin-right: -10px;width: calc(0% + 128px);')
    })
  })

  describe('Component', function () {
    let interview
    let appStateTeardown
    let vm // eslint-disable-line

    beforeEach(function () {
      const rawData = _assign({}, interviewJSON)
      const parsedData = Interview.parseModel(rawData)

      interview = new Interview(parsedData)

      const traceMessage = new TraceMessage()
      const mState = new CanMap()
      const appState = new AppState({ traceMessage })
      appStateTeardown = appState.connectedCallback()
      appState.page = interview.attr('firstPage')
      appState.interview = interview

      const logic = new Logic({ interview })

      let langStub = new CanMap({
        MonthNamesShort: 'Jan, Feb',
        MonthNamesLong: 'January, February',
        LearnMore: 'Learn More'
      })

      const frag = stache(
        `<a2j-viewer-steps
        appState:from="appState"
        mState:from="mState"
        interview:from="interview"
        logic:from="logic"
        lang:from="langStub"/>`
      )

      $('#test-area').html(frag({ appState, interview, mState, logic, langStub }))
      vm = $('a2j-viewer-steps')[0].viewModel
    })

    afterEach(function () {
      $('#test-area').empty()
      appStateTeardown()
    })

    it('renders arrow when step number is zero', function (done) {
      const firstStepNumber = interview.attr('steps.0.number')
      assert.equal(parseInt(firstStepNumber, 10), 0)

      F('.glyphicon-step-zero').size(1, 'should be one arrow')
      F(done)
    })

    it('renders only guide avatar if "avatarGender" is unknown', function (done) {
      const answers = interview.attr('answers')

      // user has not set their gender
      answers.varSet('user gender', {
        name: 'user gender',
        values: [null]
      })
      assert.isUndefined(interview.attr('avatarGender'))

      F('a2j-viewer-avatar').size(1)
      F(done)
    })

    it('renders both client and guide avatars if "avatarGender" is known',
      function (done) {
        const answers = interview.attr('answers')

        // user set her gender.
        answers.varSet('user gender', {
          name: 'user gender',
          values: [null, 'f']
        })

        assert.equal(interview.attr('avatarGender'), 'female')

        F('a2j-viewer-avatar').size(2)
        F(done)
      }
    )
  })
})
