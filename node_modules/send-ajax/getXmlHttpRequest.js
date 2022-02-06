/**
 * Returns object XMLHttpRequest or null if could not create object (browser does not support ajax)
 *
 * @return {Object|null}
 *
 * @version 1.0.2
 * @author webenot@mail.ua
 */
const getXmlHttpRequest = () => {
  if (!window) return null;

  const isIE8 = !!window.XDomainRequest;
  const ActiveXObject = window.ActiveXObject || null;
  const XMLHttpRequest = window.XMLHttpRequest || null;

  if (isIE8) return new window.XDomainRequest();

  let result;

  if (XMLHttpRequest) {
    try {
      result = new XMLHttpRequest();
    } catch (e) {
      result = null;
    }
  } else if (ActiveXObject) {
    try {
      result = new ActiveXObject('Msxml2.XMLHTTP');
    } catch (e) {
      result = null;
    }
    try {
      result = new ActiveXObject('Microsoft.XMLHTTP');
    } catch (e) {
      result = null;
    }
  }
  return result;
};

module.exports = getXmlHttpRequest;
