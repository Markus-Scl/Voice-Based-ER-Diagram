// Imports
const getXmlHttpRequest = require('./getXmlHttpRequest');

/**
 * Send Ajax-request (without jQuery)
 *
 * @param {string=}   url='/'             - request url
 * @param {string=}   method='GET'        - request method
 * @param {function=} before=null         - function for execute before request send
 * @param {function=} after=null          - function for execute after request send
 *                                            regardless of success response
 * @param {string=}   contentType='application/x-www-form-urlencoded' - sending content type
 * @param {string=}   responseType='text' - type of response data
 * @param {Object=}   data={}             - sending data (for POST, PATCH or CREATE requests)
 * @param {boolean=}  async=true          - make request async
 * @param {number=}   timeout=0           - maximum server response timeout
 * @param {boolean=}  credentials=false   - allow or not allow cookies
 * @param {function=} success=null        - function for execute when request is success
 * @param {function=} error=null          - function for execute when request came with an error
 * @param {Array=}    headers=[]          - request headers array
 *
 * @return {null|Object}
 *
 * @version 1.0.2
 * @author webenot@mail.ua
 */

const sendAjax = ({
  url = '/',
  method = 'GET',
  before = null,
  after = null,
  contentType = 'application/x-www-form-urlencoded',
  responseType = 'text',
  data = {},
  async = true,
  timeout = 0,
  credentials = false,
  success = null,
  error = null,
  headers = [],
}) => {
  before = before && typeof before === 'function' ? before : null;
  after = after && typeof after === 'function' ? after : null;
  data = data && Object.keys(data).length ? data : {};
  async = !!async;
  credentials = !!credentials;
  error = error && typeof error === 'function' ? error : null;
  success = success && typeof success === 'function' ? success : null;
  headers = headers.length ? headers : [];

  // Collect request parameters into a request (multipart/form-data - only for post requests)
  let params = [];
  if (contentType.toLowerCase() === 'multipart/form-data' && method.toLowerCase() === 'post') {
    params = new FormData();
    if (data) {
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          params.append(key, data[key]);
        }
      }
    }
  } else {
    if (data) {
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          params.push(`${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`);
        }
      }
    }

    params = params.join('&');
  }

  // For cross domain requests on jsonp format (only GET requests)
  if (responseType.toLowerCase() === 'jsonp' && method.toLowerCase() === 'get') {
    const aborted = { aborted: false };
    /**
     * Get JSONP data for cross-domain AJAX requests
     * @private
     * @link http://cameronspear.com/blog/exactly-what-is-jsonp/
     * @param {string} jsonpUrl     - The URL of the JSON request
     * @param {function} jsonpCallback - The name of the callback to run on load
     */
    const loadJSONP = (jsonpUrl, jsonpCallback) => {
      // Create script with url and callback (if specified)
      const script = window.document.createElement('script');
      script.src = `${jsonpUrl + (jsonpUrl.indexOf('?') + 1 ? '&' : '?')}callback=${jsonpCallback}`;

      // Insert script tag into the DOM (append to <head>)
      document.body.appendChild(script);

      // After the script is loaded (and executed) or if error, remove it
      script.onload = () => {
        script.remove();
      };

      script.error = () => {
        script.remove();
      };
    };

    // Generate callback name
    const callback = `_callback${new Date().getTime()}`;

    // Function to run on success
    window[callback] = (callbackData) => {
      if (success && !aborted.aborted) {
        success(callbackData);
      }
    };

    url += params.length ? `?${params}` : '';

    if (before && !aborted.aborted) {
      before(data);
    }

    // Run request
    if (!aborted.aborted) {
      loadJSONP(url, callback);
    }

    if (after && !aborted.aborted) {
      after(data);
    }

    return {
      abort: () => {
        aborted.aborted = true;
        return null;
      },
    };
  }

  // Using XMLHttpRequest object
  const xhr = getXmlHttpRequest();

  if (!xhr) {
    error({
      error: true,
      message: 'Browser does not support XMLHttpRequest object',
    });
    return null;
  }

  xhr.withCredentials = credentials;

  xhr.onreadystatechange = () => {
    if (xhr.readyState === 0) {
      if (before) {
        before();
      }
    }
  };

  if (after) {
    xhr.addEventListener('loadend', after);
  }
  if (error) {
    xhr.addEventListener('error', error);
  }

  if (success) {
    xhr.addEventListener('load', () => {
      success(xhr.response);
    });
  }

  xhr.responseType = responseType;

  if (method.toLowerCase() === 'get' && params) {
    url += `?${params}`;
  }

  xhr.open(method, url, async);

  xhr.timeout = timeout;

  if (contentType.toLowerCase() !== 'multipart/form-data') {
    xhr.setRequestHeader('Content-Type', contentType);
  }

  headers.forEach((item) => {
    xhr.setRequestHeader(item.name, item.value);
  });

  if (method.toLowerCase() === 'get') {
    xhr.send();
  } else {
    xhr.send(params);
  }

  // Возвращаем объект запроса для возможности прерывания запроса
  return xhr;
};

module.exports = sendAjax;
