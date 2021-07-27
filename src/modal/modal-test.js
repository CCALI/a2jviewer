import { ModalVM } from './modal'
import $ from 'jquery'
import stache from 'can-stache'
import AppState from '~/src/models/app-state'
import Interview from '~/src/models/interview'
import Logic from '~/src/mobile/util/logic'
import MemoryState from '~/src/models/memory-state'
import F from 'funcunit'
import { assert } from 'chai'
import sinon from 'sinon'
import 'steal-mocha'
import '~/styles.less'
import 'can-map-define'
import '~/src/mobile/util/helpers'

describe('<a2j-modal> ', function () {
  describe('Component', function () {
    let vm, pauseActivePlayersSpy
    beforeEach(function () {
      const interview = new Interview()

      const appState = new AppState({ page: 'foo' })
      const mState = new MemoryState({ fileDataURL: '../../tests/images/' })
      const logic = new Logic({
        interview,
        eval (html) { return html }
      })
      pauseActivePlayersSpy = sinon.spy()

      const frag = stache(
        `<a2j-modal
          appState:from="appState"
          modalContent:from="appState.modalContent"
          mState:from="mState"
          logic:from="logic"
          interview:from="interview"
          class="bootstrap-styles" />`
      )
      vm = new ModalVM({ interview, appState, logic, mState, pauseActivePlayers: pauseActivePlayersSpy })
      // stub app-state parseText helper
      stache.registerHelper('parseText', (text) => text)

      $('#test-area').html(frag(vm))
    })

    afterEach(function () {
      $('#test-area').empty()
    })

    it('renders image tag if modalContent includes imageURL', function (done) {
      const helpImageURL = 'ui-icons_ffffff_256x240.png'

      vm.appState.modalContent = {
        imageURL: helpImageURL
      }

      F('img.modal-image').exists()
      F('img.modal-image').attr('src', '../../tests/images/ui-icons_ffffff_256x240.png')

      F(done)
    })

    it('renders image AltText if modalContent includes altText', function (done) {
      const helpImageURL = 'ui-icons_ffffff_256x240.png'

      vm.appState.modalContent = {
        imageURL: helpImageURL,
        altText: 'this is a bunch of icons'
      }

      F('img.modal-image').exists()
      F('img.modal-image').attr('alt', 'this is a bunch of icons')

      F(done)
    })

    it('renders audio tag if page includes helpAudioURL', function (done) {
      const helpAudioURL = 'pings.ogg'

      vm.appState.modalContent = { audioURL: helpAudioURL }

      F('audio-player').exists()

      F(done)
    })

    it('renders image tag if page includes helpVideoURL (gif)', function (done) {
      const helpVideoURL = 'panda.gif'
      const helpAltText = 'this is a panda'

      vm.appState.modalContent = { videoURL: helpVideoURL, altText: helpAltText }
      F('img.modal-video').exists()
      F('img.modal-video').attr('src', '../../tests/images/panda.gif')

      F(done)
    })

    it('renders video tag if page includes helpVideoURL (other)', function (done) {
      const helpVideoURL = 'pings.ogg'

      vm.appState.modalContent = { videoURL: helpVideoURL }
      F('video.modal-video').exists()
      F('video.modal-video').attr('src', '../../tests/images/pings.ogg')

      F(done)
    })

    it('renders video transcript text if modalContent includes helpReader property', function (done) {
      vm.appState.modalContent = { videoURL: 'pings.ogg', helpReader: 'some transcript text' }

      F('button.btn.btn-secondary.btn-sm.btn-block').exists().click(() => {
        F('p.video-transcript-text').text(/some transcript text/)
        F(done)
      })
    })

    it('renders an expanded text area if page includes answerName (a2j variable name)', function (done) {
      vm.appState.modalContent = {
        textlongFieldVM: {
          field: {
            name: 'TextLongName'
          }
        }
      }
      F('textarea.expanded-textarea').exists()

      F(done)
    })

    it('targets a new tab (_blank) if question text contains a link', function (done) {
      vm.appState.modalContent = { title: '', text: '<p>My popup text <a href="http://www.google.com">lasercats</a></p>' }
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
      // coerced to ModelContent type with sane defaults
      vm.modalContent = {}

      // open modal
      $('#pageModal').modal('show')
      // close modal
      $('#pageModal').modal('hide')

      assert.isTrue(pauseActivePlayersSpy.calledOnce, 'should fire pauseActivePlayers() on modal close to pause audio and video players')
    })
  })
})
