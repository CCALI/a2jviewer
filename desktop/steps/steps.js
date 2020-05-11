import $ from 'jquery'
import CanMap from 'can-map'
import _isNaN from 'lodash/isNaN'
import _inRange from 'lodash/inRange'
import Component from 'can-component'
import template from './steps.stache'
import _findIndex from 'lodash/findIndex'
import _truncate from 'lodash/truncate'
import learnMoreTemplate from './learn-more.stache'
import { analytics } from 'caja/viewer/util/analytics'
import stache from 'can-stache'
import canReflect from 'can-reflect'

import 'can-map-define'

stache.registerPartial('learn-more-tpl', learnMoreTemplate)

/**
 * @property {can.Map} steps.ViewModel
 * @parent <a2j-viewer-steps>
 *
 * `<a2j-viewer-steps>`'s viewModel.
 */
export let ViewerStepsVM = CanMap.extend('ViewerStepsVM', {
  define: {
    // passed in via desktop.stache bindings
    showDebugPanel: {},
    lang: {},
    logic: {},
    rState: {},
    pState: {},
    mState: {},
    interview: {},
    modalContent: {},

    /**
     * @property {can.DefineMap} steps.ViewModel.prototype.userAvatar userAvatar
     * @parent steps.ViewModel
     *
     * current User Avatar in interview
     */
    userAvatar: {
      get () {
        return this.attr('rState').userAvatar
      }
    },

    /**
     * @property {can.DefineMap} steps.ViewModel.prototype.hasWheelchair hasWheelchair
     * @parent steps.ViewModel
     *
     * for bubble styling when User Avatar has a wheelchair
     */
    hasWheelchair: {
      get () {
        return this.attr('userAvatar').hasWheelchair
      }
    },

    /**
     * @property {can.Map} steps.ViewModel.prototype.currentPage currentPage
     * @parent steps.ViewModel
     *
     * current page in interview
     */
    currentPage: {
      get () {
        return this.attr('rState.currentPage')
      }
    },

    /**
     * @property {can.List} steps.ViewModel.prototype.steps steps
     * @parent steps.ViewModel
     *
     * list of steps in the interview
     */
    steps: {
      get () {
        return this.attr('interview.steps')
      }
    },

    /**
     * @property {can.Map} steps.ViewModel.prototype.currentStep currentStep
     * @parent steps.ViewModel
     *
     * current step in interview
     */
    currentStep: {
      get () {
        return this.attr('currentPage') && this.attr('currentPage.step')
      }
    },

    /**
     * @property {Boolean} steps.ViewModel.prototype.hasStep hasStep
     * @parent steps.ViewModel
     *
     * has a currentStep
     */
    hasStep: {
      type: 'boolean',
      get () {
        return !!this.attr('currentStep')
      }
    },

    /**
     * @property {can.List} steps.ViewModel.prototype.nextSteps nextSteps
     * @parent steps.ViewModel
     *
     * list of steps after current step in interview
     */
    nextSteps: {
      get () {
        const currentStepIndex = this.getStepIndex(this.attr('currentStep'))
        return this.attr('steps').slice(currentStepIndex + 1)
      }
    },

    /**
     * @property {Number} steps.ViewModel.prototype.remainingSteps remainingSteps
     * @parent steps.ViewModel
     *
     * number of steps after current step in interview
     */
    remainingSteps: {
      get () {
        return this.attr('nextSteps.length')
      }
    },

    /**
     * @property {Number} steps.ViewModel.prototype.maxDisplayedSteps maxDisplayedSteps
     * @parent steps.ViewModel
     *
     * maximum number of steps to display on screen
     *
     * based on the height of the sidewalk and number of steps in the interview
     *
     */
    maxDisplayedSteps: {
      get () {
        let sidewalkHeight = this.attr('sidewalkHeight')
        let interviewSteps = this.attr('steps.length')
        let maxSteps

        if (sidewalkHeight < 100) {
          maxSteps = 1
        } else if (_inRange(sidewalkHeight, 100, 450)) {
          maxSteps = 2
        } else if (_inRange(sidewalkHeight, 450, 550)) {
          maxSteps = 3
        } else if (_inRange(sidewalkHeight, 550, 750)) {
          maxSteps = 4
        } else {
          maxSteps = 5
        }

        return interviewSteps < maxSteps ? interviewSteps : maxSteps
      }
    },

    /**
     * @property {Array} steps.ViewModel.prototype.a2jStepVars a2jStepVars
     * @parent steps.ViewModel
     *
     * list of the A2J Step variables and their values
     * listens for changes to A2J Step variables during an interview - used to update displayText
     */
    a2jStepVars: {
      get () {
        let a2jStepVars = []
        let answers = this.attr('interview.answers')
        if (answers) {
          canReflect.eachKey(answers, function (answer) {
            if (answer && answer.name && answer.name.indexOf('A2J Step') !== -1) {
              answer.attr('values.length') // setup binding on values
              a2jStepVars.push(answer)
            }
          })
        }
        return a2jStepVars
      }
    },

    /**
     * @property {String} steps.ViewModel.prototype.guideAvatarSkinTone guideAvatarSkinTone
     * @parent steps.ViewModel
     *
     * skin tone of the guide avatar to be displayed in steps
     *
     */
    guideAvatarSkinTone: {
      get () {
        const globalSkinTone = this.attr('mState.avatarSkinTone')
        const interviewSkinTone = this.attr('interview.avatarSkinTone')
        return globalSkinTone || interviewSkinTone
      }
    },

    /**
     * @property {String} steps.ViewModel.prototype.guideAvatarHairColor guideAvatarHairColor
     * @parent steps.ViewModel
     *
     * hair color of the guide avatar to be displayed in steps
     *
     */
    guideAvatarHairColor: {
      get () {
        const globalHairColor = this.attr('mState.avatarHairColor')
        const interviewHairColor = this.attr('interview.avatarHairColor')
        return globalHairColor || interviewHairColor
      }
    },

    /**
     * @property {Number} steps.ViewModel.prototype.showUserAvatar showUserAvatar
     * @parent steps.ViewModel
     *
     * whether the user avatar should be shown
     *
     * we should not show the user avatar if the current page has the user
     * gender field, this prevents the avatar to be rendered right when user
     * selects their gender, which causes a weird jump of the avatar bubble.
     *
     */
    showUserAvatar: {
      get () {
        return this.attr('interview.avatarGender') && !this.attr('currentPage.hasUserGenderOrAvatarField')
      }
    },

    /**
     * @property {Number} steps.ViewModel.prototype.guideAvatarFacingDirection guideAvatarFacingDirection
     * @parent steps.ViewModel
     *
     * direction the guide avatar should face
     *
     * face right when user avatar is displayed; otherwise, face front
     *
     */
    guideAvatarFacingDirection: {
      get () {
        return this.attr('showUserAvatar') ? 'right' : 'front'
      }
    },

    /**
     * @property {Number} steps.ViewModel.prototype.sidewalkLength sidewalkLength
     * @parent steps.ViewModel
     *
     * length of the angled side of the sidewalk
     *
     * this is the hypoteneuse of the right-triangle used for drawing the sidewalk
     * where the other sides of the triangle are the height and width of the `<div id="sidewalk"></div>`
     *
     */
    sidewalkLength: {
      type: 'number',
      get () {
        let sidewalkHeight = this.attr('sidewalkHeight')
        let sidewalkWidth = this.attr('sidewalkWidth')
        return Math.sqrt(Math.pow(sidewalkHeight, 2) + Math.pow(sidewalkWidth, 2))
      }
    },

    /**
     * @property {Number} steps.ViewModel.prototype.sidewalkAngleA sidewalkAngleA
     * @parent steps.ViewModel
     *
     * Angle of bottom left corner of the right-triangle used for drawing the sidewalk
     * used for approximating the width of each step
     *
     * calculated by solving the equation `sin(A) = h1 / w1`
     *
     * @codestart
     *               /|  ______
     *              / |       |
     *             /  |       |
     *            /   |       |
     *           /    |      h1
     *          /     |       |
     *         /      |       |
     *        /_______|  _____|
     *       A    w1
     * @codeend
     */
    sidewalkAngleA: {
      type: 'number',
      get () {
        return Math.asin(this.attr('sidewalkHeight') / this.attr('sidewalkLength'))
      }
    },

    /**
     * @property {Number} steps.ViewModel.prototype.guideBubbleTallerThanAvatar guideBubbleTallerThanAvatar
     * @parent steps.ViewModel
     *
     * whether the guide bubble is taller than the avatar
     *
     */
    guideBubbleTallerThanAvatar: {
      get () {
        return this.attr('guideBubbleHeight') > this.attr('avatarHeight')
      }
    },

    /**
     * @property {Number} steps.ViewModel.prototype.userBubbleTallerThanAvatar userBubbleTallerThanAvatar
     * @parent steps.ViewModel
     *
     * whether the user bubble is taller than the avatar
     *
     */
    userBubbleTallerThanAvatar: {
      get () {
        return this.attr('clientBubbleHeight') > this.attr('avatarHeight')
      }
    },

    /**
     * @property {Number} steps.ViewModel.prototype.minusHeader minusHeader
     * @parent steps.ViewModel
     *
     * @minusHeader less variable reverse engineered
     *
     */
    minusHeader: {
      type: 'number',
      get () {
        let headerHeight = this.attr('bodyHeight') - this.attr('sidewalkHeight')
        return Math.ceil(headerHeight / 2)
      }
    },

    /**
     * DOM values
     */
    bodyHeight: {
      type: 'number'
    },

    sidewalkHeight: {
      type: 'number'
    },

    sidewalkWidth: {
      type: 'number'
    },

    guideBubbleHeight: {
      type: 'number'
    },

    avatarHeight: {
      type: 'number'
    },

    avatarOffsetTop: {
      type: 'number'
    }
  },

  /**
   * @property {Number} steps.ViewModel.prototype.getStepIndex getStepIndex
   * @parent steps.ViewModel
   *
   * index for a given step, step.number and index do not have to match
   */
  getStepIndex (step) {
    if (!step) { return }
    const steps = this.attr('steps').attr()
    const stepIndex = _findIndex(steps, ({ number }) => {
      return number === step.attr('number')
    })

    return stepIndex
  },

  /**
   * @property {String} steps.ViewModel.prototype.getTextForStep getTextForStep
   * @parent steps.ViewModel
   *
   * the step text which can be overridden by Authors assigned values to `A2J Step #` variables
   */
  getTextForStep (step) {
    if (!step) { return }
    const index = this.getStepIndex(step)
    const defaultText = this.attr(`interview.steps.${index}.text`)
    let variableText
    const variable = this.attr('a2jStepVars')[index]
    if (variable) {
      variableText = variable.attr('values.1')
    }
    return variableText || defaultText
  },

  /**
   * @property {String} steps.ViewModel.prototype.getDisplayTextForStep getDisplayTextForStep
   * @parent steps.ViewModel
   *
   * final text to be displayed on step sign in viewer, truncated as needed
   */
  getDisplayTextForStep (step) {
    const maxChars = 50
    const overflowText = '...'
    const text = this.getTextForStep(step)

    return _truncate(text, {
      length: maxChars + overflowText.length,
      separator: ' ',
      omission: overflowText
    })
  },

  /**
   * @property {Number} steps.ViewModel.prototype.getStepWidth getStepWidth
   * @parent steps.ViewModel
   *
   * get the width of a step based on its index
   *
   * this is done by solving for w2 in the equation `tan(A) = h2 / w2`
   *
   * @codestart
   *               /|  ______
   *              / |  |    |
   *             /  |  h2   |
   *            /   |  |    |
   *           /____|  _   h1
   *          / w2  |       |
   *         /      |       |
   *        /_______|  _____|
   *       A    w1
   * @codeend
   */
  getStepWidth (isCurrentStep, cssBottom) {
    // for current step, align the bottom of the step with the bottom of the avatar
    // for next steps, align the bottom of the step with the bottom of its parent (set by css)
    let bottom = isCurrentStep
      ? this.attr('avatarOffsetTop')
      : cssBottom

    // reverse engineer less equation `calc(~"x% - " minusHeader) = bodyHeight`
    // solve above equation for x, which will be percentBelow
    let percentBelow = Math.ceil(((bottom + this.attr('minusHeader')) / this.attr('bodyHeight')) * 100)
    let percentAbove = (100 - percentBelow) / 100

    return (this.attr('sidewalkHeight') * percentAbove) / Math.tan(this.attr('sidewalkAngleA'))
  },

  /**
   * @property {String} steps.ViewModel.prototype.formatStepStyles formatStepStyles
   * @parent steps.ViewModel
   *
   * the style attribute value needed for styling a step based on its width
   */
  formatStepStyles (width) {
    return 'margin-right: ' + `-${Math.ceil(width * 0.1)}px;` +
           'width: ' + `calc(0% + ${Math.ceil(width + (width * 0.3))}px);`
  },

  /**
   * @property {Function} steps.ViewModel.prototype.updateDomProperties updateDomProperties
   * @parent steps.ViewModel
   *
   *  updates the dom to keep step elements in proper relation to each other
   */
  updateDomProperties () {
    let vm = this

    vm.attr('bodyHeight', $('body').height())

    let $sidewalk = $('#sidewalk')
    vm.attr('sidewalkWidth', $sidewalk.width())
    vm.attr('sidewalkHeight', $sidewalk.height())

    let $guideBubble = $('#guideBubble')
    vm.attr('guideBubbleHeight', $guideBubble.height())

    let $clientBubble = $('#clientBubble')
    vm.attr('clientBubbleHeight', $clientBubble.height())

    let $avatar = $guideBubble.parent()
    vm.attr('avatarHeight', $avatar.height())
    vm.attr('avatarOffsetTop', $avatar.offset() && $avatar.offset().top)

    $('.step-next').each((i, el) => {
      let $el = $(el)
      let cssBottom = $el.css('bottom')
      cssBottom = +cssBottom.slice(0, cssBottom.indexOf('px'))
      if (cssBottom) {
        const style = vm.formatStepStyles(vm.getStepWidth(false, cssBottom))
        $el.find('.app-step').attr('style', style)
      }
    })
  },

  /**
   * @property {Function} steps.ViewModel.prototype.avatarLoaded avatarLoaded
   * @parent steps.ViewModel
   *
   *  used to trigger the dom update from avatar.js on svg load
   */
  avatarLoaded () {
    this.afterAvatarLoaded(() => this.updateDomProperties())
  },

  // TODO: figure out a better way update the dom when the avatar changes in the DOM
  afterAvatarLoaded (callback) {
    setTimeout(callback, 0)
  },

  fireLearnMoreModal () {
    const pages = this.attr('interview.pages')
    const pageName = this.attr('rState.page')

    if (pages && pageName) {
      const page = pages.find(pageName)

      // piwik tracking of learn-more clicks
      if (window._paq) {
        analytics.trackCustomEvent('Learn-More', 'from: ' + pageName, page.learn)
      }

      this.attr('modalContent', {
        // name undefined prevents stache warnings
        answerName: undefined,
        title: page.learn,
        text: page.help,
        imageURL: page.helpImageURL,
        altText: page.helpAltText,
        mediaLabel: page.helpMediaLabel,
        audioURL: page.helpAudioURL,
        videoURL: page.helpVideoURL,
        helpReader: page.helpReader
      })
    }
  },

  connectedCallback () {
    const vm = this
    const restoreUserAvatar = (ev, show) => {
      if (show) {
        const answers = vm.attr('interview.answers')
        const userAvatar = answers.attr('user avatar')
        const previousUserAvatar = userAvatar.attr('values.1')
        if (previousUserAvatar) {
          vm.attr('rState').userAvatar.update(JSON.parse(previousUserAvatar))
        }
      }
    }
    // if saved answer exists, restoreUserAvatar when shown
    this.listenTo('showUserAvatar', restoreUserAvatar)

    // cleanup
    return () => { this.stopListening('showUserAvatar', restoreUserAvatar) }
  }
})

/**
 * @module {Module} viewer/desktop/steps/ <a2j-viewer-steps>
 * @parent api-components
 *
 * this component displays an interview's steps
 *
 * ## Use
 *
 * @codestart
 *   <a2j-viewer-steps
 *    {(interview)}="interview" />
 * @codeend
 */
export default Component.extend({
  view: template,
  leakScope: false,
  tag: 'a2j-viewer-steps',
  ViewModel: ViewerStepsVM,

  events: {
    '{window} resize': function () {
      this.viewModel.updateDomProperties()
    },

    '{viewModel} showDebugPanel': function (vm) {
      vm.afterAvatarLoaded(() => vm.updateDomProperties())
    },

    '{viewModel} showUserAvatar': function (vm) {
      vm.afterAvatarLoaded(() => vm.updateDomProperties())
    },

    '{viewModel} currentPage': function (vm) {
      vm.afterAvatarLoaded(() => vm.updateDomProperties())
    }
  },

  helpers: {
    zeroOrUndefined (number, options) {
      number = parseInt(number, 10)
      return (number === 0 || _isNaN(number))
    },

    add (a, b) {
      return a + b
    },

    eval: function (str) {
      str = typeof str === 'function' ? str() : str
      return this.attr('logic').eval(str)
    }
  }
})
