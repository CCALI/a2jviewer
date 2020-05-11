export default {
  LOGIC_SET: /set\s+(.+)/i,
  LOGIC_SETTO: /set\s+([\w#]+|\[.+\])\s*?\s(=|TO)\s+?(.+)/i,
  LOGIC_GOTO: /^goto\s+\"(.+)\"/i,
  LOGIC_GOTO2: /^goto\s+(.+)/i,
  LOGIC_TRACE: /trace\s+(.+)/i,
  LOGIC_WRITE: /write\s+(.+)/i,
  LOGIC_ELSEIF: /^else if\s+(.+)/i,
  LOGIC_IF: /^if\s+(.+)/i,
  LOGIC_LE: /\<\=\=/gi,
  LOGIC_NE: /\<\>/gi,
  LINK_POP: /\"POPUP:\/\/(([^\"])+)\"/ig,
  LINK_POP2: /\"POPUP:\/\/(([^\"])+)\"/i
}
