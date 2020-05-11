import $ from 'jquery'
import Model from 'can-model'
import Answers from 'caja/viewer/models/answers'
import Parser from 'caja/viewer/mobile/util/parser'

import 'can-map-define'
import 'can-construct-super'
import 'can-map-backup'

export default Model.extend('PersistedStateModel', {
  findOne () {
    return Promise.resolve({})
  }
}, {

  define: {
    answers: {
      Value: Answers,
      Type: Answers
    },

    visited: {
      value: {}
    },

    setDataURL: {}
  },

  init () {
    this.backup()
  },

  save () {
    const url = this.attr('autoSetDataURL')

    // parse and send xml to server
    const anx = Parser.parseANX(this.serialize().answers)
    const data = { AnswerKey: anx }

    return $.ajax({ url, type: 'POST', data })
      .then(res => {
        this.backup()
        return res
      })
  }
})
