import { assert } from 'chai'
import Answer from '~/src/models/answer'
import Answers from '~/src/models/answers'
import Logic from '~/src/mobile/util/logic'
import Interview from '~/src/models/interview'

import 'steal-mocha'

describe('Logic', function () {
  let logic
  let answers
  let interview

  beforeEach(function () {
    answers = new Answers({
      firstname: new Answer({
        type: 'text',
        values: [null],
        name: 'firstname'
      }),
      middlename: new Answer({
        type: 'text',
        values: [null],
        name: 'middlename'
      }),
      lastname: new Answer({
        type: 'text',
        values: [null],
        name: 'lastname'
      })
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

    answers.varSet('firstname', 'John')
    answers.varSet('lastname', 'Doe')

    logic = new Logic({ interview })
  })

  it('simple set', function () {
    logic.exec('set firstname to "Bob"')

    const expected = {
      firstname: {
        name: 'firstname',
        type: 'text',
        repeating: false,
        values: [null, 'Bob']
      },
      middlename: {
        name: 'middlename',
        type: 'text',
        repeating: false,
        values: [null]
      },
      lastname: {
        name: 'lastname',
        type: 'text',
        repeating: false,
        values: [null, 'Doe']
      }
    }

    assert.deepEqual(answers.serialize(), expected, 'values set')
  })

  it('simple goto', function () {
    const codeBefore = 'GOTO "1-job loss date"'
    logic.exec(codeBefore)

    assert.equal(logic.attr('gotoPage'), '1-job loss date', 'target page set')
  })

  it('conditional goto', function () {
    const codeBefore =
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
    const str =
      `if middlename = ""<BR/>
      set fullname to firstname + " " + lastname<BR/>
      else<BR/>
      set fullname to firstname + " " + middlename + " " + lastname<BR/>
      end if`

    answers.varSet('middlename', '')
    answers.varCreate('fullname', 'text', false)

    logic.exec(str)

    assert.deepEqual(answers.serialize(), {
      fullname: {
        name: 'fullname',
        type: 'text',
        repeating: false,
        values: [null, 'John Doe']
      },
      firstname: {
        name: 'firstname',
        type: 'text',
        repeating: false,
        values: [null, 'John']
      },
      lastname: {
        name: 'lastname',
        type: 'text',
        repeating: false,
        values: [null, 'Doe']
      },
      middlename: {
        name: 'middlename',
        type: 'text',
        repeating: false,
        values: [null, '']
      }
    }, 'values set without extra whitespace')

    // setting middlename
    answers.varSet('middlename', 'T')

    logic.exec(str)

    assert.deepEqual(answers.serialize(), {
      fullname: {
        name: 'fullname',
        type: 'text',
        repeating: false,
        values: [null, 'John T Doe']
      },
      firstname: {
        name: 'firstname',
        type: 'text',
        repeating: false,
        values: [null, 'John']
      },
      lastname: {
        name: 'lastname',
        type: 'text',
        repeating: false,
        values: [null, 'Doe']
      },
      middlename: {
        name: 'middlename',
        type: 'text',
        repeating: false,
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
      answers.varSet('childcount', 1)

      logic.exec(code)

      assert.equal(logic.attr('gotoPage'), '2- Child\'s name')
    })
  })
})
