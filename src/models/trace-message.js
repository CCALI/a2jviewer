import DefineMap from 'can-define/map/map'
import DefineList from 'can-define/list/list'

/**
  * @module {can.Model} TraceMessages
  * @parent api-models
  *
  * list of trace messages not yet added to the traceMessageList
  *
  * This is the external API used by other components for adding messages
  * to the Debug Panel. This way, other components do not need to know
  * how the traceMessageList is formatted.
  *
  * Each msg can also have a format, formats include
  * "ui", "info", "var", "val", "code", "valT", "valF"
  *
  * ## use
  *
  * @codestart
  *
  * const message = { key: 'num', fragments: [ {format: 'var', msg: 'num'}, {msg: ' = '}, {format: 'val', msg: 5} ] }
  * traceMessage.addMessage(message)
  *
  * @codeend
  *
  */

// Internal Types/Lists
export const Fragment = DefineMap.extend('Fragment', {
  format: { default: '' },
  msg: 'string'
})

Fragment.List = DefineList.extend('FragmentList', {
  '#': Fragment
})

export const Message = DefineMap.extend('Message', {
  key: 'string',
  fragments: {
    Type: Fragment.List
  }
})

export const Messages = DefineMap.extend('Messages', { seal: false }, {
  '*': Message
})

export const LogItem = DefineMap.extend('LogItem', {
  pageName: 'string',
  messages: { Default: Messages }
})

export default DefineMap.extend('TraceMessageModel', {
  // set in pages-vm.js during each new page navigation
  currentPageName: {
    type: 'string',
    set (pageName) {
      if (!this.messageLog[pageName]) {
        const pageMessage = {}
        pageMessage[pageName] = new LogItem({ pageName })
        this.messageLog.assign(pageMessage)
      }
      return pageName
    }
  },

  // Messages DefineMap by pageName and message key
  // updates to the same pageName + message.key replace the message fragments array
  messageLog: {
    default: function () { return new DefineMap() }
  },

  // @param  { key: 'string', fragments: [] }
  addMessage (message) {
    const newMessage = {}
    newMessage[message.key] = message
    this.messageLog[this.currentPageName].messages.assign(newMessage)
  },

  // reset the messageLog preserving the currentPageName - used in debug-panel.js
  clearMessageLog () {
    const logItem = new LogItem({pageName: this.currentPageName})
    const initialMessage = {}
    initialMessage[this.currentPageName] = logItem
    this.messageLog.update(new DefineMap(initialMessage))
  },

  // create new messageLog - used to completely reset the log
  newMessageLog () {
    this.messageLog.update(new DefineMap())
  }
})
