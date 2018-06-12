# A2JViewer

This repo hosts the distributable production version of the A2J Viewer.

Within it you'll find a `.zip` file containing the minified JavaScript source for the viewer,a basic guide/interview, and a `README.md` file explaining the contents of the `.zip` file in greater detail.

NOTE: By downloading this application, you are agreeing to the terms included in the user license [LICENSE.md](https://github.com/CCALI/A2JViewer/blob/master/LICENSE.md).

## Hosting
Current supported environments are:

* Webserver platform of either IIS 8.5+, Apache 2.4+, or Nginx 1.12+
* PHP is the recommended platform for processing interview data locally but is not required to run the viewer. All current samlple processing code and the demo widget is written in PHP. Versions 5.6+ are supported but 7.2+ is recommended as 5.6 and 7.0 will be unsupported at the end of 2018.

While other server environments may work, they have not been tested.  Should you get another hosting environment working, please do a Pull Request at the hosted [A2J Viewer](https://github.com/CCALI/A2JViewer) repo to let us know any steps taken so that we may share with others.

Unzip the viewer package into your webroot or preferred directory on your web server. The Apache user, for example `www-data` or `apache`, should own the folder where you place the viewer. Settings for configuring the viewer are found in the `viewer.html` file. The default settings work with the Demo Widget (see below), but should be updated to match your `guides` directory on your server. For example, you will most likely want to store A2J Guided Interview® files in a directory that is populated internally or with your own file upload interface.

## Hosting Considerations
Links to A2J Guided Interviews® are not encrypted by default, and can be viewed by anyone who has an active link to that interview. If you have privacy concerns, please make sure to take proper steps to restrict access as needed.

## Viewer Customization
The file viewer.html contains several endpoints to allow data to be be exported and imported into the viewer. A description can be found here: https://www.a2jauthor.org/content/setting-a2j-author%C2%AE-40-your-own-server-processing-xml-output-alternative-use and is listed below:

templateURL - the website URL for the A2J Author® interview file (this is the file with the .a2j extension, but you can rename it anything you like)

fileDataURL - this is the directory where the audio/MP3 files for the interview can be found. MP3 files are recorded/created outside of A2J Author® and uploaded separately from the interview itself.

getDataURL - the website URL of where you have previously stored the user's partially completed interview answer data. This is optional and only needed if you are setting up your website to remember the data that a user has entered so far. This is interesting where you let people register at your website and collect information that you can use in all interviews on your website and information that might be common to all interviews (like name, address, etc.). At present, this DOES NOT mean that the user can save the interview at a particular point and then come back to that same point. When they return to the interview later, they must start from the beginning - with the only advantage being that the data they had previously entered is already filled in.

setDataURL - website URL of where you want to send the data from the interview when the use SENDs or SUBMITs the completed interview. This must be some website-based program that can "catch" the XML data stream that contains the user's answers to your interview in HotDocs .anx format.

exitURL - website URL is where the user's browser is directed if they exit an interview without getting to the end. This is typically because they don't qualify to use the service. This is the DEFAULT URL. Inside the interview, the author can actually point the EXIT button to any URL they want and it will override this value. This URL is used only if the author has not specified a URL inside the interview for any EXIT buttons.

The default viewer.html points the save data endpoint, setDataURL to a demo page called Answers.php that outputs the xml produced by the viewer through a post body key called "AnswerKey". It does not save files to the disk- that code must be written since it is unpredictable how self-hosters would like to process their data. PHP is commonly used, but if you prefer another language, anything that can process http post requests will work.

You can also use a query parameter to force the endpoints to any custom value. For instance,you can point setDataURL to point to your custom save-answers code using relative paths like www.example.org/a2j-viewer/viewer/viewer.html?templateURL=../Guides/someguide&setDataURL=mysaveanswers.php

## Demo Widget
There is a basic interview uploader and launcher at the default path of `yourwebroot/path/a2j-viewer/viewer` This allows you to quickly upload and test individual A2J Guided Interviews®, as well as see sample query string parameters used to load and launch those interviews. Click the upload button to select a A2J Guided Interview® saved in .zip format.  This generates a unique name and link to launch the interview in a new tab. Interviews can also be deleted from this list, which removes them from the local `guides` folder.

If A2J Guided Interviews® don't successfully upload or delete, make sure the folder permissions allow read and write capability to the `guides` folder, and execute permissions on any php code.

To find out more about A2J Viewer and A2J Author® please see our website, [www.a2jauthor.org](https://www.a2jauthor.org/)

For questions, contact Tobias Nteireho at tobias@cali.org
