@page overview Overview
@parent styles-start 0

## HTML5

Bootstrap makes use of certain HTML elements and CSS properties that require the use of the HTML5 doctype. Include it at the beginning of all your projects.

```
<!DOCTYPE html>
  <html lang="en">
  ...
  </html>
```

## Mobile Viewport

To ensure proper rendering and touch zooming, add the viewport meta tag to your `<head>`.

    <meta name="viewport" content="width=device-width, initial-scale=1">
    
    
## Typography and List
Bootstrap sets basic global display, typography, and link styles. Specifically, we:


-   Set background-color: `#fff;` on the body
-   Use the @font-family-base, `@font-size-base`, and `@line-height-base` attributes as our typographic base
-   Set the global link color via `@link-color` and apply link underlines only on `:hover`


These styles can be found within `scaffolding.less`.


## Normalize
For improved cross-browser rendering, we use Normalize.css, a project by Nicolas Gallagher and Jonathan Neal.


## Containers
Bootstrap requires a containing element to wrap site contents and house our grid system. You may choose one of two containers to use in your projects. Note that, due to padding and more, neither container is nestable.

Use `.container` for a responsive fixed width container.

```
<div class="container">
  ...
</div>
```

Use `.container-fluid` for a full width container, spanning the entire width of your viewport.

```
<div class="container-fluid">
  ...
</div>
```
