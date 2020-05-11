import CanMap from 'can-map'
import { assert } from 'chai'
import _round from 'lodash/round'
import _assign from 'lodash/assign'
import stache from 'can-stache'
import AppState from 'caja/viewer/models/app-state'
import Interview from 'caja/viewer/models/interview'
import TraceMessage from 'caja/author/models/trace-message'
import $ from 'jquery'
import { ViewerStepsVM } from 'caja/viewer/desktop/steps/'
import interviewJSON from 'caja/viewer/models/fixtures/real_interview_1.json'
import sinon from 'sinon'
import F from 'funcunit'

import 'steal-mocha'
/* global describe it beforeEach afterEach */

describe('<a2j-viewer-steps>', function () {
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
      const rState = new AppState({ traceMessage })
      appStateTeardown = rState.connectedCallback()
      rState.page = interview.attr('firstPage')
      rState.interview = interview

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

      let langStub = new CanMap({
        MonthNamesShort: 'Jan, Feb',
        MonthNamesLong: 'January, February',
        LearnMore: 'Learn More'
      })

      const frag = stache(
        `<a2j-viewer-steps
        rState:bind="rState"
        mState:bind="mState"
        interview:bind="interview"
        logic:bind="logicStub"
        lang:bind="langStub"/>`
      )

      $('#test-area').html(frag({ rState, interview, mState, logicStub, langStub }))
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
      answers.attr('user gender', {
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
        answers.attr('user gender', {
          name: 'user gender',
          values: [null, 'f']
        })

        assert.equal(interview.attr('avatarGender'), 'female')

        F('a2j-viewer-avatar').size(2)
        F(done)
      }
    )
  })

  describe('ViewModel', function () {
    let vm
    let appStateTeardown
    let currentPage

    beforeEach(() => {
      const rState = new AppState()

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

      const interview = {
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
      }

      appStateTeardown = rState.connectedCallback()
      rState.interview = interview
      rState.logic = logicStub
      rState.traceMessage = new TraceMessage()
      rState.page = '01-Introduction'

      vm = new ViewerStepsVM({ rState })
      vm.attr({ interview })
    })

    afterEach(() => {
      appStateTeardown()
    })

    it('getTextForStep', () => {
      const step = vm.attr('interview.steps.0')
      const stepVar = vm.attr('interview.answers.a2j step 0')

      assert.equal(vm.getDisplayTextForStep(step), 'Audio Test', 'show default step sign text')
      // update matching step var
      stepVar.attr('values.1', 'New Sign Text')
      assert.equal(vm.getDisplayTextForStep(step), 'New Sign Text', 'Authors can set new sign displayText')
      // clear custom value
      stepVar.attr('values.1', '')
      assert.equal(vm.getDisplayTextForStep(step), 'Audio Test', 'should restore text when step var set to empty string')
    })

    it('getStepIndex', () => {
      const step = vm.attr('interview.steps.2')

      assert.equal(vm.getStepIndex(step), 2, 'it did not return the correct index for the step')
    })

    it('getDisplayTextForStep', () => {
      const step = vm.attr('interview.steps.0')
      assert.equal(vm.getDisplayTextForStep(step), 'Audio Test', 'should not change short text')

      step.attr('text', 'slightly longer text with a space as the 51st char that gets truncated')

      assert.equal(
        vm.getDisplayTextForStep(step),
        'slightly longer text with a space as the 51st char...',
        'should truncate to 50 chars and add an ellipsis'
      )

      step.attr('text', 'long text with a space as the 50th character in the middle of a word')

      assert.equal(
        vm.getDisplayTextForStep(step),
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
        vm.attr('nextSteps').serialize(),
        expectedNextSteps,
        'it should match expected fixtures'
      )

      assert.equal(
        vm.attr('remainingSteps'),
        expectedNextSteps.length,
        'there should be 3 steps remaining'
      )
    })

    it('maxDisplayedSteps', () => {
      vm.attr('interview.steps', [1, 2, 3, 4, 5])
      vm.attr('sidewalkHeight', 50)

      assert.equal(vm.attr('maxDisplayedSteps'), 1, 'show 1 step when sidewalk < 100px')

      vm.attr('sidewalkHeight', 100)
      assert.equal(vm.attr('maxDisplayedSteps'), 2, 'show 2 steps when sidewalk is 100-450px')
      vm.attr('sidewalkHeight', 449)
      assert.equal(vm.attr('maxDisplayedSteps'), 2, 'show 2 steps when sidewalk is 100-449px')

      vm.attr('sidewalkHeight', 450)
      assert.equal(vm.attr('maxDisplayedSteps'), 3, 'show 3 steps when sidewalk is 450-549')
      vm.attr('sidewalkHeight', 549)
      assert.equal(vm.attr('maxDisplayedSteps'), 3, 'show 3 steps when sidewalk is 450-549')

      vm.attr('sidewalkHeight', 550)
      assert.equal(vm.attr('maxDisplayedSteps'), 4, 'show 4 steps when sidewalk is 550-749')
      vm.attr('sidewalkHeight', 749)
      assert.equal(vm.attr('maxDisplayedSteps'), 4, 'show 4 steps when sidewalk is 550-749')

      vm.attr('sidewalkHeight', 750)
      assert.equal(vm.attr('maxDisplayedSteps'), 5, 'show 5 steps when sidewalk is 750px or above')

      vm.attr('interview.steps.length', 4)
      assert.equal(vm.attr('maxDisplayedSteps'), 4, 'never show more steps than interview has')
    })

    it('guideAvatarSkinTone', () => {
      vm.attr({
        interview: {},
        mState: {}
      })

      vm.attr('interview.avatarSkinTone', 'avatar')
      assert.equal(vm.attr('guideAvatarSkinTone'), 'avatar', 'should use interview skin tone if set')

      vm.attr('interview.avatarSkinTone', '')
      vm.attr('mState.avatarSkinTone', 'global')
      assert.equal(vm.attr('guideAvatarSkinTone'), 'global', 'should use global skin tone if set')

      vm.attr('interview.avatarSkinTone', 'avatar')
      assert.equal(vm.attr('guideAvatarSkinTone'), 'global', 'should use global skin tone if both are set')
    })

    it('showUserAvatar / guideAvatarFacingDirection', () => {
      currentPage = new CanMap()

      vm.attr({
        interview: {
          avatarGender: '',
          getPageByName () {
            return currentPage
          }
        }
      })

      assert.ok(!vm.attr('showUserAvatar'), 'should not show user avatar')
      assert.equal(
        vm.attr('guideAvatarFacingDirection'),
        'front',
        'should show guide avatar facing front'
      )

      vm.attr('interview.avatarGender', 'gender')
      currentPage.attr('hasUserGenderOrAvatarField', true)
      assert.ok(!vm.attr('showUserAvatar'), 'should not show user avatar when current page has the user gender field')
      assert.equal(
        vm.attr('guideAvatarFacingDirection'),
        'front',
        'should still show guide avatar facing front'
      )

      currentPage.attr('hasUserGenderOrAvatarField', false)
      assert.ok(!!vm.attr('showUserAvatar'), 'should show user avatar when user has a gender')
      assert.equal(
        vm.attr('guideAvatarFacingDirection'),
        'right',
        'should show guide avatar facing right'
      )
    })

    it('sidewalkLength', () => {
      vm.attr('sidewalkHeight', 4)
      vm.attr('sidewalkWidth', 3)
      assert.equal(vm.attr('sidewalkLength'), 5)
    })

    it('sidewalkAngleA', () => {
      vm.attr('sidewalkHeight', 600)

      // set sidewalkLength to 1200 by doing 1200^2 - 600^2 = sidewalkWidth^2
      vm.attr('sidewalkWidth', Math.pow(Math.pow(1200, 2) - Math.pow(600, 2), 0.5))

      // angle A is then PI/6 radians (30 degrees)
      assert.equal(_round(vm.attr('sidewalkAngleA'), 5), _round(Math.PI / 6, 5))
    })

    it('guideBubbleTallerThanAvatar', () => {
      vm.attr('guideBubbleHeight', 100)
      vm.attr('avatarHeight', 100)
      assert.equal(vm.attr('guideBubbleTallerThanAvatar'), false, 'false')

      vm.attr('avatarHeight', 99)
      assert.equal(vm.attr('guideBubbleTallerThanAvatar'), true, 'true')
    })

    it('userBubbleTallerThanAvatar', () => {
      vm.attr('clientBubbleHeight', 100)
      vm.attr('avatarHeight', 100)
      assert.equal(vm.attr('userBubbleTallerThanAvatar'), false, 'false')

      vm.attr('avatarHeight', 99)
      assert.equal(vm.attr('userBubbleTallerThanAvatar'), true, 'true')
    })

    it('minusHeader', () => {
      vm.attr('bodyHeight', 100)
      vm.attr('sidewalkHeight', 50)
      assert.equal(vm.attr('minusHeader'), 25)
    })

    it('getStepWidth()', () => {
      vm.attr('avatarOffsetTop', 211)
      vm.attr('minusHeader', 98)
      vm.attr('bodyHeight', 768)
      vm.attr('sidewalkHeight', 573)
      vm.attr('sidewalkWidth', 512)

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
})
