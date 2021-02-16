# A2JViewer

This repo hosts the distributable production version of the A2J Viewer.

Within it you'll find a `.zip` file containing the minified JavaScript source for the viewer,a basic guide/interview, and a `README.md` file explaining the contents of the `.zip` file in greater detail.

NOTE: By downloading this application, you are agreeing to the terms included in the user license [LICENSE.md](https://github.com/CCALI/a2jviewer/blob/master/LICENSE.md).

## Hosting
Current supported environments are:

* Webserver platform of either IIS 8.5+, Apache 2.4+, or Nginx 1.12+
* PHP is the recommended platform for processing interview data locally but is not required to run the viewer. All current samlple processing code and the demo widget is written in PHP. PHP Versions 7.4+ is currently supported.

While other server environments may work, they have not been tested.  Should you get another hosting environment working, please do a Pull Request at the hosted [A2J Viewer](https://github.com/CCALI/a2jviewer) repo to let us know any steps taken so that we may share with others.

## Installing from zip
Download the latest viewer from the releases page https://github.com/CCALI/a2jviewer/releases. Unzip the viewer package into your webroot or preferred directory on your web server. The Apache user, for example `www-data` or `apache`, should own the folder where you place the viewer. Settings for configuring the viewer are found in the `viewer.html` file. The default settings work with the Demo Widget (see below), but should be updated to match your `guides` directory on your server. For example, you will most likely want to store A2J Guided Interview® files in a directory that is populated internally or with your own file upload interface.

##Installing from source

### Install build tools

1.)  Install nvm
The DAT is a simple restful API that requires nodejs to serve endpoints. Though, you are free to install the node version that the DAT targets and manage it manually, the recommended method is to use a node version manager which will allow the simultaneous installation of multiple versions of node and mitigates several administration issues.

Obtain nvm for windows here: https://github.com/coreybutler/nvm-windows

For \*nix go here: https://github.com/creationix/nvm

2.) Install node through nvm
after installation of nvm, type the following commands in the terminal to install the required node version

```
nvm install 12.20.1
nvm use 12.20.1
```

check that the install was successful by typing

`node -v`

which should produce the version number of node we installed, `12.20.1`
clone this repo (https://github.com/CCALI/a2jviewer/releases)

### Build from source

`npm run deploy`

OR the equivalent

```
npm install
npm run build
mv index.html index.dev.html
mv index.production.html index.html
```

## Upgrading
1.) backup your old viewer and Guided Interviews

2.) unzip or build new viewer

3.) copy your Guided Interviews into the new viewer folder

## Hosting Considerations
Links to A2J Guided Interviews® are not protected by default, and can be viewed by anyone who has an active link to that interview. Answers are output in a human readable text format and are recommended to be stored with strong encryption outside of the webtree with a robust access control mechanism. Please make sure to take proper steps to protect data and restrict access as needed.

## Viewer Customization
The file viewer.html contains several endpoints to allow data to be be exported and imported into the viewer. A description can be found here: https://www.a2jauthor.org/content/setting-a2j-author%C2%AE-40-your-own-server-processing-xml-output-alternative-use and is listed below:

`templateURL` - **\[mandatory]** the location for the A2J Author® interview file (this is the file with the .a2j extension or the Guide.xml or Guide.json)

`fileDataURL` - **\[mandatory]** this must point to the location of assets such as audio, video, xml, and templates. Due to a known bug, this endpoint cannot be a web URL and must be a system path relative to the directory housing the page you are launching the viewer from. In most setups this is the /a2j-viewer/viewer/ directory.

`getDataURL` - **\[optional]** the location of where you have previously stored the user's partially completed interview answer data. This is optional and only needed if you are setting up your website to remember the data that a user has entered so far. For example this is useful in cases such as where you let people register at your website and collect information that you can use in all interviews on your website and information that might be common to all interviews (like name, address, etc.). At present, this DOES NOT mean that the user can save the interview at a particular point and then come back to that same point. When they return to the interview later, they must start from the beginning - with the only advantage being that the data they had previously entered is already filled in.

`setDataURL` - **\[optional]** location of where you want to send the data from the interview when the use SENDs or SUBMITs the completed interview. This must be some website-based program that can "catch" the XML data stream that contains the user's answers to your interview in HotDocs .anx format and in an equivalent json format through an http POST.

`exitURL` - **\[optional]** location of where the user's browser is directed if they exit an interview without getting to the end. This is typically because they don't qualify to use the service. This is the DEFAULT URL. Inside the interview, the author can actually point the EXIT button to any URL they want and it will override this value. This URL is used only if the author has not specified a URL inside the interview for any EXIT buttons.


The default viewer.html points the save data endpoint, `setDataURL` to a demo page called Answers.php that outputs the xml produced by the viewer through a post body key called "AnswerKey". It does not save files to the disk- that code must be written since it is unpredictable how self-hosters would like to process their data. PHP is commonly used, but if you prefer another language, anything that can process http post requests will work.

You can also use a query parameter to force the endpoints to any custom value. For instance,you can point setDataURL to point to your custom save-answers code using relative paths like www.example.org/a2j-viewer/viewer/viewer.html?templateURL=../Guides/someguide&setDataURL=mysaveanswers.php

## Demo Widget
There is a basic interview uploader and launcher at the default path of `yourwebroot/path/a2j-viewer/viewer` This allows you to quickly upload and test individual A2J Guided Interviews®, as well as see sample query string parameters used to load and launch those interviews. Click the upload button to select a A2J Guided Interview® saved in .zip format.  This generates a unique name and link to launch the interview in a new tab. Interviews can also be deleted from this list, which removes them from the local `guides` folder.

If A2J Guided Interviews® don't successfully upload or delete, make sure the folder permissions allow read and write capability to the `guides` folder, and execute permissions on any php code.

To find out more about A2J Viewer and A2J Author® please see our website, [www.a2jauthor.org](https://www.a2jauthor.org/)

Ever growing backend documentation including tutorials and examples can be found at [https://www.a2jauthor.org/content/a2j-selfhosting-and-backend](https://www.a2jauthor.org/content/a2j-selfhosting-and-backend)

For questions, contact Tobias Nteireho at tobias@cali.org
