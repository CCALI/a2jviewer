@page grid Grid System
@parent styles-start 1

## Introduction
Bootstrap includes a responsive, mobile first fluid grid system that appropriately scales up to 12 columns as the device or viewport size increases. It includes [predefined classes](http://getbootstrap.com/css/#grid-example-basic) for easy layout options, as well as powerful [mixins for generating more semantic layouts](http://getbootstrap.com/css/#grid-less).

Grid systems are used for creating page layouts through a series of rows and columns that house your content. Here's how the Bootstrap grid system works:


- Rows must be placed within a `.container` (fixed-width) or `.container-fluid` (full-width) for proper alignment and padding.
- Use rows to create horizontal groups of columns.
- Content should be placed within columns, and only columns may be immediate children of rows.
- Predefined grid classes like `.row` and `.col-xs-4` are available for quickly making grid layouts. Less mixins can also be used for more semantic layouts.
- Columns create gutters (gaps between column content) via padding. That padding is offset in rows for the first and last column via negative margin on `.rows`.
- The negative margin is why the examples below are outdented. It's so that content within grid columns is lined up with non-grid content.
- Grid columns are created by specifying the number of twelve available columns you wish to span. For example, three equal columns would use three `.col-xs-4`.
- If more than 12 columns are placed within a single row, each group of extra columns will, as one unit, wrap onto a new line.
- Grid classes apply to devices with screen widths greater than or equal to the breakpoint sizes, and override grid classes targeted at smaller devices. Therefore, e.g. applying any .col-md-* class to an element will not only affect its styling on medium devices but also on large devices if a `.col-lg-*` class is not present.
- Look to the examples for applying these principles to your code.

## Media Queries

We use the following media queries in our Less files to create the key breakpoints in our grid system.


```
/* Extra small devices (phones, less than 768px) */
/* No media query since this is the default in Bootstrap */

/* Small devices (tablets, 768px and up) */
@@media (min-width: @screen-sm-min) { ... }

/* Medium devices (desktops, 992px and up) */
@@media (min-width: @screen-md-min) { ... }

/* Large devices (large desktops, 1200px and up) */
@@media (min-width: @screen-lg-min) { ... }
```

We occasionally expand on these media queries to include a `max-width` to limit CSS to a narrower set of devices.


```
@@media (max-width: @screen-xs-max) { ... }
@@media (min-width: @screen-sm-min) and (max-width: @screen-sm-max) { ... }
@@media (min-width: @screen-md-min) and (max-width: @screen-md-max) { ... }
@@media (min-width: @screen-lg-min) { ... }
```
