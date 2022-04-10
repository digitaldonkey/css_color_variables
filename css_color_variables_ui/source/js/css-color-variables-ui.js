import Picker from 'vanilla-picker/dist/vanilla-picker';
import Axios from 'axios';
import AWN from 'awesome-notifications';
import color from 'color';

(async ($, drupalSettings, document) => {
  /**
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.addLocalTaskCssColorVariablesUiToggle = {
    attach: () => {
      if (!_.isEmpty(drupalSettings.css_color_variables_ui.current_route)) {
        const menu = $('.user-logged-in .nav-tabs.tabs--primary, .user-logged-in .nav-tabs.primary, .user-logged-in .tabs.primary').first();
        menu
          .once()
          .append(
            '<li class="nav-item"><a href="#" title="Color schema UI toggle" class="color-schema-ui-toggle disabled"><span class="nav-link">Color schema UI toggle</span></a></li>'
          );
      }
    }
  };

  /**
   * Color schema edit UI.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.openCssColorVariablesUiDialogue = {
    attach: async () => {
      Drupal.behaviors.openCssColorVariablesUiDialogue.initColorChanger();
    },
    async initColorChanger() {
      $('.color-schema-ui-toggle')
        .once('color-change-ui-init')
        .on({
          click: event => {
            const toggleButton = $(event.currentTarget);
            event.preventDefault();
            if (toggleButton.hasClass('disabled')) {
              toggleButton.removeClass('disabled').addClass('enabled');
              this.activateColorChanger();
            } else {
              this.deactivateColorChanger();
            }
          }
        });
    },

    /**
     * Open UI.
     */
    async activateColorChanger() {
      $('body').append(drupalSettings.css_color_variables_ui.html_template);
      const self = this;
      const settings = drupalSettings.css_color_variables_ui;
      if (!drupalSettings.css_color_variables_ui.colorInfo) {
        // Load fields and schemas.
        drupalSettings.css_color_variables_ui.colorInfo = await this.getColorInfo();
      }
      // Collect CSS vars so we can update derivated colors.
      settings.rootCssVariables = this.getRootCSS();

      // eslint-disable-next-line prefer-destructuring
      const colors = settings.colorInfo.schemes._current.colors;
      Object.keys(colors).forEach(key => {
        const value = colors[key];
        const button = $(`#color-schema-ui [data-color="${key}"]`);
        let previousValue = value;
        let picker = null;
        let derivates = null;
        // Check for derivate colors.
        if (key.indexOf("__") === -1) {
          derivates = this.getDerivates(key);
        }
        self.setButtonTextColor(button, value);
        const setValue = (hexVal) => {
          // Change CSS variable.
          document.body.style.setProperty(
            self.toCssVar(key),
            hexVal
          );
          // Change button text color.
          self.setButtonTextColor(button, hexVal);
          // Update derivate CSS variables.
          if (derivates) {
            this.updateDerivateCss(hexVal, derivates);
          }
        };
        button.on({
          click: () => {
            if (!picker) {
              picker = new Picker({
                parent: button[0],
                alpha: false,
                color: value,
                cancelButton: true,
                onClose: () => {
                  setValue(previousValue);
                },
                onDone: newVal => {
                  // Converting HEX RGBA to color_module 6-digit hex.
                  const hexVal = newVal.hex.substr(0, 7);
                  previousValue = hexVal;
                  setValue(hexVal);
                },
                onChange: self.debounce(newVal => {
                  // Converting HEX RGBA to color_module 6-digit hex.
                  const hexVal = newVal.hex.substr(0, 7);
                  setValue(hexVal);
                }, 5)
              });
              picker.setColor(this.getCurrentCssColorByName(key));
              picker.show();
            }
          }
        });
      });

      // Set up notifications
      this.notifier = new AWN({
        position: `top-right`,
        notify_callback: () => {
          window.location.reload();
        }
      });

      // Init save action
      $('#color-schema-ui button.save').on({
        click: this.save.bind(this)
      });
      $('#color-schema-ui button.cancel').on({
        click: this.deactivateColorChanger.bind(this)
      });
    },

    /**
     * Close UI.
     */
    deactivateColorChanger() {
      $('.color-schema-ui-toggle').removeClass('enabled').addClass('disabled');
      $('#color-schema-ui').remove();
      // Currently required we need new variants
      window.location.reload();
    },

    /**
     * Retrieve specific color from window.
     *
     * @param colorName string
     * @return string
     *   Color value.
     */
    getCurrentCssColorByName(colorName) {
      return this.getCurrentCssColors().filter(el => el[colorName])[0][
        colorName
      ];
    },

    /**
     * Retrieve all colors from window
     * @return Array
     *    Color Array [{colorName: value}].
     */
    getCurrentCssColors() {
      const settings = drupalSettings.css_color_variables_ui;
      const rootStyle = getComputedStyle(document.body);
      const colors = [];
      Object.keys(settings.colorInfo.fields).forEach((key, i) => {
        colors.push({
          [key]: rootStyle.getPropertyValue(this.toCssVar(key)).trim()
        });
      });
      return colors;
    },

    /**
     * Converts color name to css variable.
     *
     * @param colorName string
     * @return string
     */
    toCssVar(colorName) {
      return `--${colorName.replace(/_/g, '-')}`;
    },

    /**
     * Save colors to Drupal.
     */
    async save() {
      const buttons = $('#color-schema-ui button:not(.picker_done)');
      buttons.prop('disabled', true);
      const url = `${
        drupalSettings.css_color_variables_ui.save_color_info
      }?${this.getRandomId()}`;
      await Axios.post(url, JSON.stringify(this.getCurrentCssColors())).then(resp => {
        if (resp.status === 200 && resp.data) {
          this.notifier.success(Drupal.t('Theme colors saved.'));
        }
        else {
          this.notifier.error(Drupal.t('Failed to save colors.'));
        }
        buttons.prop('disabled', false);
        this.deactivateColorChanger();
      });
    },

    /**
     * Provides a background contrasting text color.
     *
     * @param button {jQuery}
     * @param value  string
     *    Background color
     *
     * @return string
     *   Forground color hex string.
     */
    setButtonTextColor(button, value) {
      button.css('color', color(value).luminosity() > 0.5 ? '#000' : '#fff');
    },

    /**
     * Load color schema and field names.
     *
     * @return {Promise<AxiosResponse<any>>}
     */
    async getColorInfo() {
      const url = `${
        drupalSettings.css_color_variables_ui.get_color_info
      }?${this.getRandomId()}`;
      return Axios.post(url).then(resp => resp.data);
    },

    /**
     * Simple debouncer.
     */
    debounce(callback, wait) {
      let timeout;
      return (...args) => {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => callback.apply(context, args), wait);
      };
    },

    /**
     * Cache braking request string.
     * @return {string}
     */
    getRandomId() {
      let text = '';
      const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      for (let i = 0; i < 5; i++) {
        text += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return text;
    },

    /**
     * Get all CSS root variables.
     *
     * With ♥ from tnt-rox
     * @see https://stackoverflow.com/a/54851636/308533
     * @return Array
     */
    getRootCSS() {
      return Array.from(document.styleSheets)
        .filter(
          sheet =>
            sheet.href === null || sheet.href.startsWith(window.location.origin)
        )
        .reduce(
          (acc, sheet) =>
            (acc = [
              ...acc,
              ...Array.from(sheet.cssRules).reduce(
                (def, rule) =>
                  (def =
                    rule.selectorText === ":root"
                      ? [
                        ...def,
                        ...Array.from(rule.style).filter(name =>
                          name.startsWith("--")
                        )
                      ]
                      : def),
                []
              )
            ]),
          []
        );
      ;
    },

    /**
     * Find all derivates to a color.
     *
     * @param color
     *  Color basename
     */
    getDerivates(color) {
      const derivates = [];
      const derivateCssVariables = drupalSettings.css_color_variables_ui.rootCssVariables.forEach((cssVar) => {
        if (cssVar.startsWith(`--${color}--`)) {
          const params = cssVar.substr(`--${color}--`.length).split('-');
          derivates.push({
            name:  color,
            action: params[0],
            value: params[1],
            cssvar: cssVar,
          })
        }
      });
      return derivates;
    },

    /**
     * Find all derivates to a color.
     *
     * @param color
     *  Color basename
     */
    async updateDerivateCss(color, derivates) {
      derivates.forEach((d) => {
        switch(d.action) {
          case 'darken':
            document.documentElement.style.setProperty(d.cssvar, this.adjustColorLuminance(color, -1 * d.value/100 ));
            break;
          case 'lighten':
            document.documentElement.style.setProperty(d.cssvar, this.adjustColorLuminance(color, d.value/100 ));
            break;
          case 'opacity':
            const opaHex = Math.round((256 * d.value / 100)).toString(16);
            document.documentElement.style.setProperty(d.cssvar, `${color}${opaHex}`);
            break;
          case 'contrast':
            // Do nothing.
            break;
          default:
            console.warn(`Unknown action '${d.action}' at updateDerivateCss : '${d.cssvar}'`)
        }
      })
    },

    /**
     * Adjust color brightness.
     *
     * @param hex
     * @param lum
     * @return {string}
     */
    adjustColorLuminance(hex, lum) {
      // validate hex string
      hex = String(hex).replace(/[^0-9a-f]/gi, '');
      if (hex.length < 6) {
        hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
      }
      lum = lum || 0;
      // convert to decimal and change luminosity
      var rgb = "#", c, i;
      for (i = 0; i < 3; i++) {
        c = parseInt(hex.substr(i*2,2), 16);
        c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
        rgb += ("00"+c).substr(c.length);
      }
      return rgb;
    }

  }
})(window.jQuery, window.drupalSettings, window.document);
