export default `
<!doctype html>
<html lang="en" data-can-automount="false"><head>
    <meta charset="UTF-8">
    <title>A2J Test Assemble</title>
    <style>
a2j-variable .var-name{max-width:200px;max-width:10rem;overflow:hidden;padding:3px 10px;border-radius:6px;white-space:nowrap;display:inline-block;text-overflow:ellipsis;background-color:#d7ecf5;vertical-align:middle}a2j-variable .var-name.unanswered{visibility:hidden}element-options-pane{display:block;position:absolute;top:0;right:0;height:100%}element-options-pane .popover{width:390px!important;margin-left:0!important;max-width:390px!important;border-radius:0!important}element-options-pane .popover.right{float:none!important;left:15px!important;top:0!important}element-options-pane .popover.right>.arrow{top:15px!important}element-options-pane .popover-close{top:-45px!important;right:20px!important;color:inherit!important;font-size:30px!important;position:relative!important}element-options-pane h3.pane-title{margin:0;padding:17px}element-options-pane .popover-overrides{width:390px;margin-left:0;max-width:390px;border-radius:0}element-options-pane .popover-overrides.right{float:none;left:15px;top:0}element-options-pane .popover-overrides.right>.arrow{top:15px}element-options-pane .close-button-overrides{top:-45px;right:20px;color:inherit;font-size:30px;position:relative}element-toolbar .drag-handle{cursor:move;transition:all .3s ease-in-out;margin-right:10px;font-size:16px}element-toolbar .drag-handle:hover{background:#aaa;color:#fff}element-toolbar .move-node-up{transition:all .3s ease-in-out}element-toolbar .move-node-up span{font-size:16px}element-toolbar .move-node-up:hover{background:#aaa}element-toolbar .move-node-up:hover span{color:#fff}element-toolbar .move-node-down{transition:all .3s ease-in-out}element-toolbar .move-node-down span{font-size:16px}element-toolbar .move-node-down:hover{background:#aaa}element-toolbar .move-node-down:hover span{color:#fff}element-toolbar>div{padding:0 10px;border:1px solid #adadad}element-container{display:block;margin-bottom:20px}element-container .wrapper{padding:10px;min-height:50px;border:1px solid transparent}element-container .wrapper:hover{border:1px dashed #adadad}element-container .wrapper.selected{border:1px solid #adadad;border-bottom:none}legal-nav-resource-id{overflow:hidden;padding:3px 10px;border-radius:6px;white-space:nowrap;display:inline-block;text-overflow:ellipsis}a2j-rich-text{display:block;position:relative}a2j-page-break{display:block;position:relative;page-break-after:left}a2j-page-break p{padding:0;line-height:0;text-align:center;border-bottom:1px dotted #ddd}a2j-page-break p span{padding:0 15px;background:#fff}var-picker .var-picker-warning{color:#777;background-color:#fdfaec;border-color:#e0e0e0}var-picker .variable-suggestions .suggestion-container{position:relative}var-picker .variable-suggestions .suggestion-list{display:block;position:absolute;top:0;left:0;right:0;z-index:10;margin:0;padding:0;list-style-type:none;border:1px solid #e0e0e0;border-top:none;box-shadow:0 2px 4px 0 rgba(0,0,0,.5);background-color:#fff}var-picker .variable-suggestions .suggestion-list li{width:100%!important;text-align:left!important;padding:4px 8px;font-size:1em;color:#777;border-bottom:1px solid #e0e0e0}var-picker .variable-suggestions .suggestion-list li:hover{background-color:#def!important;color:#222}var-picker .variable-suggestions .suggestion-list li:last-child{border-bottom:none}var-picker .variable-suggestions .suggestion-list li.suggestion-item.active{background-color:#def!important;color:#222}a2j-repeat-loop{display:block;position:relative}a2j-repeat-loop .panel-info>.panel-heading{color:#31708f!important}a2j-repeat-loop a2j-variable .var-name{font-weight:400;color:#31708f}a2j-repeat-loop .panel.panel-info>.panel-footer,a2j-repeat-loop .panel.panel-info>.panel-heading{border:1px solid #bce8f1;margin:-1px}a2j-repeat-loop .panel-info>.panel-footer{color:#31708f;border-bottom-left-radius:0;border-bottom-right-radius:0;background-color:#d9edf7}a2j-repeat-loop .inline-items-list .form-control{width:auto;display:inline-block;vertical-align:middle}a2j-repeat-loop element-options-pane .table-column-buttons{padding:5px}a2j-repeat-loop element-options-pane .table-column-buttons .label.label-danger,a2j-repeat-loop element-options-pane .table-column-buttons .label.label-success{border-radius:10px}a2j-repeat-loop element-options-pane .table-form-row{margin-bottom:5px}conditional-add-element{display:block;position:relative}conditional-add-element>div{padding:10px;color:#c8c8c8;border-radius:10px;border:1px dashed #c8c8c8}conditional-add-element>div:hover{color:inherit;border:1px dashed #adadad}conditional-add-element>div.selected{color:#1693ff;border:1px solid #2f698c}conditional-add-element element-options-pane .row{margin-bottom:10px}a2j-conditional{display:block;position:relative}a2j-conditional .label.label-default{padding:5px;margin-left:5px;margin-right:5px;background-color:#fff}a2j-conditional .hidden-form-group{visibility:hidden}a2j-conditional .panel-warning>.panel-body a2j-rich-text .wrapper:not(.selected){overflow-x:auto}a2j-conditional .panel.panel-warning>.panel-else,a2j-conditional .panel.panel-warning>.panel-footer,a2j-conditional .panel.panel-warning>.panel-heading{border:1px solid #faebcc;margin:-1px}a2j-conditional .panel-warning>.panel-heading{color:#8a6d3b!important}a2j-conditional .panel-warning>.panel-else{color:#8a6d3b;padding:8px 15px;background-color:#fcf8e3}a2j-conditional .panel-warning>.panel-footer{color:#8a6d3b;background-color:#fcf8e3;border-bottom-left-radius:0;border-bottom-right-radius:0}a2j-section-title{display:block;position:relative}a2j-section-title hr.title-underline{margin:0;border-top:1px solid #000}a2j-section-title .section-title.count-none:before{content:none;counter-increment:none}a2j-section-title .section-title:not(.count-none):before{counter-increment:section}a2j-section-title .section-title.count-decimal:before{content:counter(section) ".\\0000a0"}a2j-section-title .section-title.count-upper-roman:before{content:counter(section,upper-roman) ".\\0000a0"}a2j-section-title .section-title.count-upper-alpha:before{content:counter(section,upper-alpha) ".\\0000a0"}a2j-template{display:block}a2j-template>ul{padding:0;list-style:none;padding-bottom:40px}a2j-template a2j-template>ul{padding:0}a2j-template .drag-placeholder{border:1px dashed #adadad;background-color:#fafafa!important}a2j-template .drag-placeholder :first-child{visibility:hidden}a2j-template-ssr{display:block;counter-reset:section}
</style><style asset-id="@caliorg/a2jdeps@7.1.0#elements/element-toolbar/element-toolbar.less!steal-less@1.3.4#less">element-toolbar .drag-handle {
  cursor: move;
  transition: all 0.3s ease-in-out;
  margin-right: 10px;
  font-size: 16px;
}
element-toolbar .drag-handle:hover {
  background: #aaaaaa;
  color: white;
}
element-toolbar .move-node-up {
  transition: all 0.3s ease-in-out;
}
element-toolbar .move-node-up span {
  font-size: 16px;
}
element-toolbar .move-node-up:hover {
  background: #aaaaaa;
}
element-toolbar .move-node-up:hover span {
  color: white;
}
element-toolbar .move-node-down {
  transition: all 0.3s ease-in-out;
}
element-toolbar .move-node-down span {
  font-size: 16px;
}
element-toolbar .move-node-down:hover {
  background: #aaaaaa;
}
element-toolbar .move-node-down:hover span {
  color: white;
}
element-toolbar > div {
  padding: 0 10px;
  border: 1px solid #adadad;
}
/*# sourceURL=/node_modules/@caliorg/a2jdeps/elements/element-toolbar/element-toolbar.less */</style><style asset-id="@caliorg/a2jdeps@7.1.0#elements/options-pane/options-pane.less!steal-less@1.3.4#less">element-options-pane {
  display: block;
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
}
element-options-pane .popover {
  width: 390px !important;
  margin-left: 0 !important;
  max-width: 390px !important;
  border-radius: 0 !important;
}
element-options-pane .popover.right {
  float: none !important;
  left: 15px !important;
  top: 0 !important;
}
element-options-pane .popover.right > .arrow {
  top: 15px !important;
}
element-options-pane .popover-close {
  top: -45px !important;
  right: 20px !important;
  color: inherit !important;
  font-size: 30px !important;
  position: relative !important;
}
element-options-pane h3.pane-title {
  margin: 0;
  padding: 17px;
}
element-options-pane .popover-overrides {
  width: 390px;
  margin-left: 0;
  max-width: 390px;
  border-radius: 0;
}
element-options-pane .popover-overrides.right {
  float: none;
  left: 15px;
  top: 0;
}
element-options-pane .popover-overrides.right > .arrow {
  top: 15px;
}
element-options-pane .close-button-overrides {
  top: -45px;
  right: 20px;
  color: inherit;
  font-size: 30px;
  position: relative;
}
/*# sourceURL=/node_modules/@caliorg/a2jdeps/elements/options-pane/options-pane.less */</style><style asset-id="@caliorg/a2jdeps@7.1.0#elements/element-container/element-container.less!steal-less@1.3.4#less">element-container {
  display: block;
  margin-bottom: 20px;
}
element-container .wrapper {
  padding: 10px;
  min-height: 50px;
  border: 1px solid transparent;
}
element-container .wrapper:hover {
  border: 1px dashed #adadad;
}
element-container .wrapper.selected {
  border: 1px solid #adadad;
  border-bottom: none;
}
/*# sourceURL=/node_modules/@caliorg/a2jdeps/elements/element-container/element-container.less */</style><style asset-id="@caliorg/a2jdeps@7.1.0#elements/a2j-legal-nav-resource/a2j-legal-nav-resource.less!steal-less@1.3.4#less">legal-nav-resource-id {
  overflow: hidden;
  padding: 3px 10px;
  border-radius: 6px;
  white-space: nowrap;
  display: inline-block;
  text-overflow: ellipsis;
}
/*# sourceURL=/node_modules/@caliorg/a2jdeps/elements/a2j-legal-nav-resource/a2j-legal-nav-resource.less */</style><style asset-id="@caliorg/a2jdeps@7.1.0#elements/a2j-variable/a2j-variable.less!steal-less@1.3.4#less">a2j-variable .var-name {
  max-width: 200px;
  max-width: 10rem;
  overflow: hidden;
  padding: 3px 10px;
  border-radius: 6px;
  white-space: nowrap;
  display: inline-block;
  text-overflow: ellipsis;
  background-color: #D7ECF5;
  vertical-align: middle;
}
a2j-variable .var-name.unanswered {
  visibility: hidden;
}
/*# sourceURL=/node_modules/@caliorg/a2jdeps/elements/a2j-variable/a2j-variable.less */</style><style asset-id="@caliorg/a2jdeps@7.1.0#elements/varpicker/varpicker.less!steal-less@1.3.4#less">var-picker .var-picker-warning {
  color: #777777;
  background-color: #fdfaec;
  border-color: #e0e0e0;
}
var-picker .variable-suggestions .suggestion-container {
  position: relative;
}
var-picker .variable-suggestions .suggestion-list {
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  margin: 0px;
  padding: 0px;
  list-style-type: none;
  border: 1px solid #e0e0e0;
  border-top: none;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.5);
  background-color: #fff;
}
var-picker .variable-suggestions .suggestion-list li {
  width: 100%!important;
  text-align: left!important;
  padding: 4px 8px;
  font-size: 1em;
  color: #777777;
  border-bottom: 1px solid #e0e0e0;
}
var-picker .variable-suggestions .suggestion-list li:hover {
  background-color: #def !important;
  color: #222222;
}
var-picker .variable-suggestions .suggestion-list li:last-child {
  border-bottom: none;
}
var-picker .variable-suggestions .suggestion-list li.suggestion-item.active {
  background-color: #def !important;
  color: #222222;
}
/*# sourceURL=/node_modules/@caliorg/a2jdeps/elements/varpicker/varpicker.less */</style><style asset-id="@caliorg/a2jdeps@7.1.0#elements/condition-form/condition-form.less!steal-less@1.3.4#less">condition-form .padding-right {
  padding-right: 8px;
}
condition-form .padding-select {
  padding: 5px;
}
condition-form .padding-left {
  padding-left: 0px;
}
/*# sourceURL=/node_modules/@caliorg/a2jdeps/elements/condition-form/condition-form.less */</style><style asset-id="@caliorg/a2jdeps@7.1.0#elements/a2j-conditional/add-element/add-element.less!steal-less@1.3.4#less">conditional-add-element {
  display: block;
  position: relative;
}
conditional-add-element > div {
  padding: 10px;
  color: #c8c8c8;
  border-radius: 10px;
  border: 1px dashed #c8c8c8;
}
conditional-add-element > div:hover {
  color: inherit;
  border: 1px dashed #adadad;
}
conditional-add-element > div.selected {
  color: #1693FF;
  border: 1px solid #2F698C;
}
conditional-add-element element-options-pane .row {
  margin-bottom: 10px;
}
/*# sourceURL=/node_modules/@caliorg/a2jdeps/elements/a2j-conditional/add-element/add-element.less */</style><style asset-id="@caliorg/a2jdeps@7.1.0#elements/a2j-rich-text/a2j-rich-text.less!steal-less@1.3.4#less">a2j-rich-text {
  display: block;
  position: relative;
}
/*# sourceURL=/node_modules/@caliorg/a2jdeps/elements/a2j-rich-text/a2j-rich-text.less */</style><style asset-id="@caliorg/a2jdeps@7.1.0#elements/a2j-page-break/a2j-page-break.less!steal-less@1.3.4#less">a2j-page-break {
  display: block;
  position: relative;
  page-break-after: left;
}
a2j-page-break p {
  padding: 0;
  line-height: 0;
  text-align: center;
  border-bottom: 1px dotted #ddd;
}
a2j-page-break p span {
  padding: 0 15px;
  background: #fff;
}
/*# sourceURL=/node_modules/@caliorg/a2jdeps/elements/a2j-page-break/a2j-page-break.less */</style><style asset-id="@caliorg/a2jdeps@7.1.0#elements/a2j-repeat-loop/a2j-repeat-loop.less!steal-less@1.3.4#less">a2j-repeat-loop {
  display: block;
  position: relative;
}
a2j-repeat-loop .panel-info > .panel-heading {
  color: #31708f !important;
}
a2j-repeat-loop a2j-variable .var-name {
  font-weight: normal;
  color: #31708f;
}
a2j-repeat-loop .panel.panel-info > .panel-heading,
a2j-repeat-loop .panel.panel-info > .panel-footer {
  border: 1px solid #bce8f1;
  margin: -1px;
}
a2j-repeat-loop .panel-info > .panel-footer {
  color: #31708f;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  background-color: #d9edf7;
}
a2j-repeat-loop .inline-items-list .form-control {
  width: auto;
  display: inline-block;
  vertical-align: middle;
}
a2j-repeat-loop element-options-pane .table-column-buttons {
  padding: 5px;
}
a2j-repeat-loop element-options-pane .table-column-buttons .label.label-success,
a2j-repeat-loop element-options-pane .table-column-buttons .label.label-danger {
  border-radius: 10px;
}
a2j-repeat-loop element-options-pane .table-form-row {
  margin-bottom: 5px;
}
/*# sourceURL=/node_modules/@caliorg/a2jdeps/elements/a2j-repeat-loop/a2j-repeat-loop.less */</style><style asset-id="@caliorg/a2jdeps@7.1.0#elements/a2j-conditional/a2j-conditional.less!steal-less@1.3.4#less">a2j-conditional {
  display: block;
  position: relative;
}
a2j-conditional .label.label-default {
  padding: 5px;
  margin-left: 5px;
  margin-right: 5px;
  background-color: white;
}
a2j-conditional .hidden-form-group {
  visibility: hidden;
}
a2j-conditional .panel-warning > .panel-body a2j-rich-text .wrapper:not(.selected) {
  overflow-x: auto;
}
a2j-conditional .panel.panel-warning > .panel-heading,
a2j-conditional .panel.panel-warning > .panel-else,
a2j-conditional .panel.panel-warning > .panel-footer {
  border: 1px solid #faebcc;
  margin: -1px;
}
a2j-conditional .panel-warning > .panel-heading {
  color: #8a6d3b !important;
}
a2j-conditional .panel-warning > .panel-else {
  color: #8a6d3b;
  padding: 8px 15px;
  background-color: #fcf8e3;
}
a2j-conditional .panel-warning > .panel-footer {
  color: #8a6d3b;
  background-color: #fcf8e3;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
/*# sourceURL=/node_modules/@caliorg/a2jdeps/elements/a2j-conditional/a2j-conditional.less */</style><style asset-id="@caliorg/a2jdeps@7.1.0#elements/a2j-section-title/a2j-section-title.less!steal-less@1.3.4#less">a2j-section-title {
  display: block;
  position: relative;
}
a2j-section-title hr.title-underline {
  margin: 0;
  border-top: 1px solid #000;
}
a2j-section-title .section-title.count-none:before {
  content: none;
  counter-increment: none;
}
a2j-section-title .section-title:not(.count-none):before {
  counter-increment: section;
}
a2j-section-title .section-title.count-decimal:before {
  content: counter(section) ".\\0000a0";
}
a2j-section-title .section-title.count-upper-roman:before {
  content: counter(section, upper-roman) ".\\0000a0";
}
a2j-section-title .section-title.count-upper-alpha:before {
  content: counter(section, upper-alpha) ".\\0000a0";
}
/*# sourceURL=/node_modules/@caliorg/a2jdeps/elements/a2j-section-title/a2j-section-title.less */</style><style asset-id="@caliorg/a2jdeps@7.1.0#elements/a2j-template/a2j-template.less!steal-less@1.3.4#less">a2j-template {
  display: block;
  margin: 1em 0;
  padding-bottom: 40px;
}
a2j-template .drag-placeholder {
  border: 1px dashed #adadad;
  background-color: #fafafa !important;
}
a2j-template .drag-placeholder :first-child {
  visibility: hidden;
}
/*# sourceURL=/node_modules/@caliorg/a2jdeps/elements/a2j-template/a2j-template.less */</style><style asset-id="@caliorg/a2jdeps@7.1.0#elements/a2j-template-ssr/a2j-template-ssr.less!steal-less@1.3.4#less">a2j-template-ssr {
  display: block;
  counter-reset: section;
}
/*# sourceURL=/node_modules/@caliorg/a2jdeps/elements/a2j-template-ssr/a2j-template-ssr.less */</style>
  </head>
  <body class="bootstrap-styles">
    <can-import from="server" export-as="viewModel"></can-import>

    <a2j-template-ssr answers:from="request.body.answers" guide:u:id:from="request.body.guideId" render:u:template:u:footers:u:and:u:headers:from="request.body.renderTemplateFootersAndHeaders" template:u:id:from="request.body.templateId" template:u:ids:from="request.body.templateIds" file:u:data:u:url:from="request.body.fileDataUrl"><can-import from="~/elements/a2j-template/"></can-import>
<can-import from="~/elements/a2j-template-ssr/a2j-template-ssr.less"></can-import> 
  
    
  


</a2j-template-ssr>
  </body></html>
`
