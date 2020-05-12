// 08/23/2013 

var testunit={};

function parseUnit(unitText)
{ 
	// Load a test unit file. Create fake pages from @Page and @Var lines
	var lines=unitText.split("\n");
	var curpage=null;
	var pfirst="";
	var plast="";
	testunit.trace("<h1>Defining pages/scripts</h1>");
	
	for (var l=0;l<lines.length;l++)
	{	// Extract variables and page names and attach scripts to pages
		var line=jQuery.trim(lines[l]).split("//")[0];
		if ((args = line.match(/@page\s+(.+)/i))!=null) //p;d /@page\s+([\w[\w|\s]+)/i
		{
			var pageName = jQuery.trim(args[1]);
			testunit.pages[pageName.toLowerCase()] = { name:pageName, lines:[]};
			if (pfirst=="") pfirst=pageName;
			plast=pageName;
			if (curpage != null) curpage.next=pageName;
			
			curpage= testunit.pages[pageName.toLowerCase()];
			testunit.trace("Define page "+traceTag('page',pageName));
		}
		else
		if ((args = line.match(/@var\s+(.+)/i))!=null)
		{
			var varName =jQuery.trim(args[1]);
			testunit.trace("Define variable "+varName);
			testunit.setVar(varName,0,"");
//			testunit.vars[varName.toLowerCase()] = { name:varName, len:0, elts:[]};
		}
		else
		//if (line!="")
			if (curpage!=null)
				curpage.lines.push(lines[l]);
	}
	lines=null;//delete lines;
	
	testunit.trace("<h1>Syntax errors</h1>");
	// Parse the syntax of each page's scripts
	for (var p in testunit.pages)
	{
		var page=testunit.pages[ p ];
		var lines = page.lines;
		var script = gLogic.translateCAJAtoJS(lines.join("\n"));
		//alert(lines.join("\n"));
		if (script.errors.length>0)
		{
			testunit.trace( '<hr>page ' + traceTag('page',page.name)) ; 
			var t=[];
			for (l=0;l<lines.length;l++)
			{
				var err=null;
				for (var e in script.errors)
					if (script.errors[e].line == l)
						err=script.errors[e];
				if (err == null)
					t.push(lines[l]);
				else
				{
					t.push('<span class="err">'+lines[l]+"</span>");
				}
			}
			testunit.trace('<BLOCKQUOTE class="Script">'+t.join("<BR/>")+"</BLOCKQUOTE>");
			testunit.trace("Errors");
			testunit.indent++;
			for (var e in script.errors)
			{
				err=script.errors[e];
				testunit.trace("<b>"+err.line+":"+err.text+"</b>");
			}
			testunit.indent--;
			
			
			
			
			
			
			testunit.trace("Javascript (with CAJA Script commented)");
			testunit.indent++;
			var t=[];
			for (l=0;l<script.js.length;l++)
			{
				t.push(script.js[l]);
			}
			testunit.trace("<BLOCKQUOTE class=Script>"+t.join("<BR/>")+"</BLOCKQUOTE>");
			testunit.indent--; 
		}
		else
		{
		 /*
			if(0)
			{
				testunit.trace("CAJAScript Evaluate");
				testunit.indent++;
				for (l=0;l<lines.length;l++)
				{
					testunit.trace(lines[l]);
				}
				testunit.indent--;
				testunit.trace("Javascript");
				testunit.indent++;
				for (l=0;l<script.js.length;l++)
				{
					testunit.trace(script.js[l]);
				}
				testunit.indent--; 
				
				testunit._VS=testunit.setVar;//function(v){ testunit.trace("SET VAR "+v);}
				testunit._VG=testunit.getVar;//function(v){ testunit.trace("SET VAR "+v);}
				testunit._CF=function(f){ testunit.trace("Call function "+f); return 0;}
				testunit._ED=function(f){ return 0;}
				testunit._GO=function(pageName){ testunit.pageName=pageName;testunit.trace("Going to page "+pageName);}
				testunit._deltaVars=testunit.deltaVars;
				var js = "with (testunit) {"+ script.js.join("\n") +"}";
				//var js = 'with (testunit) { _VS("name",55); _VS("first",22); }';
				//testunit.trace(js);
	
				try {
					var f=(new Function( js ));
					var result = f();//execute the javascript code.
	//				testunit.trace(f());
	//				eval(js);
				}
				catch (e) { 
					testunit.trace("ERROR: " +e.message +" " + e.lineNumber);
				}
					
				}*/
				}
			}

	testunit.trace("<h1>Script execution</h1>");
	// start on first page and execute, following GOTO and falling through to next page. terminate after 20 loops or fall off last page.
	testunit.nextpage=pfirst;
	var loop=0;
	while (loop++<25 && (typeof testunit.nextpage!=="undefined"))
	{
		var page=testunit.pages[ testunit.nextpage.toLowerCase() ];
		testunit.trace( '<hr>page '+traceTag('page',page.name)+'<span>'); 
		testunit.nextpage = page.next; //default next goto page
		if (page==null)
		{
			testunit.trace("Page doesn't exist");
			break;
		}
		var lines = page.lines; 
		var script = gLogic.translateCAJAtoJS(lines.join("\n"));
		
		if (script.errors.length == 0)
		{
			if (0){
				testunit.trace("CAJAScript Evaluate");
				testunit.indent++;
				var t=[];
				for (l=0;l<lines.length;l++)
				{
					t.push(lines[l]);
				}
				testunit.trace("<BLOCKQUOTE class=Script>"+t.join("<BR/>")+"</BLOCKQUOTE>");
				testunit.indent--;
			}
			
			testunit.trace("Javascript (with CAJA Script commented)");
			testunit.indent++;
			var t=[];
			for (l=0;l<script.js.length;l++)
			{
				t.push(script.js[l]);
			}
			testunit.trace("<BLOCKQUOTE class=Script>"+t.join("<BR/>")+"</BLOCKQUOTE>");
			testunit.indent--; 
			
			testunit._CAJA=function(c){testunit.trace( traceTag('code',c));}
			testunit._IF=function(d,c,e){testunit.trace( traceTag('code',c)+' = '+(e==true));return (e==true);}
			testunit._VS=function(c,v,i,val){  return testunit.setVar(v,i,val);}
			testunit._VG=function( v,i){  return testunit.getVar(v,i);}
			testunit._CF=function(f){ 
				this.indent++;
				this.trace("Call function "+f); 
				this.indent--;
				return 0;}
			testunit._ED=function(dstr){
				// Date format expected: m/dd/yyyy. 
				// Converted to unix seconds
				return Date.parse(dstr);
			}
			testunit.pageExists = function(pageName)
			{	// return true if page name exists
				return true;
			}
			testunit._GO=function(c,pageName){ testunit.nextpage=pageName;testunit.trace("Going to page "+testunit.nextpage);}
			testunit._deltaVars=testunit.deltaVars;
			var js = "with (testunit) {"+ script.js.join("\n") +"}";
			//var js = 'with (testunit) { _VS("name",55); _VS("first",22); }';
			//testunit.trace(js);

			try {
				var f=(new Function( js ));
				var result = f();//execute the javascript code.
//				testunit.trace(f());
//				eval(js);
			}
			catch (e) { 
				testunit.trace("ERROR: " +e.message +" " + e.lineNumber);
			}
		}
		
	}
	
	
}




traceScript=trace=function(msg)
{
	$('.ScriptTrace').append('<li>'+  Array.prototype.slice.call(arguments).join(", ")); 
}
$(document).ready(function()
{  
	trace("Ready");
	Languages.set(Languages.defaultLanguage);

	
//	testunit.traceDepth=0;
	testunit.trace=function(msg){
		//var nbsp="";for (var i=0;i<3*this.indent;i++){nbsp+="&nbsp;";}
		//$('.ScriptTrace').append( nbsp + Array.prototype.slice.call(arguments).join(", ")+"<br>");
		$('.ScriptTrace').append( '<li style="margin-left:'+(this.indent*50)+'px">'+ Array.prototype.slice.call(arguments).join(", "));
		};
//	testunit.traceIndent=function(delta){ this.traceDepth+=delta;}
	testunit.indent=0;
	testunit.pageName="";
	testunit.vars={}
	testunit.varsOld={};
	testunit.pages={};
	$("ul.testunits li a").each(function(){
		loadFile($(this).attr('href')); 
	//	loadFile("CAJA_Test_Script_Unit1.txt"); 
	});
});

function loadFile(bookFile)
{
	trace("Loading Unit Test "+bookFile);
	$.ajax({
			url: bookFile,
			dataType: "text"  , // IE will only load XML file from local disk as text, not xml.
			timeout: 45000,
			error: function(data,textStatus,thrownError){
			  alert('Error occurred loading from '+this.url+"\n"+textStatus);
			 },
			success: function(data){
				parseUnit(data);
			}
		});
} 
function traceTag(cname,chtml){
	if (cname=='val' && chtml == "")
		chtml = "<i>blank</i>";
	return "<span class="+cname+">"+chtml+"</span>";
}



testunit.setVar=function(varName,varIndex,varVal)
{
	if (varIndex==null || varIndex=='') varIndex=0;
	
	this.indent++;
	this.trace( traceTag('var',varName)+ (varIndex>0 ? traceTag('varidx',varIndex) :'') + ' = '+ traceTag('val',varVal) );
	this.indent--;
	
	var varName_i=varName.toLowerCase();
	var v=testunit.vars[varName_i];
	if (typeof v == 'undefined')
	{
		v={name:varName,values:[]};
		testunit.vars[varName_i]=v;
	}
	if (typeof testunit.varsOld[varName_i+"."+varIndex]=='undefined')
		testunit.varsOld[varName_i+"."+varIndex]=[v.values[varIndex]];
//	testunit.varsOld[varName_i+"."+varIndex].push(v.values[varIndex]);
	v.values[varIndex]=varVal; 
}
testunit.getVar=function(varName,varIndex)
{
	//this.trace('Get '+traceTag('var',varName));
	var varName_i=varName.toLowerCase();
	var v=testunit.vars[varName_i];
	if (typeof v == 'undefined')
	{
		testunit.indent++;
		testunit.trace('Undefined variable: '+traceTag('var',varName)+ ((varIndex==null || varIndex=='')?'':traceTag('varidx',varIndex) ));
		testunit.indent--;
		return 'undefined';
	}
	else
	{
		if (varIndex==null || varIndex=='') varIndex=0;
		return v.values[varIndex]; 
	}
}
testunit.deltaVars=function()
{	// Display variables indicating changed/new.
	var html='<table   border="2"  cellpadding="1" cellspacing="0"><tr><th nowrap="nowrap" class="colVar">Variable</th><th nowrap="nowrap" class="colIndex">Index</th><th nowrap="nowrap" class="colValue">Value</th><th  class="colValue">Old Value</th></tr>';

	//trace(props(testunit.varsOld));

	for (var varName_i in this.vars)
	{
		var v = this.vars[varName_i]
		var varName=v.name;
		for (var vi=0;vi<v.values.length;vi++)
		{
			var stat=""; 
			var varVal=v.values[vi];
			var vOld=this.varsOld[varName_i+"."+vi];
			if (typeof vOld!="undefined")
			{
				html += '<TR rel="'+varName_i+'">'
					//+'<td class="colVar">'+varName+'</td><td class="colIndex">'+vi+'</td><td class="colValue '+''+'">'+varVal+'</td><td class="colValue">'+vOld.join(" , ")+'</td>'
					+'</TR>';
			}
		}
	}
	html += '</table><br/>';
	this.trace(html);
	
	this.varsOld={}; 
}

testunit.evalExpression = function(expr)
{
/*
	*/
}
testunit.evalBlock=function(block)
{
	return this.evalExpression(block);
}
testunit.evalHTML=function(html)
{	// Parse for %% declarations.
	var parts=html.split("%%");
	if (parts.length > 0)
	{
		html="";
		for (var p=0;p<parts.length;p+=2)
		{
			html += parts[p];
			if (p<parts.length-1)
			{
				html += this.evalBlock(parts[p+1]);
			}
		}
	}
	return html;
}
