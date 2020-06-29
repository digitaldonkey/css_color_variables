<?php

namespace Drupal\css_color_variables_ui\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\Component\Utility\Color;

/**
 * Handles interaction with color changer JS.
 */
class ColorVariablesUiController extends ControllerBase {

  // /* @var $requestContentHandler \Drupal\color_schema_ui\RequestContentHandler*/
  //  private $requestContentHandler;
  //
  //  public function __construct(RequestContentHandler $requestContentHandler) {
  //    $this->requestContentHandler = $requestContentHandler;
  //  }
  //
  //  public static function create(ContainerInterface $container) {
  //    return new static(
  //      $container->get('color_schema_ui.request_content_handler')
  //    );
  //  }
  //

  /**
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   */
  public function getColorInfo(): JsonResponse {
    $theme = \Drupal::service('theme.manager')->getActiveTheme();
    /* @var $conf \Drupal\Core\Config\ImmutableConfig */
    $conf = \Drupal::config('color.theme.' . $theme->getName());
    $colors = color_get_palette($theme->getName());
    $theme_color_definition = color_get_info($theme->getName());
    $response = [
      'fields' => $theme_color_definition['fields'],
      'schemes' => array_merge(
        ['_current' => ['colors' => $colors]],
        $theme_color_definition['schemes'],
      ),
    ];
    return new JsonResponse($response);
  }

  /**
   *
   */
  public function saveColors(Request $request): JsonResponse {
    $theme = \Drupal::service('theme.manager')->getActiveTheme();
    try {
      // Validate.
      $values = $this->validateColors(json_decode($request->getContent(), TRUE), $theme->getName());

      /* @var $conf \Drupal\Core\Config\Config */
      $conf = \Drupal::configFactory()->getEditable('color.theme.' . $theme->getName());
      $conf->set('palette', $values);
      $conf->save();
      $response = $conf->getRawData();
    }
    catch (\Exception $exception) {
      return new JsonResponse('Invalid data', 400);
    }

    $response = $values;
    return new JsonResponse($response);
  }

  /**
   * @param $rawData
   * @param array $theme
   */
  private function validateColors(?array $rawData, string $themeId) : array {
    if (!is_array($rawData)) {
      throw new \Exception('Invalid data submitted');
    }
    $themeColors = color_get_palette($themeId);
    $values = [];
    foreach ($rawData as $arr) {
      $colorName = key($arr);
      if (isset($themeColors[$colorName])) {
        $value = $arr[$colorName];
        // Input validation for color module 6-digit hex..
        $len = strlen($value) === 7;
        $pref = substr($value, 0, 1) === '#';
        $hex = color_valid_hexadecimal_string($value);
        if ($len && $pref && $hex) {
          $values[$colorName] = $value;
        }
      }
    }
    if (count($values) !== count($themeColors)) {
      throw new \Exception('Submitted color set does not match the colors required in ' . $themeId);
    }
    return $values;
  }

}
// Throw new NotFoundHttpException();
