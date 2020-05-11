
const fs = require('fs');

const buildViewerHtml = function () {
  const version = Date.now();
  const html = template(version);

  function template (version) {
    return `<!--
    A2J Author 6 * Justice * justicia * 正义 * công lý * 사법 * правосудие
    All Contents Copyright The Center for Computer-Assisted Legal Instruction
    2012-2015
    A2J Viewer Plugin
  -->

  <!doctype html>
  <html>
    <head>
      <title>A2J Viewer</title>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>

    <body>
      <div id="viewer-app"></div>
      <script>window.pushState = function () { debugger } </script>
      <script>global = window;</script>
      <script>window.less = { async: true };</script>

      <script>
        localStorage.setItem('a2jConfig', JSON.stringify({
          // path (or url) to the interview XML file
          templateURL: '../guides/default/Guide.xml',

          // folder containing images, templates and other assets related to the interview
          // path can be relative or fully qualified but requires a trailing slash
          fileDataURL: '../guides/default/',

          // endpoint to load an answer file at start, used for RESUME
          getDataURL: '',

          // endpoint to save the answer's file and leaves the viewer (its response replaces viewer's frame)
          setDataURL: './answers.php',

          // (Optional) ajax endpoint to silently save the answer file periodically
          autoSetDataURL: '',

          // use to replace the viewer's frame on EXIT (user 'fails' interview)
          exitURL: 'http://www.a2jauthor.org/',

          // endpoint to silent log data
          // E.g., https://lawhelpinteractive.org/a2j_logging
          logURL: '',

          // errRepURL accepts user's public submission of an error to which they can add an optional comment.
          // E.g., 'https://lawhelpinteractive.org/problem_reporting_form'
          errRepURL: ''
        }));
      </script>

      <script main="@empty"
              env="production"
              config="../package.json!npm"
              src="../dist/bundles/caja/viewer/app.js?v=${version}"
              cache-key="v"
              cache-version="${version}"
              base-url="../">
      </script>
    </body>
  </html>`;
  }

  fs.writeFileSync(__dirname + '/viewer/viewer.html', html, 'utf-8');
}

module.exports =  {
  buildViewerHtml
}
