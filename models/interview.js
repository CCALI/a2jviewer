import $ from 'jquery'
import CanList from 'can-list'
import Model from 'can-model'
import canAjax from 'can-ajax'
import queues from 'can-queues'
import _forEach from 'lodash/forEach'
import _last from 'lodash/last'
import _keys from 'lodash/keys'
import _find from 'lodash/find'
import _assign from 'lodash/assign'
import Page from 'caja/viewer/models/page'
import _includes from 'lodash/includes'
import _isString from 'lodash/isString'
import Answers from 'caja/viewer/models/answers'
import parser from 'caja/viewer/mobile/util/parser'
import { Hair, Skin } from 'caja/viewer/desktop/avatar/colors'
import setupPromise from 'can-reflect-promise'
import naturalCompare from 'string-natural-compare/'

import 'can-map-define'

/**
 * @module {function} Interview
 * @inherits can.Model
 * @parent api-models
 *
 * The **Interview** model represents a sample interview or an interview created
 * by the logged in user.
 *
 *  @codestart
 *    Interview
 *      .findOne({ url: 'path/to/interview' })
 *      .then(function(interview) {});
 *  @codeend
 *
 */

function getInterviewPath (url) {
  if (_isString(url) && url.length) {
    let parts = url.split('/')

    // drop the interview filename
    parts.pop()

    return `${parts.join('/')}/`
  }
}

const Interview = Model.extend('InterviewModel', {
  findOne (data, success, error) {
    let dfd = $.Deferred()
    setupPromise(dfd)
    let resumeDfd = $.Deferred()
    setupPromise(resumeDfd)
    let interviewPath = getInterviewPath(data.url)

    let interviewDfd = canAjax({
      url: data.url
    })

    interviewDfd.then(function (interview) {
      if (data.resume) {
        canAjax({
          url: data.resume,
          dataType: 'text'
        })
          .then(function (anx) {
            var vars = parser.parseJSON(anx, interview.vars)
            interview.vars = vars

            resumeDfd.resolve(interview)
          })
          .catch(function () {
            resumeDfd.reject()
          })
      } else {
        resumeDfd.resolve(interview)
      }
    })

    resumeDfd.then(function (interview) {
      dfd.resolve(_assign({ interviewPath }, interview))
    })

    resumeDfd.fail(function () {
      dfd.reject()
    })

    return dfd.then(success, error)
  },

  parseModel (data) {
    data.steps = data.steps || []
    data._pages = data.pages
    data.pages = []

    _forEach(data._pages, function (p) {
      const page = _assign({}, p)
      const step = data.steps[page.step]

      // put the actual step object in the page.
      page.step = step
      data.pages.push(page)
    })

    _forEach(data.vars, function (v) {
      v.values = v.values || [null]
    })

    return data
  }
}, {
  define: {
    answers: {
      Type: Answers,

      value () {
        return new Answers()
      }
    },

    pages: {
      Type: Page.List
    },

    steps: {
      get (steps) {
        const pages = this.attr('pages')

        // This is an array of step numbers which have pages associated to them
        const stepsNumbers = pages.map(p => p.attr('step.number')).attr()

        // Filters all the steps that own pages.
        return steps.filter(s => _includes(stepsNumbers, s.attr('number')))
      }
    },

    guideAvatarGender: {
      serialize: false,
      value: 'female',
      get () {
        let gender = this.attr('guideGender') || ''
        return gender.toLowerCase() === 'male' ? 'male' : 'female'
      }
    },

    avatarSkinTone: {
      type: Skin,
      value: Skin.defaultValue
    },

    avatarHairColor: {
      type: Hair,
      value: Hair.defaultValue
    },

    /**
     * @property {String} Guide.prototype.interviewPath interviewPath
     *
     * The path of the interview in the server; when the viewer is running
     * standalone we get the path from the url used to retrieve the interview,
     * in this case the property is set in `Interview.findOne`. When running
     * in preview mode (author app), we get the path from a global variable;
     * this path is used to during the normalization of the path of some custom
     * images provided by the author (like `logoImage`, or `endImage`).
     */
    interviewPath: {
      serialize: false,
      get (path) {
        return window.gGuidePath ? window.gGuidePath : path
      }
    },

    avatarGender: {
      serialize: false,
      get () {
        let result
        const answers = this.attr('answers')
        const userAvatar = answers.attr('user avatar')
        const gender = answers.attr('user gender')

        if (userAvatar || gender) {
          const genderValues = (gender && gender.attr('values').attr()) || []
          const userAvatarValues = (userAvatar && userAvatar.attr('values').attr()) || []
          const userAvatarValue = userAvatarValues[1] && JSON.parse(userAvatarValues[1]).gender
          let lastValue = userAvatarValue || genderValues.pop()

          if (_isString(lastValue) && lastValue.length) {
            lastValue = lastValue.toLowerCase()

            switch (lastValue) {
              case 'm':
              case 'male':
                result = 'male'
                break

              case 'f':
              case 'female':
                result = 'female'
                break
            }
          }
        }

        return result
      }
    },

    /**
     * @property {List} Guide.prototype.variablesList variablesList
     *
     * Returns a list of the interview variables, the variables come from the
     * server in `interview.vars`, which is an object where each key is a var
     * name and its value is an object with the properties of a variable (name,
     * repeating, flag, value...), having an actual list is handy for rendering
     * purposes.
     *
     */
    variablesList: {
      serialize: false,

      get () {
        let list = []
        let answers = this.attr('answers')
        let vars = this.attr('vars').attr()

        _keys(vars).forEach(function (key) {
          let variable = vars[key]
          let answer = answers.attr(key.toLowerCase())

          let values = answer ? answer.attr('values').attr() : variable.values

          if (!variable.repeating) {
            // handle [ null ] or [ null, "foo" ] scenarios
            list.push({
              value: _last(values),
              name: variable.name,
              repeating: null
            })
          } else if (values.length <= 1) {
            // repeating variable with no values ie. [ null ]
            list.push({
              value: null,
              name: variable.name,
              repeating: null
            })
          } else {
            // repeating variable with values
            values.forEach((item, i) => {
              if (item !== null) {
                list.push({
                  value: item,
                  name: variable.name,
                  repeating: i
                })
              }
            })
          }
        })

        const sortedVarList = list.sort(function (a, b) { return naturalCompare.caseInsensitive(a.name, b.name) })
        return new CanList(sortedVarList)
      }
    }
  },

  clearAnswers () {
    // batch.start required for Author preview mode with long var/answer lists
    queues.batch.start()

    this.attr('answers').forEach((answer) => {
      if (answer && answer.attr && answer.attr('values')) {
        answer.attr('values', [null])
      }
    })

    queues.batch.stop()
  },

  createGuide () {
    var answers = this.attr('answers')

    return {
      pages: this._pages,
      varExists: answers.varExists.bind(answers),
      varCreate: answers.varCreate.bind(answers),
      varGet: answers.varGet.bind(answers),
      varSet: answers.varSet.bind(answers)
    }
  },

  getPageByName (name) {
    let pages = this.attr('pages')

    return _find(pages, function (page) {
      return page.attr('name') === name
    })
  }
})

export default Interview
