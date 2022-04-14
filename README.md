# CSS Color Variables


As a frontend guy I love CSS variables. I think they are "the future" because ...

* Are great to do fancy things like dakt/bright mode, High contrast mode etc easily.
* "In place" color editor is easy to implement (as we have in [color_schema_ui](https://www.drupal.org/project/color_schema_ui))
* Its great to remove old color theme layers
* to support ie11 can be polyfilled as long as you're processing root-level custom properties

### Requirements

* Color module (core) must be enabled
* Your theme must have a [color palette](https://www.drupal.org/docs/theming-drupal/color-module).
* Current Browser Support Webkit/Edge/FF/ie11 (ie with submodule)

##### Enable Theme colors / add color palette

```
drush en css_color_variables -y
cp css_color_variables/color.inc.example YOUR_THEME_NAME/color/color.inc
drush cr
```

* Check /admin/appearance/settings/YOUR_THEME_NAME
* There should be color schema settings.

Read more at [drupal.org/docs/theming-drupal/color-module](https://www.drupal.org/docs/theming-drupal/color-module).

#### Main module solely renders CSS variables

The main module `css_color_variables` allows to render your themes color module colors into CSS variables.

After setting custom theme color variables you should see something like


```
.has-css-color-variables {
    --peripheral-color-primary: red;
    --peripheral-color-secondary: gold;
    --peripheral-color-primary-contrast: green;
}
```

in <code>&lt;header&gt;</code> of your your page source.

So in your theme (S)CSS you can do things like

```
.my-colorful-thing {
    background: var(--peripheral-color-secondary);
    color: var(--peripheral-color-secondary);
}
```

#### In your Theme SCSS

```SCSS
$peripheral-color-primary: var(--peripheral-color-primary);
$peripheral-color-secondary: var(--peripheral-color-primary-contrast);
```

You may run into SASS issues with functions like darken(), lighten(), srgb(). Check out `css_color_variables_dependants `.


**Alter the color palette by implementing**

```PHP
/**
 * Implements hook_css_color_variables_alter().
 * 
 * @param $colors array
 *  Current themes color palette before rendered. 
 * @param $theme_name string
 *   Machine name of the requested theme.  
*/
hook_css_color_variables_alter(array &$colors, string $theme_name){}
```


## Sub modules

### css_color_variables_ui

Allows Users with `use color schema` permission to live edit and save the color palette.

Make sure you have '.user-logged-in .nav-tabs.tabs--primary' or '.user-logged-in .nav-tabs.primary' available on your HTML. The module will attache a button 'Color schema UI toggle' there.

If you have css_color_variables_dependants variables defined, they will visually updated (preview) as well. The page will be reloaded after save, so that


### css_color_variables_dependants

Alters the color palette. This module allows you to replace/workaround common SCSS color functions like

```SCSS
lighten($link-color, 15%);
darken($btn-primary-bg, 5%)
transparentize($background-color, .7);
```

You could end up with something like

```css
:root {
  --peripheral-color-primary: ##233755;
  --peripheral-color-primary--darken-5: #176a1e;
  --peripheral-color-primary--darken-15: #005004;
  --peripheral-color-primary--lighten-15: #499c50;
  --peripheral-color-primary--opacity-70: #23762ab2;
}
```

Copy the file `css_color_variables_dependants.yml.example` to your themes `color` directory and play around with it.

Your theme should look like.

```
myTheme
 - colors
   - color.inc
   - css_color_variables_dependants.yml
```

### css_color_variables_demopage

Review colors and Derivates in your theme on /css_color_variables_demopage

### css_color_variables_ie11

Internet Explorer 11 polyfill for css variables.

