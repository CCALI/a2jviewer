import { ModalVM } from './modal'
import $ from 'jquery'
import CanMap from 'can-map'
import stache from 'can-stache'
import canReflect from 'can-reflect'
import F from 'funcunit'
import { assert } from 'chai'
import sinon from 'sinon'
import 'steal-mocha'
import 'caja/viewer/styles.less'
import 'can-map-define'
import 'caja/viewer/mobile/util/helpers'

describe('<a2j-modal> ', function () {
  describe('Component', function () {
    let vm, pauseActivePlayersSpy
    beforeEach(function () {
      const interview = {
        getPageByName () {
          return new CanMap()
        }
      }

      const rState = new CanMap({ page: 'foo' })
      const mState = new CanMap({ fileDataURL: '/CAJA/js/images/' })
      const logic = new CanMap({ eval (html) { return html } })
      const ModalContent = CanMap.extend({
        define: {
          answerName: { value: '' },
          title: { value: '' },
          text: { value: '' },
          imageURL: { value: '' },
          mediaLabel: { value: '' },
          audioURL: { value: '' },
          videoURL: { value: '' }
        }
      })
      const modalContent = new ModalContent()
      pauseActivePlayersSpy = sinon.spy()

      const frag = stache(
        `<a2j-modal class="bootstrap-styles"
          mState:from="mState"
          logic:from="logic"
          interview:from="interview"
          modalContent:bind="modalContent"
          previewActive:from="rState.previewActive"
          lastVisitedPageName:from="rState.lastVisitedPageName"
          repeatVarValue:from="rState.repeatVarValue"
          />`
      )
      vm = new ModalVM({ interview, rState, logic, mState, modalContent, pauseActivePlayers: pauseActivePlayersSpy })

      $('#test-area').html(frag(vm))
      // vm = $('a2j-modal')[0].viewModel
    })

    afterEach(function () {
      $('#test-area').empty()
    })

    it('renders image tag if modalContent includes imageURL', function (done) {
      const helpImageURL = 'ui-icons_ffffff_256x240.png'

      canReflect.assign(vm.modalContent = {
        imageURL: helpImageURL
      })

      F('img.modal-image').exists()
      F('img.modal-image').attr('src', '/CAJA/js/images/ui-icons_ffffff_256x240.png')

      F(done)
    })

    it('renders image AltText if modalContent includes altText', function (done) {
      const helpImageURL = 'ui-icons_ffffff_256x240.png'

      canReflect.assign(vm.modalContent = {
        imageURL: helpImageURL,
        altText: 'this is a bunch of icons'
      })

      F('img.modal-image').exists()
      F('img.modal-image').attr('alt', 'this is a bunch of icons')

      F(done)
    })

    it('renders audio tag if page includes helpAudioURL', function (done) {
      const helpAudioURL = 'pings.ogg'

      vm.modalContent = { audioURL: helpAudioURL }

      F('audio-player').exists()

      F(done)
    })

    it('renders image tag if page includes helpVideoURL (gif)', function (done) {
      const helpVideoURL = 'panda.gif'
      const altText = 'this is a panda'

      vm.modalContent = { videoURL: helpVideoURL, helpAltText: altText }
      F('img.modal-video').exists()
      F('img.modal-video').attr('src', '/CAJA/js/images/panda.gif')

      F(done)
    })

    it('renders video tag if page includes helpVideoURL (other)', function (done) {
      const helpVideoURL = 'pings.ogg'

      vm.modalContent = { videoURL: helpVideoURL }
      F('video.modal-video').exists()
      F('video.modal-video').attr('src', '/CAJA/js/images/pings.ogg')

      F(done)
    })

    it('renders video transcript text if modalContent includes helpReader property', function (done) {
      canReflect.assign(vm.modalContent = { videoURL: 'pings.ogg', helpReader: 'some transcript text' })

      F('button.btn.btn-secondary.btn-sm.btn-block').exists().click(() => {
        F('p.video-transcript-text').text(/some transcript text/)
        F(done)
      })
    })

    it('renders an expanded text area if page includes answerName (a2j variable name)', function (done) {
      vm.modalContent = { answerName: 'longAnswerTE', textlongValue: 'some really long text' }
      F('textarea.expanded-textarea').exists()

      F(done)
    })

    it('targets a new tab (_blank) if question text contains a link', function (done) {
      canReflect.assign(vm.modalContent = { title: '', text: '<p>My popup text <a href="http://www.google.com">lasercats</a></p>' })
      // prevent the tab from opening
      $('a').click((ev) => {
        ev.preventDefault()
      })
      F('.modal-body p a').exists().click(function () {
        F('.modal-body p a').attr('target', '_blank')
        F(done)
      })
    })

    it('pauseActivePlayers()', function () {
      // simulate DOM insert
      vm.connectedCallback()
      // open modal
      $('#pageModal').modal('show')
      // close modal
      $('#pageModal').modal('hide')

      assert.isTrue(pauseActivePlayersSpy.calledOnce, 'should fire pauseActivePlayers() on modal close to pause audio and video players')
    })
  })
})
