(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory)
  } else {
    root.gLogic = factory()
  }
}(this, function () {
  return function (gGuide,
    REG, CONST,
    ismdy, decodeEntities, escapeHtml, jquote, isNumber,
    swapMonthAndDay, dateToString, dateToDays, daysToDate, todaysDate, dateDiff,
    traceTag, numeral, eventQueue) {
    gGuide = gGuide || window.gGuide
    REG = REG || window.REG
    CONST = CONST || window.CONST
    ismdy = ismdy || window.ismdy
    decodeEntities = decodeEntities || window.decodeEntities
    escapeHtml = escapeHtml || window.escapeHtml
    jquote = jquote || window.jquote
    isNumber = isNumber || window.isNumber
    swapMonthAndDay = swapMonthAndDay || swapMonthAndDay
    dateToString = dateToString || window.dateToString
    dateToDays = dateToDays || window.dateToDays
    daysToDate = daysToDate || window.daysToDate
    todaysDate = todaysDate || window.todaysDate
    dateDiff = dateDiff || window.dateDiff
    traceTag = traceTag || window.traceTag
    numeral = numeral || window.numeral

    /*******************************************************************************
      A2J Author 6 * JusticeJustice * justicia * 正义 * công lý * 사법 * правосудие
      All Contents Copyright The Center for Computer-Assisted Legal Instruction

      Logic
      06/15/2012

      Convert CAJA script into JavaScript
      Required by Author and Viewers
      Phase 1: Compile the CAJA script to spot syntax errors or undefined functions or variables.
      Phase 2: If compile ie successful, execute the JS version.

    ******************************************************************************/

    // Classes
    /**
     * @constructor
     * @struct
     * @this {ParseError}
     */
    function ParseError (lineNum, errType, errText) {
      this.line = lineNum
      this.type = errType // missing page, unknown line, unknown function
      this.text = errText
      return this
    }

    /**
		 * @constructor
		 * @struct
		 * @this {TLogic}
		 */
    function TLogic () {
      this.showCAJAScript =
				0 // none
				// +1 // end of js line
				// +2// before js
				// +3//tracer

      this.tracerID = '#tracer'
      this.userFunctions = {} // list of user functions, property name is function name.
      this.indent = 0 // Tracing indent level/shows nesting code.
      this.GOTOPAGE = '' // Optionally set by GOTO commmand in script. Allows us to breakout when needed.

      this.infiniteLoopCounter = 0 // Counts GOTO Pages without an interaction. If we hit too many, probable infinite loop.
      this.infiniteLoopCounterMax = 100
      return this
    }

    TLogic.prototype.pageExists = function (pageName) { // Return true if page name exists (Case-sensitive check)
      return gGuide.pages[pageName] !== null
    }

    TLogic.prototype.pageFindReferences = function (CAJAScript, findName, newName) { // Find/replace all GOTO findName with newName or just return if found.
      var result = {}
      result.add = false
      var csLines = CAJAScript.split(CONST.ScriptLineBreak)
      var l
      for (l = 0; l < csLines.length; l++) {
        var line = jQuery.trim(csLines[l]).split('//')[0]
        // TODO : handle Replacement of a page name inside GOTO.
        var args
        if ((args = line.match(REG.LOGIC_GOTO)) !== null) { // Goto named page (not an expression). We 'return' to avoid further processing which is A2J's designed behavior.
          var pageName = args[1]
          if (pageName === findName) {
            result.add = true
          }
        }
      }
      return result
    }

    TLogic.prototype.translateCAJAtoJS = function (CAJAScriptHTML) { // Translate CAJA script statements of multiple lines with conditionals into JS script but do NOT evaluate.
      // Returns JavaScript source code lines in .js and errors in .errors which caller may evaluate
      // TODO: needs a regex guru to optimize
      /*
				_VG(x) = get value of variable x
				_VG(x,n) = get nth element of array variable x
				_VS(x,y,z) = set value of variable x#y to z
				_ED(d) = parse an mm/dd/yyyy string to date
				_CF(f,a) = call function f with argument a

				CAJA supported syntax
				SET v TO e or SET v = e becomes SV(v,e)
				GOTO v becomes GOTO(v)
				IF exp
				END IF
			*/
      var errors = []
      var jsLines = []

      // Replacing IE/Edge line breaks before splitting
      var csLines = CAJAScriptHTML
        .replace(/<BR \/>/g, CONST.ScriptLineBreak)
        .split(CONST.ScriptLineBreak)

      var ifd = 0 // if depth syntax checker
      var l

      var exp // current expression as string

      function hackQuote () { // 2014-08-07 If expression has one quote assume it extends multiple lines and collect them.
        // Ideally we don't tokenize by lines.
        // TODO support multi-line expressions too.
        if (exp.indexOf('"') >= 0) {
          if (exp.split('"').length % 2 == 0) { // Warning: need to accept embedded quote?
            var noquote = true
            var l2
            for (l2 = l + 1; l2 < csLines.length && noquote; l2++) {
              noquote = csLines[l2].indexOf('"') < 0
              exp += '\\n' + csLines[l2] // embed line break for display
              csLines[l2] = ''
            }
          }
        }
        // trace ('exp',exp);
      }
      for (l = 0; l < csLines.length; l++) {
        var line = this.removeTrailingComments(csLines[l])
        var args
        var js
        if (line !== '') {
          // SET var TO expression
          // SET var[index] TO expression

          if ((args = line.match(REG.LOGIC_SETTO)) !== null) { // SET variable name TO expression
            var jj = args[1]
            jj = jj.replace(/\[|\]/gi, '') // strip variable name brackets if present
            jj = jj.split('#') // extract array index
            if (jj.length === 1) {
              // Set named variable to evaluated expression
              gLogic.testVar(jj[0], l, errors)
              exp = args[3]
              hackQuote()
              js = ('_VS(' + jquote(line) + ',"' + jj[0] + '",0,' + this.translateCAJAtoJSExpression(exp, l, errors) + ');')
            } else {
              // Set named variable array element to evaluated expression
              gLogic.testVar(jj[0], l, errors)
              if (!isNumber(jj[1])) {
                gLogic.testVar(jj[1], l, errors)
                jj[1] = '[' + jj[1] + ']'
              }
              exp = jj[1]
              hackQuote()
              js = ('_VS(' + jquote(line) + ',"' + jj[0] + '",' + this.translateCAJAtoJSExpression(exp, l, errors) + ',' + this.translateCAJAtoJSExpression(args[3], l, errors) + ');')
            }
          } else
          if ((args = line.match(REG.LOGIC_GOTO2)) !== null) { // Goto named page (not an expression). We 'return' to avoid further processing which is A2J's designed behavior.
            var pageNameExp = args[1]
            if (pageNameExp.substr(0, 1) === '"' && pageNameExp.substr(-1, 1) === '"') { // We can statically check of a quoted page name.
              var pageName = pageNameExp.substr(1, pageNameExp.length - 2)
              if (!this.pageExists(pageName)) {
                errors.push(new ParseError(l, '', lang.scriptErrorMissingPage.printf(pageName)))
              }
              js = ('_GO(' + jquote(line) + ',' + pageNameExp + ');return;')
            }
          } else
          if ((args = line.match(REG.LOGIC_TRACE)) !== null) {
            exp = args[1]
            hackQuote()
            js = ('_TRACE(' + jquote(exp) + ',' + this.translateCAJAtoJSExpression(exp, l, errors) + ')')
          } else
          if ((args = line.match(REG.LOGIC_IF)) !== null) { // "if expressions" becomes "if (expressions) {"
            ifd++
            if (this.showCAJAScript === 3) {
              line = '' // don't print else?
            }
            js = ('if (_IF(' + ifd + ',' + jquote(args[1]) + ',' + this.translateCAJAtoJSExpression(args[1], l, errors) + ')){')
            //				js=("if ("+this.translateCAJAtoJSExpression(args[1], l, errors)+"){");
          } else
          if ((args = line.match(REG.LOGIC_ELSEIF)) !== null) { // "else if expression" becomes "}else if (expression){"
            // does NOT affect depth. ifd++;
            if (this.showCAJAScript === 3) {
              line = '' // don't print else?
            }
            js = ('} else if (_IF(' + ifd + ',' + jquote(args[1]) + ',' + this.translateCAJAtoJSExpression(args[1], l, errors) + ')){')
          } else
          if ((args = line.match(/^end if/i)) !== null) { // "END IF" becomes "}"
            if (this.showCAJAScript === 3) {
              line = '' // don't print elee?
            }
            ifd--
            js = ('};_ENDIF(' + ifd + ');')
          } else
          if ((args = line.match(/^else/i)) !== null) { // "else" becomes "}else{"
            if (this.showCAJAScript === 3) {
              line = '' // don't print else?
            }
            js = ('}else{')
          } else
          if (line.match(/deltavars/i) !== null) { // debugging aid
            js = ('_deltaVars(' + jquote(line) + ');')
          } else
          if ((args = line.match(REG.LOGIC_WRITE)) !== null) {
            exp = args[1]
            hackQuote()
            js = ('_W(' + jquote(exp) + ',' + this.translateCAJAtoJSExpression(exp, l, errors) + ')')
          } else { // Unknown statement
            // 2014-08-07 Some authors use multi-line expressions.

            // exp = line;
            // hackQuote();
            // js=("_W("+jquote(exp)+","+this.translateCAJAtoJSExpression(exp, l, errors)+")");

            js = '_CAJA(' + jquote(line) + ');'
            errors.push(new ParseError(l, '', lang.scriptErrorUnhandled.printf(line)))
          }

          switch (this.showCAJAScript) {
            case 0:
              jsLines.push(js) // standard
              break
            case 1:
              jsLines.push(js + ' //CAJA: ' + line) // include original source appended
              break
            case 2:
              jsLines.push('', '//CAJA: ' + line, js) // include original source prepended
              break
            default:
              jsLines.push('', '', js) // line.replace( /"/x/gi,"!") +
          }
        }
      }
      if (ifd > 0) {
        errors.push(new ParseError(l, '', lang.scriptErrorEndMissing.printf()))
      }
      return {
        js: jsLines,
        errors: errors
      }
    }

    // This function needs to be udpated as well A2J_Logic.js line: 251
    // TODO: remove references to the legacy A2J_Logic.js file
    TLogic.prototype.removeTrailingComments = function (currentLine) {
      // Strip trailing comments, but exclude urls aka `://`
      // everything after non-url `//` considered a trailing comment

      // lines that start with `//` are always a full line comment regardless of content
      if (currentLine.indexOf('//') === 0) { return '' }

      // ignore url values in SET, ex: `SET [url] TO "https://www.google.com" // trailing comment`
      const urlFound = currentLine.indexOf('://') !== -1
      const commentRegEx = urlFound ? /[^:]\/\// : /\/\//

      // TODO: decodeEntities may no longer be needed with CKEditor
      const decodedComment = decodeEntities(currentLine)
      const sansComment = decodedComment.split(commentRegEx)[0]
      const trimmedComment = window.jQuery.trim(sansComment)

      return trimmedComment
    }

    TLogic.prototype.evalBlock = function (expressionInText) { // Evaluate a block of expression included in a text block.
      var txt = ''
      var errors = []
      var js = this.translateCAJAtoJSExpression(expressionInText, 1, errors)
      if (errors.length === 0) {
        try {
          // This uses JavaScript EVAL.
          var f = (new Function('with (gLogic) { return (' + js + ')}'))
          var result = f() // Execute the javascript code.
          txt = escapeHtml(result)
          // Ensure line breaks from user long answer or author's multi-line text set appear.
          txt = txt.replace(/\n|\r\n|\r/g, '<BR>')
        } catch (e) {
          // Collect runtime errors
          txt = '<span class="code">' + expressionInText + '</span><span class="err">' + e.message + '</span>'
        }
      } else { // Compile time error
        const errorText = errors.length && errors[0].text
        txt = '<span class="code">' + expressionInText + '</span><span class="err">' + 'syntax error: ' + errorText + '</span>'
      }
      return {
        js: js,
        text: txt,
        errors: errors
      }
    }

    TLogic.prototype.evalLogicHTML = function (html) { // Parse for %% declarations. Return html block and js block for debugging.
      var parts = html.split('%%')
      var js = []
      if (parts.length > 0) {
        html = ''
        var p
        for (p = 0; p < parts.length; p += 2) {
          html += parts[p]
          if (p < parts.length - 1) {
            var block = this.evalBlock(parts[p + 1])
            html += block.text
            js.push(block.js)
          }
        }
      }
      return {
        js: js,
        html: html
      }
    }

    TLogic.prototype.hds = function (a2j4) { // 08/23/2013 convert A2J4 style expression into new format
      // [client name] CONVERTS TO client name
      // [child name#child counter]  CONVERTS TO child name[child counter]
      // [age] is 25 CONVERTS TO age = 25
      // [name first] + [name last] CONVERTS TO name first + name last
      // [income 1] < 25,000 and [income 2] < 35,000 CONVERTS TO income 1 < 25,000 AND income 2 < 35,000
      // Assumptions: TODO
      return a2j4
    }

    TLogic.prototype.translateCAJAtoJSExpression = function (CAJAExpression, lineNum, errors) { // Parse a CAJA expression into a JS expression, NOT EVALUATED.
      // Compiled into JS function to check for errors.
      // Any syntax errors are pushed onto the errors array.
      var js = (' ' + CAJAExpression + ' ')

      function trackVar (match, p1, offset, string) {
        gLogic.testVar(p1, lineNum, errors)
        // trace('trackVar',p1);
        return '$1("' + p1 + '")'
      }

      function trackVarIndex (match, p1, p2, offset, string) {
        gLogic.testVar(p1, lineNum, errors)
        // trace('trackVarIndex',p1,p2);
        return '$1("' + p1 + '",' + p2 + ')'
      }

      function trackVarIndexVar (match, p1, p2, offset, string) {
        gLogic.testVar(p1, lineNum, errors)
        gLogic.testVar(p2, lineNum, errors)
        // trace('trackVarIndexVar',p1,p2);
        return '$1("' + p1 + '",$1("' + p2 + '"))'
      }

      // Handle items not in quotes
      js = js.split('"')
      var j
      for (j = 0; j < js.length; j += 2) {
        var jj = js[j]

        // Strip out $ from $25,000 and inappropriate %%.
        jj = jj.replace(/\$|\%\%/gi, '')

        //	A2J variables support spaces and other symbols using [] delimiter notation.
        //		Examples: Name, G/C person age MC, Doesn't have alternate guardian TE, Child Name, Child Name 2, Child Name#2, Child Name#Child Index
        // Variable formats:
        //		Variable name with possible spaces
        //			[child name] converts to GetVar("child name")
        // jj = jj.replace(/\[([\w|\s|\-|\'|\/]+)\]/gi,"$$1(\"$1\")");
        jj = jj.replace(/\[([\w|\s|\-|\'|\/]+)\]/gi, trackVar)

        //		Variable name with possible spaces#number (array)
        //			[child name#2] converts to GetVar("child name",2)
        // jj = jj.replace(/\[([\w|\s|\-|\'|\/]+)#([\d]+)\]/gi,"$$1(\"$1\",$2)");
        jj = jj.replace(/\[([\w|\s|\-|\'|\/]+)#([\d]+)\]/gi, trackVarIndex)

        // Variable name with possible spaces#other variable name that evaluates to a number (array)
        //			[child name#child counter] converts to GetVar("child name",GetVar("child counter"))
        // jj = jj.replace(/\[([\w|\s|\-|\'|\/]+)#([\w|\s|\-|\'|\/]+)\]/gi,"$$1(\"$1\",$$1(\"$2\"))");
        jj = jj.replace(/\[([\w|\s|\-|\'|\/]+)#([\w|\s|\-|\'|\/]+)\]/gi, trackVarIndexVar)

        //	A2J dates bracketed with # like VB
        //	#12/25/2012# converts to convertDate("12/25/2012")
        //  This is a deprecated syntax and will be removed (see _ED function)
        var date = /#([\d|\/]+)#/gi
        jj = jj.replace(date, '$$2("$1")')

        js[j] = jj
      }
      js = js.join('"').split('"')
      var comma_fnc = function (s) {
        return s.replace(',', '')
      }
      for (j = 0; j < js.length; j += 2) { // handle standalone symbols not in quotes
        jj = js[j]

        // A2J allows commas in numbers for clarity
        //		25,000.25 converts to 25000.25
        var vn = /(\d[\d|\,]+)/gi
        jj = jj.replace(vn, comma_fnc) // function(s){return s.replace(",","");});

        //	A2J uses IS, AND, OR and NOT while JS uses ==, &&, || and !
        jj = jj.replace(/\band\b/gi, '&&')
        jj = jj.replace(/\bor\b/gi, '||')
        jj = jj.replace(/\bnot\b/gi, '!')

        // Handle escaped versions of <> comparators https://github.com/CCALI/CAJA/issues/2543
        jj = jj.replace(/&lt;/g, '<')
        jj = jj.replace(/&gt;/g, '>')

        // A2J uses = and <> for comparison while JS uses == and !=
        jj = jj.replace(/\=/gi, '==')
        jj = jj.replace(/\>\=\=/gi, '>=')
        jj = jj.replace(REG.LOGIC_LE, '<=')
        jj = jj.replace(REG.LOGIC_NE, '!=')
        jj = jj.replace(/\bis\b/gi, '==')

        // Function calls
        //		age([child birthdate]) converts to CallFunction("age",GetVar("child birthdate"))
        jj = jj.replace(/([A-Za-z_][\w]*)(\s*)(\()/gi, '$$3("$1",')

        js[j] = jj
      }
      js = js.join('"').split('"')
      for (j = 0; j < js.length; j += 2) { // handle standalone variables that aren't functions
        jj = js[j]
        // Unbracketed variables get final VV treatment
        //		first_name converts to VV("first_name")
        // jj = jj.replace(/([A-Za-z_][\w]*)/gi,'$$1("$1")');
        jj = jj.replace(/([A-Za-z_][\w]*)/gi, trackVar)

        js[j] = jj
      }
      js = js.join('"').split('"')
      for (j = 0; j < js.length; j += 2) { // restore js functions
        jj = js[j]
        jj = jj.replace(/\$1/, '_VG').replace(/\$2/, '_ED').replace(/\$3/, '_CF')
        js[j] = jj
      }
      js = js.join('"')
      // Build function to find syntax errors
      try {
        var f = (new Function(js))
        f = null
      } catch (localTCE) { // Attempt to convert JS errors into A2J errors.
        if (localTCE.message === 'missing ; before statement') {
          localTCE.message = 'syntax error'
        }
        errors.push(new ParseError(lineNum, '', localTCE.message))
      }
      return js
    }

    TLogic.prototype.addUserFunction = function (funcName, numArgs, func) { // add a user defined function
      this.userFunctions[funcName.toLowerCase()] = {
        name: funcName,
        numArgs: numArgs,
        func: func
      }
    }

    // TODO: don't think this is ever called, remove when sure
    // TLogic.prototype.traceLogic = function (html) {
    //   $(this.tracerID).append('<li style="text-indent:' + (this.indent) + 'em">' + html + '</li>')
    //   // if(1) { trace(String(html).stripHTML());}
    // }

    // Functions called by JS translation of CAJA code.
    TLogic.prototype._CAJA = function (c) {
      this.dispatchMessage({ key: '_CAJA', fragments: [{ format: 'code', msg: c }] })
    }
    TLogic.prototype._IF = function (d, c, e) {
      if ((e) === true) {
        this.dispatchMessage({
          key: '_IF',
          fragments: [{ format: '', msg: 'IF' }, { format: 'valT', msg: c }, { format: '', msg: '\u2714' }]
        })
      } else {
        this.dispatchMessage({
          key: '_IF',
          fragments: [{ format: '', msg: 'IF' }, { format: 'valF', msg: c }]
        })
      }

      this.indent = d
      return (e === true)
    }

    TLogic.prototype._ENDIF = function (d) {
      this.indent = d
    }

    TLogic.prototype._VS = function (c, varname, varidx, val) {
      this.dispatchMessage({ key: '_VS' + varname, fragments: [{ format: '', msg: c }] })
      return gGuide.varSet(varname, val, varidx)
    }

    TLogic.prototype._VG = function (varname, varidx) {
      let returnVal

      switch (varname.toUpperCase()) {
        case 'TODAY':
          // today's date as number of days since epoch (01/01/1970)
          // to be used for calculations in A2J scripts, example: `IF TODAY < [Due Date DA]`
          returnVal = dateToDays(todaysDate())
          break
        case 'NULL':
          returnVal = null
          break
        case 'TRUE':
          returnVal = true
          break
        case 'FALSE':
          returnVal = false
          break
        default:
          returnVal = gGuide.varGet(varname, varidx, {
            date2num: true,
            num2num: true
          })
      }

      return returnVal
    }

    TLogic.prototype.testVar = function (name, lineNum, errors) {
      const reservedWords = ['TODAY', 'NULL', 'TRUE', 'FALSE']
      const isAReservedWord = reservedWords.indexOf(name.toUpperCase()) !== -1

      if (!gGuide.varExists(name) && !isAReservedWord) {
        errors.push(new ParseError(lineNum, '', 'Undefined variable ' + name))
      }
      // var exists, do nothing
    }

    TLogic.prototype._CF = function (fName) {
      const args = [].slice.call(arguments)
      const params = args.slice(1)

      var f = this.userFunctions[fName.toLowerCase()]
      if (!f) {
        return 'Unknown function "' + fName + '"'
      } else {
        return f.func.apply(null, params)
      }
    }

    TLogic.prototype._ED = function (dstr) {
      // Date format expected: mm/dd/yyyy.
      // Converted to unix seconds
      // this is based on a deprecated syntax for dates but is here for A2J 4 conversions
      // should be safe to remove after 01/01/2018 (remove regex parsing above as well)
      return Date.parse(dstr)
    }

    TLogic.prototype._GO = function (c, pageName) {
      this.GOTOPAGE = pageName
      this.dispatchMessage({ key: '_GO', fragments: [{ format: '', msg: c }] })
    }

    TLogic.prototype._TRACE = function (c, exp) {
      this.dispatchMessage({ key: '_TRACE-c', fragments: [{ format: '', msg: c }] })
      this.indent++
      this.dispatchMessage({ key: '_TRACE-exp', fragments: [{ format: 'info', msg: exp }] })
      this.indent--
    }

    TLogic.prototype._deltaVars = function () {}

    TLogic.prototype.executeScript = function (CAJAScriptHTML) { // Execute lines of CAJA script. Syntax/runtime errors go into logic tracer, error causes all logic to cease.
      // GOTO's cause immediate break out of script and the caller is responsible for changing page.
      // Script statement lines separated <BR/> tags.
      var self = this
      if (typeof CAJAScriptHTML === 'undefined') {
        return true
      }
      this.indent = 0
      var script = this.translateCAJAtoJS(CAJAScriptHTML)
      if (script.errors.length === 0) {
        var js = 'with (gLogic) {' + script.js.join('\n') + '}'
        try {
          var f = (new Function(js)) // This is an EVAL (but constrained in WITH)
          var result = f() // Execute the javascript code.
          result = null
        } catch (e) {
          // Trace runtime errors
          var message = {}
          message.key = 'executeScript.error: ' + e.lineNumber + ': ' + e.message
          message.fragments = [{ format: '', msg: 'executeScript.error: ' + e.lineNumber + ': ' + e.message }]
          self.dispatchMessage('traceMessage', message)
          return false
        }
      } else {
        script.errors.forEach(function (error) {
          self.dispatchMessage({
            key: 'executeScript.error: syntax error in logic',
            fragments: [{
              format: '',
              msg: 'executeScript.error: ' + error.text
            }]
          })
        })
        return false
      }
      this.indent = 0
      return true
    }

    function niceNumber (num) { // Return number formatted for human eyes, with commas.
      const num2string = num.toString()
      return numeral(num2string).format('0,0')
    }

    TLogic.prototype.stripLogicHTML = function (html) {
      var parts = makestr(html).split('%%')

      if (parts.length > 0) {
        html = ''
        var p

        for (p = 0; p < parts.length; p += 2) {
          html += parts[p]
          if (p < parts.length - 1) {
            html += ' word '
          }
        }
      }

      return html
    }

    TLogic.prototype.dispatchMessage = function (message) {
      this.dispatch({
        type: 'traceMessage',
        message: message
      })
      return message
    }

    // TODO: Remove eventQueue and make logic/tlogic actual DefineMaps that support events natively
    // the if statement is for the tlogic-test.js that does not require eventQueue
    var gLogic
    if (eventQueue) {
      gLogic = eventQueue(new TLogic())
    } else {
      gLogic = new TLogic()
    }

    /* Logic Script functions */

    // Default user defined functions used by A2J

    gLogic.addUserFunction('Dollar', 1, function (num) { // Convert to dollar format, commas with 2 digits after 0.
      return numeral(num).format('0,0.00')
    })

    gLogic.addUserFunction('DollarRound', 1, function (num) { // Convert to dollar format, commas and rounded to nearest dollar.
      return numeral(num).format('0,0')
    })

    // These 4 functions use `numeral` library to cast strings to numbers if needed.
    gLogic.addUserFunction('Trunc', 1, function (num) {	// Return integer without decimals
      return Math.trunc(numeral(num).value())
    })

    gLogic.addUserFunction('Trunc2', 1, function (num) {	// Return integer with 2 decimal places
      return Math.trunc(numeral(num).value() * 100) / 100
    })

    gLogic.addUserFunction('Round', 1, function (num) {	// Return integer, rounded.
      return Math.round(numeral(num).value())
    })

    gLogic.addUserFunction('Round2', 1, function (num) {	// Return integer, rounded to two decimal places.
      return Math.round(numeral(num).value() * 100) / 100
    })

    gLogic.addUserFunction('Number', 1, function (val) { // Convert something to a number or 0.
      return parseFloat(val)
    })

    gLogic.addUserFunction('HasAnswered', 1, function (val) { // Return true if variable answered (actually if it's not '').
      return (typeof val === 'undefined' || val === null || val === '') === false
    })

    gLogic.addUserFunction('Sum', 1, function (readableListString) {
      var sum = 0
      // multi-value number variables of length one are a number already
      if (typeof readableListString === 'number') {
        return readableListString
      }
      // longer lists of multi-value number variables are
      // converted to a readable string, ex: "13 and 5 and 8"
      if (readableListString && typeof readableListString === 'string') {
        var answerValues = readableListString.replace('and', ',').split(',')
        for (var i = 0; i < answerValues.length; i++) {
          const val = parseFloat(answerValues[i])
          if (!isNaN(val)) {
            sum += val
          }
        }
      }

      return sum
    })

    gLogic.addUserFunction('Ordinal', 1, function (ordinal) { // Map number to ordinal: 1 becomes first, 8 becomes eighth.
      ordinal = parseInt(ordinal, 10)
      var txt = lang['Ordinals_' + ordinal]
      if (!txt) { // If not found in ordinal list, build from scratch in English form.
        var ending
        switch (ordinal % 10) {
          case 1:
            ending = 'st'
            break
          case 2:
            ending = 'nd'
            break
          case 3:
            ending = 'rd'
            break
          default:
            ending = 'th'
        }
        txt = niceNumber(ordinal) + ending
      }
      return txt
    })

    // returns number of years between a user provide date and today's date
    gLogic.addUserFunction('Age', 1, function (date) {
      // handle date as numDays since epoch (01/10/1970)
      if (typeof date === 'number') {
        date = daysToDate(date)
      }
      // Age is always a positive number, but diff can return a negative
      return Math.abs(dateDiff(date, todaysDate(), 'years'))
    })

    gLogic.addUserFunction('Date', 1, function (numDays) {
      // A2J Date macro gets the value of the source date
      // as number of days since epoch (01/01/1970)
      // Should display nothing if numDays is falsy
      var displayDate = ''

      if (numDays) {
        displayDate = dateToString(numDays)
      }

      return displayDate
    })

    gLogic.addUserFunction('String', 1, function (val) {
      return String(val)
    })

    gLogic.addUserFunction('Contains', 2, function (varValue, stringValue) { // Case insensitive
      varValue = String(varValue).toLowerCase()
      stringValue = String(stringValue).toLowerCase()

      return varValue.indexOf(stringValue) !== -1
    })

    gLogic.addUserFunction('HisHer', 1, function (gender) {
      return (gender.toLowerCase() === 'male') ? 'his' : 'her'
    })
    gLogic.addUserFunction('HimHer', 1, function (gender) {
      return (gender.toLowerCase() === 'male') ? 'him' : 'her'
    })
    gLogic.addUserFunction('HeShe', 1, function (gender) {
      return (gender.toLowerCase() === 'male') ? 'he' : 'she'
    })

    // TODO: don't think is used, remove when sure
    // function traceLogic (html) {
    //   gLogic.traceLogic(html)
    // }

    // TRUNC polyfill for IE
    Math.trunc = Math.trunc || function (x) {
      if (isNaN(x)) {
        return NaN
      }
      if (x > 0) {
        return Math.floor(x)
      }
      return Math.ceil(x)
    }

    return gLogic
  }
}))
