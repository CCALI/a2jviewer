import $ from 'jquery'
import DefineMap from 'can-define/map/map'
import Component from 'can-component'
import template from './modal.stache'
import { analytics } from 'caja/viewer/util/analytics'

import 'bootstrap/js/modal'
import 'can-map-define'
import 'lightbox2/dist/js/lightbox'
import 'lightbox2/dist/css/lightbox.css'

export let ModalVM = DefineMap.extend('ViewerModalVM', {
  // passed in
  modalContent: {},
  repeatVarValue: {},
  lastVisitedPageName: {},
  logic: {},
  interview: {},
  previewActive: {},

  showTranscript: { default: false },

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
    // answer names are always lowercase versions in the answers map
    const answerName = this.modalContent.answerName && this.modalContent.answerName.toLowerCase()
    if (answerName) {
      const newValue = this.modalContent.textlongValue
      const field = this.modalContent.field
      const textlongVM = this.modalContent.textlongVM
      textlongVM.fireModalClose(field, newValue, textlongVM)
    }

    $('body').removeClass('bootstrap-styles')
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
      if (!this.previewActive) {
        $('body').addClass('bootstrap-styles')
      }
    }
    const fireCloseModalHandler = () => {
      // pause audio/video before close
      this.pauseActivePlayers()

      // preserves `this` for handler
      this.closeModalHandler()
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
      var stripped = html.replace(/<[^>]*>/g, '')
      return stripped
    }
  },

  events: {
    '#pageModal keydown': function (el, ev) {
      // esc key closing modal
      if (ev.keyCode === 27) {
        this.viewModel.modalContent.attr('textlongValue', ev.target.value)
        this.viewModel.closeModalHandler()
      }
    },

    '{viewModel} modalContent': function (vm, ev, newVal) {
      if (newVal) {
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

          // popup content is only title, text, and textAudio
          // but title is internal descriptor so set to empty string
          vm.modalContent = {
            // undefined values prevent stache warnings
            answerName: undefined,
            title: '',
            text: page.text,
            imageURL: undefined,
            mediaLabel: undefined,
            audioURL: page.textAudioURL,
            videoURL: undefined
          }
        }
      } else { // external link
        const $el = $(el)
        $el.attr('target', '_blank')
      }
    }
  }
})
