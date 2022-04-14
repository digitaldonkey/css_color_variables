<?php

namespace Drupal\css_color_variables_demopage\Controller;
use Drupal\Core\Controller\ControllerBase;

class CssColorVariablesDemopage extends ControllerBase {
  public function index() {
    $theme = \Drupal::service('theme.manager')->getActiveTheme();

    $variables = [
      0 => [
        '#type' => 'markup',
        '#markup' => '<ul class="tabs primary"></ul>',
      ],
      1 => [
        '#tag' => 'p',
        '#type' => 'html_tag',
        '#value' => 'Variants are updated on save only. Sorry.'
      ]
    ];

    $theme_color_definition = color_get_info($theme->getName());
    $color_vars = css_color_variables_get_palette();
    // Processed CSS Variables.
    $color_variables = [];

    foreach ($theme_color_definition['fields'] as $color => $title) {

      $color_variants = array_filter($color_vars, function($key) use($color){
          return strpos($key, $color) === 0;
        }, ARRAY_FILTER_USE_KEY);

      array_push($color_variables,[
        "$color" => [
          'title' => $title,
          'id' => $color,
          'css_var' => '--' . str_replace('_', '-', $color),
          'is_editable' => TRUE,
          'variants' => $this->_preprocessColor($color_variants, array_keys($theme_color_definition['fields'])),
          ],
        ]);
    }
    foreach ($color_variables as $color) {
      $variables[] = $this->_renderDirty($color);
    }
    return $variables;
  }


  private function _preprocessColor(Array $color_variables, Array $exclude) {
    foreach ($color_variables as $id => $value) {
      if (in_array($id, $exclude)) {
        unset($color_variables[$id]);
      }
      else {
        $color_variables[$id] = [
          'id' => $id,
          'css_var' => '--' . str_replace('_', '-', $id),
          'is_editable' => FALSE
        ];
      }
    }
    return $color_variables;
  }

  private function _renderDirty(Array $color_variables) {
    $variables = [];

    foreach ($color_variables as $id => $color) {
      // Title
      if (isset($color['title'])) {
        $variables[] = [
          '#tag' => 'h5',
          '#type' => 'html_tag',
          '#value' => $color['title']->render(),
          '#attributes' => [
            'style' => "border-bottom: 1px solid black; margin-top: 2.5rem;",
          ],
        ];
      }

      // Preview
      if (isset($color['css_var'])) {
        $width = $color['is_editable'] ? '8.3rem' : '3rem';
        $width = $color['is_editable'] ? '8.3rem' : '3rem';
        $height = $color['is_editable'] ? '1.5rem' : '1.5rem';
        $fontsize = $color['is_editable'] ? '1rem' : '.8rem';
        $display = $color['is_editable'] ? 'block' : 'inline-block';

        $header = [
          '#type' => 'html_tag',
          '#tag' => 'div',
          '#attributes' => [
            'style' => "display: inline-flex; align-items: center; min-width: 17rem;",
            'onMouseOver' => "this.style.background='#000000'; this.style.color='#ffffff';",
            'onMouseOut' => "this.style.background='transparent'; this.style.color='unset';",
          ],
          [
            '#tag' => 'div',
            '#type' => 'html_tag',
            '#value' => '',
            '#attributes' => [
              'style' => "margin-right: .5em; display: inline-block; height:$height;width:$width;background-color: var(" . $color['css_var'] . ");",
            ],
          ],
          [
            '#tag' => 'pre',
            '#type' => 'html_tag',
            '#value' => $color['css_var'],
            '#attributes' => [
              'style' => "font-size: $fontsize; display: inline-block; line-height: $height; flex-shrink: 0;",
            ],
          ],
        ];
        if ($color['is_editable']) {
          $header[] =  [
            '#tag' => 'p',
            '#type' => 'html_tag',
            '#value' => 'The quick brown fox jumps over the lazy dog.',
            '#attributes' => [
              'style' => "font-size: $fontsize; display: flex; align-self: stretch; flex-grow: 1; padding-left: 1em; color: var(" . $color['css_var'] . ");",
            ],
          ];
        }
        $variables[] = $header;
      }

      // Variants
      if (isset($color['variants'])) {
        $variables[] = [
          '#type' => 'html_tag',
          '#tag' => 'div',
          '#attributes' => [
            'style' => "font-size: $fontsize; display: inline-block; line-height: $height;",
          ],
          0 => $this->_renderDirty($color['variants']),
        ];
      }
    }
    return $variables;
  }
}
