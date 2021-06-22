import $ from 'jquery'
import DefineMap from 'can-define/map/map'
import _isNaN from 'lodash/isNaN'
import _inRange from 'lodash/inRange'
import _some from 'lodash/some'
import Component from 'can-component'
import template from './steps.stache'
import _findIndex from 'lodash/findIndex'
import learnMoreTemplate from './learn-more.stache'
import { analytics } from '~/src/util/analytics'
import stache from 'can-stache'
import canReflect from 'can-reflect'

stache.registerPartial('learn-more-tpl', learnMoreTemplate)

/**
 * @property {DefineMap} steps.ViewModel
 * @parent <a2j-viewer-steps>
 *
 * `<a2j-viewer-steps>`'s viewModel.
 */
export let ViewerStepsVM = DefineMap.extend('ViewerStepsVM', {
  // passed in via desktop.stache bindings
  appState: {},
  mState: {},
  pState: {},
  showSlideoutContent: {
    get () {
      return this.appState.showSlideoutContent
    }
  },
  lang: {},
  logic: {},
  interview: {},

  // passed up from pages-stache
  traceMessage: {},

  /**
   * @property {DefineMap} steps.ViewModel.prototype.userAvatar userAvatar
   * @parent steps.ViewModel
   *
   * current User Avatar in interview
   */
  userAvatar: {
    get () {
      return this.appState.userAvatar
    }
  },

  /**
   * @property {DefineMap} steps.ViewModel.prototype.hasWheelchair hasWheelchair
   * @parent steps.ViewModel
   *
   * for bubble styling when User Avatar has a wheelchair
   */
  hasWheelchair: {
    get () {
      return this.userAvatar.hasWheelchair
    }
  },

  /**
   * @property {DefineMap} steps.ViewModel.prototype.currentPage currentPage
   * @parent steps.ViewModel
   *
   * current page in interview
   */
  currentPage: {
    get () {
      return this.appState.currentPage
    }
  },

  hasAvatarPicker: {
    get () {
      const fields = this.currentPage.fields
      return _some(fields, field => field.type === 'useravatar')
    }
  },

  /**
   * @property {DefineList} steps.ViewModel.prototype.steps steps
   * @parent steps.ViewModel
   *
   * list of steps in the interview
   */
  steps: {
    get () {
      return this.interview.attr('steps')
    }
  },

  /**
   * @property {DefineMap} steps.ViewModel.prototype.currentStep currentStep
   * @parent steps.ViewModel
   *
   * current step in interview
   */
  currentStep: {
    get () {
      return this.currentPage && this.currentPage.step
    }
  },

  /**
   * @property {Boolean} steps.ViewModel.prototype.hasStep hasStep
   * @parent steps.ViewModel
   *
   * has a currentStep
   */
  hasStep: {
    get () {
      return !!this.currentStep
    }
  },

  /**
   * @property {DefineList} steps.ViewModel.prototype.nextSteps nextSteps
   * @parent steps.ViewModel
   *
   * list of steps after current step in interview
   */
  nextSteps: {
    get () {
      const currentStepIndex = this.getStepIndex(this.currentStep)
      return this.steps.slice(currentStepIndex + 1)
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
      return this.nextSteps.length
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
      let sidewalkHeight = this.sidewalkHeight
      let interviewSteps = this.steps.length
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
      let answers = this.interview.attr('answers')
      if (answers) {
        canReflect.eachKey(answers, function (answer) {
          if (answer && answer.name && answer.name.indexOf('A2J Step') !== -1) {
            // TODO: bind this properly, but setup binding on values
            const length = answer.values.length // eslint-disable-line
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
      const globalSkinTone = this.mState.avatarSkinTone
      const interviewSkinTone = this.interview.attr('avatarSkinTone')
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
      const globalHairColor = this.mState.avatarHairColor
      const interviewHairColor = this.interview.attr('avatarHairColor')
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
      const hasAvatarGender = !!this.interview.attr('avatarGender')
      const noGenderFieldInPage = this.currentPage && !this.currentPage.hasUserGenderOrAvatarField
      return hasAvatarGender && noGenderFieldInPage
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
      return this.showUserAvatar ? 'right' : 'front'
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
    get () {
      let sidewalkHeight = this.sidewalkHeight
      let sidewalkWidth = this.sidewalkWidth
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
    get () {
      return Math.asin(this.sidewalkHeight / this.sidewalkLength)
    }
  },

  /**
   * @property {Number} steps.ViewModel.prototype.guideBubbleTallerThanAvatar guideBubbleTallerThanAvatar
   * @parent steps.ViewModel
   *
   * whether the guide bubble is taller than the avatar
   * bubbles with useravatar field types are always styled `vertical` (see steps.stache)
   *
   */
  guideBubbleTallerThanAvatar: {
    get () {
      return this.hasAvatarPicker || this.guideBubbleHeight > this.avatarHeight
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
      return this.clientBubbleHeight > this.avatarHeight
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
    get () {
      let headerHeight = this.bodyHeight - this.sidewalkHeight
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

  clientBubbleHeight: {
    type: 'number'
  },

  avatarHeight: {
    type: 'number'
  },

  avatarOffsetTop: {
    type: 'number'
  },

  /**
   * @property {Number} steps.ViewModel.prototype.getStepIndex getStepIndex
   * @parent steps.ViewModel
   *
   * index for a given step, step.number and index do not have to match
   */
  getStepIndex (step) {
    if (!step || !this.steps) { return }
    const steps = this.steps.attr()
    const stepIndex = _findIndex(steps, ({ number }) => {
      return number === step.number
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
    const defaultText = this.interview.attr(`steps.${index}.text`)
    let variableText
    const variable = this.a2jStepVars[index]
    if (variable) {
      variableText = variable.values[1]
    }
    return variableText || defaultText
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
      ? this.avatarOffsetTop
      : cssBottom

    // reverse engineer less equation `calc(~"x% - " minusHeader) = bodyHeight`
    // solve above equation for x, which will be percentBelow
    let percentBelow = Math.ceil(((bottom + this.minusHeader) / this.bodyHeight) * 100)
    let percentAbove = (100 - percentBelow) / 100

    return (this.sidewalkHeight * percentAbove) / Math.tan(this.sidewalkAngleA)
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

    vm.bodyHeight = $('body').height()

    let $sidewalk = $('#sidewalk')
    vm.sidewalkWidth = $sidewalk.width()
    vm.sidewalkHeight = $sidewalk.height()

    let $guideBubble = $('#guideBubble')
    vm.guideBubbleHeight = $guideBubble.height()

    let $clientBubble = $('#clientBubble')
    vm.clientBubbleHeight = $clientBubble.height()

    let $avatar = $guideBubble.parent()
    vm.avatarHeight = $avatar.height()
    vm.avatarOffsetTop = $avatar.offset() && $avatar.offset().top

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
    const pages = this.interview.pages
    const pageName = this.appState.page

    if (pages && pageName) {
      const page = pages.find(pageName)

      // piwik tracking of learn-more clicks
      if (window._paq) {
        analytics.trackCustomEvent('Learn-More', 'from: ' + pageName, page.learn)
      }

      this.appState.modalContent = {
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
      }
    }
  },

  connectedCallback () {
    const vm = this
    const handleUpdateDomProperties = function () {
      vm.afterAvatarLoaded(() => vm.updateDomProperties())
    }
    const restoreUserAvatar = (ev, show) => {
      if (show) {
        const answers = vm.interview.answers
        const userAvatar = answers['user avatar']
        const previousUserAvatar = userAvatar.values[1]
        if (previousUserAvatar) {
          vm.appState.userAvatar.update(JSON.parse(previousUserAvatar))
        }
      }
      handleUpdateDomProperties()
    }
    // if saved answer exists, restoreUserAvatar when shown

    vm.appState.listenTo('showSlideoutContent', handleUpdateDomProperties)

    vm.listenTo('showUserAvatar', restoreUserAvatar)

    vm.listenTo('currentPage', handleUpdateDomProperties)
    // cleanup
    return () => {
      vm.stopListening('showUserAvatar', restoreUserAvatar)
      vm.appState.stopListening('showSlideoutContent', handleUpdateDomProperties)
      vm.stopListening('currentPage', handleUpdateDomProperties)
    }
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
    }
  },

  helpers: {
    zeroOrUndefined (number, options) {
      number = parseInt(number, 10)
      return (number === 0 || _isNaN(number))
    },

    add (a, b) {
      return a + b
    }
  }
})
