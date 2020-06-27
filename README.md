# CSS Color Variables


As a frontend guy I love CSS variables. I think they are "the future" because ...

* Are great to do fancy things like dakt/bright mode, High contrast mode etc easily.
* "In place" color editor is easy to implement (as we have in [color_schema_ui](https://www.drupal.org/project/color_schema_ui))
* Its great to remove old color theme layers 
* to support ie11 can be polyfilled as long as you're processing root-level custom properties

### Requirements

* Color module (core) must be enabled
* Your theme must have a [color palette](https://www.drupal.org/docs/theming-drupal/color-module).
* Current Broweser Support Webkit/Edge/FF

##### Enable Theme colors / add color palette

```
drush en css_color_variables -y
cp css_color_variables/color.inc.example YOUR_THEME_NAME/color/color.inc
drush cr
```

* Check /admin/appearance/settings/YOUR_THEME_NAME
* There should be color schema settings.

Read more at [drupal.org/docs/theming-drupal/color-module](https://www.drupal.org/docs/theming-drupal/color-module).

### Current state

#### Render variables (POC)

After setting custom theme color variables you should see something like

```
:root {
    --color-primary: red;
    --color-secondary: gold;
    --primary-contrast: green;
}
```

pretty your page source.

So in your theme (S)CSS you can do things like

```
:root {
    --color-primary: red;
    --color-secondary: gold;
    --primary-contrast: green;
}
```

## TODO

* Submodule UI part to change variables like in `color_schema_ui`.
  * JS module to change Color variables live on frontend
  * Ajax update settings, Permission
* Submodule ie11 support
	* Only ie11 polyfill planed so far
* Main module 
	* CSS inline or dynamic library by settings (better support dor external aggregation)
