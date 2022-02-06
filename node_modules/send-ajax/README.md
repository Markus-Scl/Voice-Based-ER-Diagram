# send-ajax

[![npm version](https://img.shields.io/npm/v/send-ajax?color=yellow)](https://www.npmjs.com/package/send-ajax)
[![license](https://img.shields.io/npm/l/send-ajax)](https://github.com/axios/axios/blob/HEAD/LICENSE)
[![downloads](https://img.shields.io/npm/dw/send-ajax)](https://www.npmjs.com/package/send-ajax)
[![issues](https://img.shields.io/github/issues/webenot/send-ajax)](https://github.com/webenot/send-ajax/issues)
![last commit](https://img.shields.io/github/last-commit/webenot/send-ajax)
[![dependents](https://img.shields.io/librariesio/dependents/npm/send-ajax)](https://www.npmjs.com/package/send-ajax)
![minified size](https://img.shields.io/bundlephobia/min/send-ajax)
![languages](https://img.shields.io/github/languages/top/webenot/send-ajax)

Make ajax requests without jQuery

### Installation
```$xslt
$ npm i send-ajax
```

Example with Promise:

```js
import * as sendAjax from 'send-ajax';

let postRequest = null;

const postData = (ajaxUrl, data = {}) => {
  return new Promise((resolve, reject) => {
    postRequest = sendAjax({
      url: ajaxUrl,
      method: 'POST',
      data,
      responseType: 'json',
      success: data => {
        resolve(data);
      },
      error: err => {
        reject({ error: true, message: 'Error message', data: err });
      },
    });
  });
};

const sendDataToServer = (url, data = {}) => {
  postData(url, data)
    .then(response => {
      console.log(response);
    })
    .catch(error => {
      console.error(error);
    })
    .finally(() => {
      // always executed
    });
};
```

Abort request:
```js
if (postRequest) {
  postRequest.abort();
}
```

Example without Promise:

```js
import * as sendAjax from 'send-ajax';

const postData = (ajaxUrl, data, success, error, after) => {
  return sendAjax({
    url: ajaxUrl,
    method: 'POST',
    data,
    responseType: 'json',
    success: data => {
      success(data);
    },
    error: err => {
      error(err);
    },
    after: () => {
      // always executed
    }
  });
};

const sendDataToServer = (url, data = {}) => {
  const postRequest = postData(
    url,
    data,
    response => {
      console.log(response);
    },
    error => {
      console.error(error);
    },
    () => {
      // always executed
    },
  );
  if (postRequest) {
    postRequest.abort();
  }
};
```

### Request Config:
These are the available config options for making requests:

**url** - request url. Default ``'/'``.

**method** - request method. Default ```'GET'```.

**before** - function for execute before request send. Default ```null```.

**after** - function for execute after request send regardless of success response. Default ```null```.

**contentType** - sending content type. Default ```application/x-www-form-urlencoded```. To send files use parameter ```contentType: 'multipart/form-data'```.

**responseType** - type of response data. Default ```text```. Available values: ```json```, ```xml```, ```jsonp```. ```jsonp``` - for cross domain requests (only GET requests).

**data** - sending data (for POST requests) or request parameters (for GET requests, where object format is ```{ paramName: paramValue }``` associate with url string like ```http://site.com?paramName=paramValue```). Default ```{}```.

**async** - make request async. Default ```true```.

**timeout** - maximum server response timeout in milliseconds. Default ```0``` which means there is no timeout.

**credentials** - allow or not allow cookies. Default ```false```.

**success** - function for execute when request is success. Default ```null```.

**error** - function for execute when error occurred. Default ```null```.

**headers** - request headers array. Default ```[]```.

## License

[MIT](https://github.com/axios/axios/blob/HEAD/LICENSE)
