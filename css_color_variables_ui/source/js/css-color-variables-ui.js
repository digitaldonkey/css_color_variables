import Picker from 'vanilla-picker/dist/vanilla-picker';
import Axios from 'axios';
import AWN from 'awesome-notifications';
import color from 'color';

(async ($, drupalSettings) => {
  /**
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.addLocalTaskCssColorVariablesUiToggle = {
    attach: () => {
      if (!_.isEmpty(drupalSettings.css_color_variables_ui.current_route)) {
        $('.user-logged-in .nav-tabs.tabs--primary')
          .once()
          .append(
            '<li><a href="#" title="Color schema UI toggle" class="color-schema-ui-toggle disabled">Color schema UI toggle</a></li>'
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
              toggleButton.removeClass('enabled').addClass('disabled');
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

      // eslint-disable-next-line prefer-destructuring
      const colors = settings.colorInfo.schemes._current.colors;
      Object.keys(colors).forEach(key => {
        const value = colors[key];
        const button = $(`#color-schema-ui [data-color="${key}"]`);
        let picker = null;
        self.updateButtonTextColor(button, value);
        button.on({
          click: () => {
            if (!picker) {
              picker = new Picker({
                parent: button[0],
                alpha: false,
                color: value,
                onChange: self.debounce(newVal => {
                  // Converting HEX RGBA to color_module 6-digit hex.
                  const hexVal = newVal.hex.substr(0, 7);
                  document.documentElement.style.setProperty(
                    self.toCssVar(key),
                    hexVal
                  );
                  self.updateButtonTextColor(button, newVal.hex);
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
    },

    /**
     * Close UI.
     */
    deactivateColorChanger() {
      $('#color-schema-ui').remove();
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
    updateButtonTextColor(button, value) {
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
    }
  };
})(window.jQuery, window.drupalSettings);
