# A2JViewer

This repo hosts the distributable production version of the A2J Viewer.

Within it you'll find a `.zip` file containing the minified JavaScript source for the viewer,a basic guide/interview, and a `README.md` file explaining the contents of the `.zip` file in greater detail.

NOTE: By downloading this application, you are agreeing to the terms included in the user license [LICENSE.md](https://github.com/CCALI/A2JViewer/blob/master/LICENSE.md).

## Hosting

To host the A2J Viewer, the current confirmed hosting enviroment is a server running:
* Apache2.4
* PHP 5.5 or 5.6

While other server environments may work, they have not been tested.  Should you get another hosting environment working, please do a Pull Request at the hosted [A2J Viewer](https://github.com/CCALI/A2JViewer) repo to let us know any steps taken so that we may share with others.


Unzip the viewer package into your webroot or preferred directory on your web server. The Apache user, for example `www-data`, should own the folder where you place the viewer. Settings for configuring the viewer are found in the `viewer.html` file. The default settings work with the Demo Widget (see below), but should be updated to match your `guides` directory on your server. For example, you will most likely want to store A2J Guided Interview® files in a directory that is populated internally or with your own file upload interface.

## Hosting Considerations
Links to A2J Guided Interviews® are not encrypted by default, and can be viewed by anyone who has an active link to that interview. If you have privacy concerns, please make sure to take proper steps to restrict access as needed.


## Demo Widget
There is a basic interview uploader and launcher at the default path of `yourwebroot/path/a2j-viewer/viewer` This allows you to quickly upload and test individual A2J Guided Interviews®, as well as see sample query string parameters used to load and launch those interviews. Click the upload button to select a A2J Guided Interview® saved in .zip format.  This generates a unique name and link to launch the interview in a new tab. Interviews can also be deleted from this list, which removes them from the local `guides` folder.

If A2J Guided Interviews® don't successfully upload or delete, make sure the folder permissions allow read and write capability to the `guides` folder, and execute permissions on any php code.

To find out more about A2J Viewer and A2J Author® please see our website, [www.a2jauthor.org](https://www.a2jauthor.org/)
