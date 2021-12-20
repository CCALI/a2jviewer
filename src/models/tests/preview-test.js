import { assert } from 'chai'
import Preview from '~/src/models/preview'

import '~/src/models/tests/fixtures/'

import 'steal-mocha'

describe('Preview model', function () {
  describe('findOne', function () {
    it('can return html', function (done) {
      Preview.findOne({
        answers: '{}',
        fileDataUrl: '/Users/chasen/Sites/CCALI/userfiles/dev/guides/Guide922/',
        guideId: '922',
        guideTitle: 'Demo A2J Guided Interview and DAT Text Template for Bitovi Accessibility Audit'
      }).then(response => {
        assert.equal(response.html.indexOf('<!doctype html>'), 1)
        done()
      }, error => {
        done(error)
      })
    })
  })
})
