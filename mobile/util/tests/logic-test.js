import { assert } from 'chai'
import Answer from 'caja/viewer/models/answer'
import Answers from 'caja/viewer/models/answers'
import Logic from 'caja/viewer/mobile/util/logic'
import AnswerVM from 'caja/viewer/models/answervm'
import Interview from 'caja/viewer/models/interview'

import 'steal-mocha'

describe('Logic', function () {
  let logic
  let answers
  let interview

  beforeEach(function () {
    answers = new Answers({
      firstname: {
        type: 'text',
        values: [null],
        name: 'firstname'
      },
      middlename: {
        type: 'text',
        values: [null],
        name: 'middlename'
      },
      lastname: {
        type: 'text',
        values: [null],
        name: 'lastname'
      }
    })

    interview = new Interview({
      _pages: {
        '1-Introduction': {
          name: '1-Introduction',
          fields: [
            { name: 'firstname', type: 'text' },
            { name: 'middlename', type: 'text' },
            { name: 'lastname', type: 'text' }
          ]
        },
        '1-job loss date': { name: '1-Introduction' }
      },
      pages: [{
        name: '1-Introduction',
        fields: [
          { name: 'firstname', type: 'text' },
          { name: 'middlename', type: 'text' },
          { name: 'lastname', type: 'text' }
        ]
      }, {
        name: '1-Introduction',
        fields: []
      }],
      answers: answers
    })

    let avm = new AnswerVM({ answer: answers.attr('firstname') })
    avm.attr('values', 'John')

    avm = new AnswerVM({ answer: answers.attr('lastname') })
    avm.attr('values', 'Doe')

    logic = new Logic({ interview })
  })

  it('simple set', function () {
    logic.exec('set firstname to "Bob"')

    const expected = {
      firstname: {
        name: 'firstname',
        type: 'text',
        values: [null, 'Bob']
      },
      middlename: {
        type: 'text',
        values: [null],
        name: 'middlename'
      },
      lastname: {
        name: 'lastname',
        type: 'text',
        values: [null, 'Doe']
      }
    }

    assert.deepEqual(answers.serialize(), expected, 'values set')
  })

  it('simple goto', function () {
    let codeBefore = 'GOTO "1-job loss date"'
    logic.exec(codeBefore)

    assert.equal(logic.attr('gotoPage'), '1-job loss date', 'target page set')
  })

  it('conditional goto', function () {
    let codeBefore =
      `if firstname = "John"<BR/>
      GOTO "1-job loss date"<BR/>
      end if`

    logic.exec(codeBefore)
    assert.equal(logic.attr('gotoPage'), '1-job loss date', 'target page set')
  })

  it('eval text', function () {
    assert.equal(logic.eval('%%1+1%%'), '2', 'simple eval')
    assert.equal(logic.eval('%%firstname%%'), 'John', 'simple token interpolation')

    assert.equal(
      logic.eval('%%firstname%% %%FIRSTname%%'),
      'John John',
      'multiple token interpolation w/ case'
    )
  })

  it('eval text updates when answers change', function () {
    assert.equal(logic.eval('%%firstname%%'), 'John', 'simple token interpolation')

    // change answer
    answers.varSet('firstname', 'JessBob', 1)
    assert.equal(logic.eval('%%firstname%%'), 'JessBob', 'simple token interpolation')
  })

  it('conditional set w/ linebreaks', function () {
    let str =
      `if middlename = ""<BR/>
      set fullname to firstname + " " + lastname<BR/>
      else<BR/>
      set fullname to firstname + " " + middlename + " " + lastname<BR/>
      end if`

    let avm = new AnswerVM({ answer: answers.attr('middlename') })
    avm.attr('values', '')

    answers.attr('fullname', new Answer({
      name: 'fullname',
      type: 'text',
      repeating: false,
      values: [null]
    }))

    logic.exec(str)

    assert.deepEqual(answers.serialize(), {
      fullname: {
        name: 'fullname',
        repeating: false,
        type: 'text',
        values: [null, 'John Doe']
      },
      firstname: {
        name: 'firstname',
        type: 'text',
        values: [null, 'John']
      },
      lastname: {
        name: 'lastname',
        type: 'text',
        values: [null, 'Doe']
      },
      middlename: {
        name: 'middlename',
        type: 'text',
        values: [null, '']
      }
    }, 'values set without extra whitespace')

    // setting middlename
    avm.attr('values', 'T')

    logic.exec(str)

    assert.deepEqual(answers.serialize(), {
      fullname: {
        name: 'fullname',
        repeating: false,
        type: 'text',
        values: [null, 'John T Doe']
      },
      firstname: {
        name: 'firstname',
        type: 'text',
        values: [null, 'John']
      },
      lastname: {
        name: 'lastname',
        type: 'text',
        values: [null, 'Doe']
      },
      middlename: {
        name: 'middlename',
        type: 'text',
        values: [null, 'T']
      }
    }, 'middle name set')
  })

  describe('conditional goto with linebreaks', function () {
    const code =
      `IF  [ChildCount] = [Number of children NU] <BR/>
        GOTO "1- Do you have any?"<BR/>
      ELSE<BR/>
        GOTO "2- Child's name" <BR/>
      END IF`

    beforeEach(function () {
      answers = new Answers({
        childcount: {
          type: 'Number',
          values: [null, '2'],
          name: 'ChildCount'
        },
        'number of children nu': {
          type: 'Number',
          values: [null, '2'],
          name: 'Number of children NU'
        }
      })

      interview = new Interview({
        answers,
        _pages: {
          '1- Do you have any?': {},
          '2- Child\'s name': {}
        }
      })

      logic = new Logic({ interview })
    })

    it('evaluates to if block correctly', function () {
      logic.exec(code)
      assert.equal(logic.attr('gotoPage'), '1- Do you have any?')
    })

    it('evaluates to else block correctly', function () {
      answers.attr('childcount').attr('values', [null, '1'])

      logic.exec(code)

      assert.equal(logic.attr('gotoPage'), '2- Child\'s name')
    })
  })
})
