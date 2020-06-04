@stylesheet icons Iconography
@parent styles-theme 3

This page describes the custom icon font used for the application.

## Usage
Adding an icon only requires adding the `glyphicon-` class to any HTML element, preferably inline elements like `<span>` or `<i>`.

Example: `<span class="glyphicon-pencil"></span>`

Because the icons are a font, all CSS rules can be applied to change the appearance like `text-shadow`, `color`, or `font-size`.

Example:
````
.my-special-icon {
  text-shadow: 0 -1px 0 rgba(0, 0, 0, .5);
  color: #5cb85c;
  font-size: 24px;
}
<span class="my-special-icon glyphicon-flag"></span>
````

It's best to add icons as a *separate* inline element (`span`) to a parent tag, rather than add the icon class to the parent tag itself. For example, if you want to add an icon to a H1 title, do: 
````
<h1><span class="glyphicon-doc"></span> My Heading Title</h1>
````

## Available icons
@demo demos/icon-font/demo.html

## Adding or removing icons
Icons use a special font file generated automatically by <a href="http://fontello.com/">Fontello.com</a>. Icon files are located in `author/styles/icon-font` and should not be modified directly.

To update the font, locate the file `config.json` and drag it into the browser window at <a href="http://fontello.com/">Fontello.com</a> - this file contains all the information necessary to recreate the font, icons, and related CSS. Using the Fontello interface, you can select and remove icons from the library. You can also drag custom SVG images into the browser window to add them. When finished, click "Download Webfont". Copy all of the files from Fontello to `author/styles/icon-font` replacing the existing files. The icon library is now updated with the new icons.
