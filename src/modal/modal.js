import $ from 'jquery'
import DefineMap from 'can-define/map/map'
import Component from 'can-component'
import ModalContent from '~/src/models/modal-content'
import template from './modal.stache'
import { analytics } from '~/src/util/analytics'

import 'bootstrap/js/modal'
import 'can-map-define'
import 'lightbox2/dist/js/lightbox'
import 'lightbox2/dist/css/lightbox.css'

export const ModalVM = DefineMap.extend('ViewerModalVM', {
  // passed in from app.stache
  logic: {},
  interview: {},
  appState: {},

  // set in appState and cleared here on close
  modalContent: {
    Type: ModalContent
  },
  repeatVarValue: {
    get () {
      return this.appState.repeatVarValue
    }
  },
  lastVisitedPageName: {
    get () {
      const vps = this.appState.visitedPages
      const cvp = vps && vps.selected
      return (cvp && cvp.interviewPage.name) || ''
    }
  },
  previewActive: {
    get () {
      return this.appState.previewActive
    }
  },

  hasTextlongName: {
    get () {
      return this.modalContent && this.modalContent.textlongFieldVM && this.modalContent.textlongFieldVM.field && this.modalContent.textlongFieldVM.field.name
    }
  },

  availableLength: {
    get () {
      return this.modalContent && this.modalContent.textlongFieldVM.availableLength
    }
  },

  overCharacterLimit: {
    get () {
      return this.modalContent && this.modalContent.textlongFieldVM.overCharacterLimit
    }
  },

  get allowFullscreen () {
    return this.modalContent && !!this.modalContent.allowFullscreen
  },

  fullscreen: {
    type: 'boolean', default: false
  },

  toggleFullscreen () {
    this.fullscreen = this.allowFullscreen && !this.fullscreen
    return this.fullscreen
  },

  exitFullscreen () {
    this.fullscreen = false
    return false
  },

  showTranscript: { default: false },
  triggeringElement: {},

  toggleShowTranscript () {
    this.showTranscript = !this.showTranscript
    if (this.showTranscript) {
      this.scrollToVideoTop()
    }
  },

  scrollToVideoTop () {
    const modalVideoElement = document.querySelector('video.modal-video')
    $('.modal-body').scrollTop(modalVideoElement.offsetTop)
  },

  closeModalHandler () {
    $('body').removeClass('bootstrap-styles')

    // Return focus to the element that opened this modal
    if (this.triggeringElement) {
      this.triggeringElement.focus()
    }

    // clear for next modal use
    this.modalContent = null
  },

  pauseActivePlayers () {
    // stop video player
    const modalVideoPlayer = $('video.modal-video')[0]
    if (modalVideoPlayer) { modalVideoPlayer.pause() }

    // togglePlay resets play/pause control icon on custom Author audio player
    const modalAudioPlayer = $('audio-player.modal-audio')[0]
    if (modalAudioPlayer) {
      const player = modalAudioPlayer.viewModel
      if (player.isPlaying) { player.togglePlay() }
    }
  },

  connectedCallback (el) {
    const showModalHandler = () => {
      // modal-backdrop blocks when debug-panel is open in Author previewMode
      // TODO: should be easier to manage when debug-panel is moved to viewer
      if (this.previewActive) {
        $('.modal-backdrop').remove()
      }
      if (!this.previewActive) {
        $('body').addClass('bootstrap-styles')
      }
      $('#pageModal').attr('aria-hidden', false)
    }
    const fireCloseModalHandler = () => {
      // pause audio/video before close
      this.pauseActivePlayers()

      // preserves `this` for handler
      this.closeModalHandler()
      $('#pageModal').attr('aria-hidden', true)
    }

    $('#pageModal').on('shown.bs.modal', showModalHandler)
    $('#pageModal').on('hidden.bs.modal', fireCloseModalHandler)

    return () => {
      $('#pageModal').off('shown.bs.modal', showModalHandler)
      $('#pageModal').off('hidden.bs.modal', fireCloseModalHandler)
    }
  }
})

export default Component.extend({
  view: template,
  leakScope: false,
  tag: 'a2j-modal',
  ViewModel: ModalVM,

  helpers: {
    isGif (url = '') {
      const ext = url.split('.').pop()
      return ext.toLowerCase() === 'gif'
    },

    eval (str) {
      str = typeof str === 'function' ? str() : str
      return this.logic.eval(str)
    },

    cleanHTML (html) {
      const stripped = (html || '').replace(/<[^>]*>/g, '')
      return stripped
    }
  },

  events: {
    '#pageModal keydown': function (el, ev) {
      // esc key closing modal
      if (ev.keyCode === 27) {
        this.viewModel.closeModalHandler()
      }
    },

    '{viewModel} modalContent': function (vm, ev, newVal) {
      if (newVal) {
        vm.triggeringElement = document.activeElement
        $(this.element).find('#pageModal').modal()
      }
    },

    'a click': function (el, ev) {
      // popup from within a popup
      if (el.href && el.href.toLowerCase().indexOf('popup') === 0) {
        ev.preventDefault()
        const vm = this.viewModel
        const pages = vm.interview.pages

        if (pages) {
          const pageName = el.href.replace('popup://', '').replace('POPUP://', '').replace('/', '') // pathname is not supported in FF and IE.
          const page = pages.find(pageName)
          const sourcePageName = this.scope.lastVisitedPageName

          // piwik tracking of popups
          if (window._paq) {
            analytics.trackCustomEvent('Pop-Up', 'from: ' + sourcePageName, pageName)
          }

          // popups now have text, audio, video and their alt-text values
          // but title is internal descriptor so set to empty string
          vm.modalContent.assign({
            title: '',
            text: page.text,
            textAudioURL: (page.textAudioURL || '').trim(),
            imageURL: (page.helpImageURL || '').trim(),
            altText: page.helpAltText,
            mediaLabel: page.helpMediaLabel,
            audioURL: (page.helpAudioURL || '').trim(),
            videoURL: (page.helpVideoURL || '').trim(),
            helpReader: page.helpReader
          })
        }
      } else { // external link
        const $el = $(el)
        $el.attr('target', '_blank')
      }
    }
  }
})
