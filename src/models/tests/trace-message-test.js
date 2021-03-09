import { assert } from 'chai'
import TraceMessage, { LogItem, Messages, Message, Fragment } from '~/src/models/trace-message'

import 'steal-mocha'

describe('TraceMessage Model', () => {
  let traceMessage,
    testMessage

  beforeEach(() => {
    traceMessage = new TraceMessage()
    testMessage = { key: 'num', fragments: [ {format: 'var', msg: 'num'}, {format: '', msg: ' = '}, {format: 'val', msg: '5'} ] }
  })

  afterEach(() => {
    traceMessage = null
  })

  it('TraceMessage initializes to a useable state', () => {
    assert.deepEqual(traceMessage.messageLog.serialize(), {}, 'messageLog should be empty to start')
    // emulate page navigation mapping messages to currentPageName
    traceMessage.currentPageName = 'Intro'

    const logItem = traceMessage.messageLog['Intro']
    assert.equal(logItem instanceof LogItem, true, 'messageLog items should be instance of LogItem Map')

    const pageMessages = logItem.messages
    assert.equal(pageMessages instanceof Messages, true, 'logItem messages should be instance of Messages Map')
  })

  it('addMessage with correct inherited Types', () => {
    // emulate page navigation as messages belong to currentPageName
    traceMessage.currentPageName = 'Intro'
    traceMessage.addMessage(testMessage)

    const pageMessages = traceMessage.messageLog['Intro'].messages
    const addedMessage = pageMessages['num']

    // test for nested Types
    assert.equal(addedMessage instanceof Message, true, 'added message should be instance of Message')
    assert.equal(addedMessage.fragments instanceof Fragment.List, true, 'added fragments should be instance of Fragment.List')
    assert.equal(addedMessage.fragments[0] instanceof Fragment, true, 'each fragment should be an instance of Fragment')

    const serializedMessage = addedMessage.serialize()
    assert.deepEqual(serializedMessage, testMessage, 'should add new message to messageLog Map')
  })

  it('clearMessageLog', () => {
    // emulate page navigation as messages belong to currentPageName
    traceMessage.currentPageName = 'Intro'
    traceMessage.addMessage(testMessage)

    // nav to second page
    traceMessage.currentPageName = 'Name'
    traceMessage.addMessage(testMessage)

    traceMessage.clearMessageLog()

    assert.equal(traceMessage.messageLog['Intro'], undefined, 'Intro key should be gone/undefined')
    assert.equal(traceMessage.messageLog['Name'] instanceof LogItem, true, 'Name key should be still there and an instance of LogItem')
  })

  it('newMessageLog', () => {
    // emulate page navigation as messages belong to currentPageName
    traceMessage.currentPageName = 'Intro'
    traceMessage.addMessage(testMessage)

    // nav to second page
    traceMessage.currentPageName = 'Name'
    traceMessage.addMessage(testMessage)

    traceMessage.newMessageLog()

    assert.deepEqual(traceMessage.messageLog.serialize(), {}, 'clears entire messageLog')
  })
})
