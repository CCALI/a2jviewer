import $ from 'jquery'
import CanMap from 'can-map'
import Component from 'can-component'
import template from './avatar.stache'
import joinURIs from 'can-util/js/join-uris/join-uris'
import {
  Face,
  Hair,
  Skin,
  Gender,
  getClassNameForSkin,
  getClassNameForHair
} from './colors'

import 'can-map-define'

function getBaseUrl () {
  return window.System.baseURL
}

function joinBaseUrl (path) {
  return joinURIs(getBaseUrl(), path)
}

/**
 * @property {can.Map} avatar.ViewModel
 * @parent <a2j-viewer-avatar>
 *
 * `<a2j-viewer-avatar>`'s viewModel.
 */
export let ViewerAvatarVM = CanMap.extend('ViewerAvatarVM', {
  define: {
    /**
     * @property {String} avatar.ViewModel.prototype.gender gender
     * @parent avatar.ViewModel
     *
     * avatar gender
     */
    gender: {
      type: Gender,
      value: Gender.defaultValue
    },

    /**
     * @property {String} avatar.ViewModel.prototype.skin skin
     * @parent avatar.ViewModel
     *
     * avatar skin tone
     */
    skin: {
      type: Skin,
      value: Skin.defaultValue
    },

    /**
     * @property {String} avatar.ViewModel.prototype.hair hair
     * @parent avatar.ViewModel
     *
     * avatar hair color
     */
    hair: {
      type: Hair,
      value: Hair.defaultValue
    },

    /**
     * @property {String} avatar.ViewModel.prototype.facing facing
     * @parent avatar.ViewModel
     *
     * avatar facing
     */
    facing: {
      type: Face,
      value: Face.defaultValue
    },

    isOld: {
      type: 'boolean',
      value: false
    },

    hasWheelchair: {
      type: 'boolean',
      value: false
    },

    /**
     * @property {String} avatar.ViewModel.prototype.avatarImageName avatarImageName
     * @parent avatar.ViewModel
     *
     * avatar image name is used for loading the svg
     */
    avatarImageName: {
      get () {
        const gender = this.attr('gender')
        const facing = this.attr('facing')
        const isOld = this.attr('isOld')
        const hasWheelchair = this.attr('hasWheelchair')

        return `avatar-${gender}${isOld ? '-old' : ''}${hasWheelchair ? '-chair' : ''}-${facing}.svg`
      }
    },

    /**
     * @property {String} avatar.ViewModel.prototype.svgInline svgInline
     * @parent avatar.ViewModel
     *
     * svg text rendered inline in avatar.stache'
     */
    svgInline: {
      value: ''
    },

    svgClassNames: {
      get () {
        const isGuide = this.attr('kind') === 'guide'
        const baseClass = isGuide ? 'avatar-guide' : 'avatar-user'
        const isMale = this.attr('gender') === 'male'
        const genderClass = isMale ? 'avatar-male' : 'avatar-female'
        const skinClass = getClassNameForSkin(this.attr('skin'))
        const hairClass = getClassNameForHair(this.attr('hair'))
        const oldClass = this.attr('isOld') ? 'avatar-old' : 'avatar-young'
        const wheelchairClass = this.attr('hasWheelchair') ? 'avatar-wheelchair' : 'avatar-standing'

        return `${baseClass} ${genderClass} ${skinClass} ${hairClass} ${oldClass} ${wheelchairClass}`
      }
    },

    /**
     * @property {String} avatar.ViewModel.prototype.svgBasePath svgBasePath
     * @parent avatar.ViewModel
     *
     * base path used with avatarImageName to load avatar svgs
     */
    svgBasePath: {
      get () {
        return joinBaseUrl('viewer/images/')
      }
    }
  },

  /**
   * @property {Function} avatar.ViewModel.prototype.fireAvatarLoaded fireAvatarLoaded
   * @parent avatar.ViewModel
   *
   * fires the avatarLoaded() function passed from steps.js to trigger dom updates
   */
  fireAvatarLoaded () {
    const avatarLoaded = this.attr('avatarLoaded')
    if (avatarLoaded) {
      avatarLoaded()
    }
  },

  loadAvatarSvg (el) {
    const vm = this
    const svgBasePath = vm.attr('svgBasePath')
    const avatarImageName = vm.attr('avatarImageName')

    $.ajax({
      url: svgBasePath + avatarImageName,
      dataType: 'text'
    }).then(data => {
      vm.attr('svgInline', data)
      this.updateSvgClass(el)
      vm.fireAvatarLoaded()
    })
  },

  updateSvgClass (el) {
    if (!el) {
      return
    }

    const classNames = this.attr('svgClassNames')
    const svg = $(el).find('.avatar-guide, .avatar-user')
    svg.attr('class', classNames)
  },

  connectedCallback (el) {
    this.loadAvatarSvg(el)
  }
})

/**
 * @module {Module} viewer/desktop/avatar/ <a2j-viewer-avatar>
 * @parent api-components
 *
 * this component displays an interview's avatar
 *
 * ## Use
 *
 * @codestart
 *   <a2j-viewer-avatar
 *    class="avatar-guide"
 *    {@avatar-loaded}="@avatarLoaded"
 *    {skin}="avatarSkinTone"
 *    {gender}="interview.guideAvatarGender"
 *    {facing}="guideAvatarFacingDirection" />
 * @codeend
 */
export default Component.extend({
  view: template,
  tag: 'a2j-viewer-avatar',
  ViewModel: ViewerAvatarVM,

  events: {
    // when the image name changes, we need to wait for the new svg to be
    // loaded to then make the adjustments to the css class name.
    '{viewModel} avatarImageName': function () {
      this.viewModel.loadAvatarSvg(this.element)
    },

    '{viewModel} svgClassNames': function () {
      this.viewModel.updateSvgClass(this.element)
    }
  },

  leakScope: true
})
