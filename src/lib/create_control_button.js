const domUtils = require('./dom_utils');
const Constants = require('../constants');

/**
 * Creates a control button; adds click listeners to it; and returns it.
 *
 * @param {Object} options
 * @param {HTMLElement} options.container - Element to which the button will be appended.
 * @param {string} options.title - A title attribute value for the button.
 * @param {string} options.onActivate - A function to call when the button is activated.
 * @param {string} [options.id] - An id attribute value for the button.
 * @return {HTMLElement} The control button
 */
function createControlButton(options) {
  const attributes = { title: options.title };
  if (options.id) attributes.id = options.id;

  attributes.class = `${Constants.CONTROL_BUTTON_CLASS} ${options.className}`;

  const button = domUtils.create('button', options.container, attributes);

  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const el = e.target;

    if (el.classList.contains('active')) {
      el.classList.remove('active');
    } else {
      domUtils.removeClass(document.querySelectorAll(`.${Constants.CONTROL_BUTTON_CLASS}`), 'active');
      el.classList.add('active');
      options.onActivate();
    }

  }, true);

  return button;
}

module.exports = createControlButton;
