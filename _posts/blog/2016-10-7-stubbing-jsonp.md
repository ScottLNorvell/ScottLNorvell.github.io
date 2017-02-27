---
layout: post
title: Stubbing JSONP Requests For Testing
group_with: blog
---

A front-end Javascript test suite should live as independent of "the internet" as possible. It is a good idea to stub out all data requests in your test suite to return consistent and predictable fixture data. There are a number of reasons for this: 

- The data on your server or a third party api could change breaking assertions made in your test suite. 
- Your front-end test suite is not testing the ability of your api to return data. (You should have a back-end test suite for that).
- Your front-end test suite is also not testing the ability of a third party api to return data. If a third party api is down, your test suite should still run. (And you should probably have test cases that handle this scenario).
- As much as it is possible, your test suite should only break if your code breaks.

There are a number of ways to stub traditional cross domain data requests, most of which involve temporarily rewriting `XMLHttpRequest` or jQuery's ajax method. (Have a look at [sinon's fake server](http://sinonjs.org/docs/#server)). However, it is a bit trickier to stub a JSONP request since there is no standard api for making one. 

### A Quick Overview of How JSONP Works
JSONP is essentially a browser hack to get around cross domain issues.  Instead of using an `XMLHttpRequest` to fetch data from a different domain, you use a `<script>` tag. Because of jQuery's ajax method, the casual developer can invoke JSONP without really thinking about it simply by changing one letter in the options hash. (`$.ajax({ dataType: 'jsonp', url })` vs. `$.ajax({ dataType: 'json', url })`). However, to demystify things, here is a ridiculously simple implementation:

```javascript
// create a unique callback and put it on the window
const callbackName = 'uniqueCallback' + (new Date()).getTime();
window[callbackName] = (data) => {
  // the callback takes in the data as json and does
  // something with it here
  console.log('here is that data =>', data);
};
// append the callback name to your request url
//   (the query param "callback" is common but by 
//   no means standard, check the api's documentation)
const requestUrl = `http://server.com/?callback=${callbackName}`;
// make a script element with your requestUrl as a source
const script = document.createElement('script');
script.src = requestUrl;
script.onload = () => // consider removing the script here
// append the script... that's it!
document.body.appendChild(script);
```

In this example, the response from `requestUrl` will be formatted to immmediately call the provided callback with the data it retrieves. That's all there is to it!

## Stubbing a JSONP Request
Now that you know how JSONP works, there are a handful of options for stubbing out these types of requests to return fixture data in a test suite.

### The "Find and Stub" Method
The easiest way to stub a JSONP request (especially if you own the code making the request) is to find the specific method and temporarily overwrite it. Imagine you've written a utility called `requester` that makes different types of requests. This utility has a method called `getJSONP` that returns a `Promise` for data requested via JSONP. [Sinon](http://sinonjs.org/docs/) is an excellent utility for stubbing individual methods in a test suite. However doing it yourself is quite easy.

```javascript
import requester from 'utils/requester';

// create a temporary private variable to hold the default 
// implementation of getJSONP
let _oldGetJSONP;

// export a utility function to stub getJSONP with fixture data
export function stubGetJSONP(fixtureData) {
  // cache the default implementation (to restore later)
  _oldGetJSONP = requester.getJSONP;
  // overwrite `getJSONP` to return your fixture data
  requester.getJSONP = () => {
    // many modern libraries return promises
    // calling Promise.resolve assures the return result
    // will have the same api (i.e. `.then`) as the default
    // implementation
    return Promise.resolve(fixtureData);
  }
}

// export a utility function to restore the default
// (be sure to call this after every test runs to avoid bugs!)
export function restoreGetJSONP() {
  // only restore if it exists, otherwise you will overwrite 
  // the default implementation
  if (_oldGetJSONP) {
    requester.getJSONP = _oldGetJSONP;
  }
  // null out `_oldGetJSONP` so that subsequent calls to this 
  // method are No-ops
  _oldGetJSONP = null;
}

```

>NOTE: Later on we'll get into [how to use stubbing utilities](#useage) like this in a test suite. 

### The "Hijack the `src`" Method
And now for the fun part! Imagine you are using some sort of minified third party SDK (like from an ad company) and need to, say, test if ads are rendering before a video in your custom html5 player. (Is this sounding like a true story?) The ad requests are made via JSONP and code is closure compiled so there is little to no hope of using the "Find and Stub" method. Don't give up! As it turns out, Javascript's versatility enables a glorious hack for stubbing third party JSONP requests through the use of [`Object.defineProperty`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty).

#### A Quick Overview of  `Object.defineProperty`
Consider an empty object called `obj`. Let's say I want a property `scott` that can only be set to one of three adjectives `'great'`, `'awesome'`, or  `'super'`. When I access the property, it appends `'REALLY '` to the adjective I set.

```javascript
obj.scott = 'great';
console.log(obj.scott); // => 'REALLY great'
obj.scott = 'super';
console.log(obj.scott); // => 'REALLY super'
obj.scott = 'meh'; // throws error
```

This task is actually quite trivial using `Object.defineProperty`.

```javascript
// declare acceptable adjectives (great, awesome, super)
// I like to use a `Set` for this because it is optimized to 
// query for inclusion (see below)
const acceptableScottAdjectives = new Set(
  ['great', 'awesome', 'super']
);
// Using Object.defineProperty we have a huge amount of control 
//  over how getters and setters behave on an object
Object.defineProperty(obj, 'scott', {
  set: function(value) {
    // for the setter, validate and set a private value 
    if (acceptableScottAdjectives.has(value)) {
      this._scott = value;
    } else {
      // - OR - throw an error!
      throw `"${value}" is not an acceptable scott adjective`;
    }
  },
  get: function() {
    // for the getter, check the private value and prepend 
    // "REALLY " if it exists.
    if (this._scott) {
      return `REALLY ${this._scott}`;
    }
    return '';
  }
});
```

As you can see, Javascript gives us a huge amount of control over how getters and setters (`property=`) behave. Based on this example, we can extrapolate a solution to stubbing a JSONP request.

#### Redefine `script.src` Getter/Setter
The key to this stubbing JSONP requests in this manner lies in the following line from our example [JSONP implementation](#a-quick-overview-of-how-jsonp-works): `script.src = requestUrl`. Since this is a basic setter method, we can use `Object.defineProperty` to control and potentially modify how this line behaves. First, we need to mimic the original behavior such that our meddling does not break any other code that depends on setting the `src` property of a script element. The following example should suffice.

```javascript
// `HTMLScriptElement.prototype` is standing in for `obj`
// in the previous example
Object.defineProperty(HTMLScriptElement.prototype, 'src', {
  get: function() {
    // behavior is to return value or empty string
    return this._src || '';
  },
  set: function(src) {
    this._src = src;
  }
});
```

As you might have guessed, we aren't _quite_ done here since the behavior of `script.src=` is to actually set the attribute on the element itself. Luckily Javascript gives us an alternative way to do this. 

```javascript
Object.defineProperty(HTMLScriptElement.prototype, 'src', {
  get: function() {
    return this._src || '';
  },
  set: function(src) {
    this._src = src;
    this.setAttribute('src', src);
  }
});
```

Now that we have this working, let's contemplate the `set` function and see how we might modify it.

```javascript
function set(src) {
  // Hmmm, I have access to the `src` property!
  // I could modify it however I see fit!
  // Like, I could replace it with malicious code
  const replacementSrc = '/malicious-code.js'; // Bwa ha ha ha
  this._src = replacementSrc;
  this.setAttribute('src', replacementSrc);
}
```

... whoah. Now that we've seen how we can maliciously overwrite the `src` setter, let's see what we'll need to conditionally modify the `src` to stub a JSONP request in a test environment. We will wrap everything into a nice exportable util called `watchScriptSrc`.

```javascript
// if we call this more than once in a page's lifecycle, 
// it will break. Let's keep track!
let alreadyRan = false;
export function watchScriptSrc() {
  // wrap in a try/catch because not all browsers let us 
  // do this :(
  try {
    if (!alreadyRan) {
      Object.defineProperty(
        HTMLScriptElement.prototype,
        'src',
        {
          get() {
            return this._src || '';
          },
          set(src) {
            const replacementSrc = conditionallySwapSrc(src);
            this._src = replacementSrc;
            this.setAttribute('src', replacementSrc);
          }
        }
      );
      alreadyRan = true;
    } else {
      // warn the application if she tries to run this again
      console.warn(
        'You already ran `watchScriptSrc`.' + 
        'This only needs to happen ONCE.'
      );
    }
  } catch (error) {
    // Log an error if the browser doesn't support this. 
    // It might make sense to throw here since your tests
    // will not behave as expected.
    // Another option would be to set a global boolean flag and 
    // skip tests that use this logic in unsupported browsers.
    console.error(
      "Oh dear! This browser won't let me overwrite `src` " +
      "getter/setter for <script> tags :(", 
      error
    );
  }
}

```

To stub a JSONP response in a test environment, in addition to `watchScriptSrc`, we need the following:

- `stubJSONPResponse`/`restoreJSONPResponses`: Just like in the "[Find and Stub](#the-find-and-stub-method)" example above, as part of the public api we'll need a way for the user to stub specific JSONP responses with custom fixture data before each test and restore the default implementation after each test is run.
- `conditionallySwapSrc`: We saw this in `watchScriptSrc`. To implement, we'll check regular expression patterns set in `stubJSONPResponse` and replace the `src` if a match is found.
- `fakeJSONPResponseURL`: We will need a way to create a replacement url that will call the provided callback with the fixture data.
- `extractQueryParams`: Lastly, to get a reference to the JSONP callback function we'll need some kind of utility to extract query params from a url.

Let's get started!

#### Implementing `stubJSONPResponse`/`restoreJSONPResponses`
We will store the url patterns we want to stub along with the intended fixture data using a cool [ES6 `Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) structure for a few reasons:

- You can use regular expressions as keys! (stay tuned for why that's cool)
- It can be easily emptied for our restore function.
- It is built to be iterated over!

```javascript
// Here's that Map I was telling you about
const stubMap = new Map();
export function stubJSONPResponse(
    // a regular expression that matches the url we 
    // want to stub. (like `/example\.com/`)
    regex, 
    // the fixture data to return instead of the response
    data, 
    // The query param that stores the JSONP callback.
    // Use 'callback' as the default but allow for others. 
    // (like 'cbfn' etc)
    callbackKey = 'callback'
  ) {
  // Set the regular expression as the key and all of the 
  // metadata we'll need to properly stub.
  stubMap.set(regex, { data, callbackKey });
}

export function restoreJSONPResponses() {
  // as mentioned above, restoring is simple
  stubMap.clear();
}
```

#### Implementing `conditionallySwapSrc`
We want to check each potential script source against anything that might have been set as part of `stubJSONPResponse`.

```javascript

function conditionallySwapSrc(src) {
  // iterate through our stubMap
  for (const [regex, metadata] of stubMap) {
    // see if we have a match
    if (regex.test(src)) {
      // extract the data and callbackKey the user provided
      const { data, callbackKey } = metadata;
      // try to get the callback function name from the 
      // query params
      const { 
        [callbackKey]: callbackFnName 
      } = extractQueryParams(src);

      // if it worked, return a url to the fake response
      if (callbackFnName) {
        return fakeJSONPResponseURL(data, callbackFnName);
      }
    }
  }
  // if no matches or callback name, just pass the original src 
  // right through
  return src;
}
```

#### Implementing `extractQueryParams`
We need a utility that can turn `example.com?scott=great&javascript=fun` into `{scott: 'great', javascript: 'fun'}`. There are a lot of utilities that will do this. You can see my solution in the [full example](#all-together-now) below.

#### Implementing `fakeJSONPResponseURL`
We need to make a JSONP response in memory and reference the response from a url that can be placed on the script tag instead of the original url. We can use the [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob/Blob) and [`URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL) apis for this!

```javascript
function fakeJSONPResponseURL(data, callbackName) {
  // stringify our data
  const json = JSON.stringify(data);
  // build our template
  const template = `${callbackName}(${json})`;
  // construct our blob from the template
  const blob = new Blob([template]);
  // create and return a url reference to the blob
  // (this will look something like
  // "blob:http://example.com/asdfasdf-qwerqwer")
  return URL.createObjectURL(blob);
}
```

#### Useage
Now how might you use this in a test? Here is a simple example written in `QUnit`. The concept can be applied to most Javascript test frameworks.

```javascript
import { 
  watchScriptSrc, 
  stubJSONPResponse, 
  restoreJSONPResponses 
} from 'jsonp-stubber';
import requester from 'utils/requester';

// `.begin` will run once before all of our tests
QUnit.begin(() => watchScriptSrc());
// `.testDone` will clear out our stubMap after every test.
QUnit.testDone(() => restoreJSONPResponses());

QUnit.test('my JSONP response returns fake data', (assert) => {
  const fakeData = { scott: 'awesome' };
  const done = assert.async();
  stubJSONPResponse(/example\.com/, fakeData);
  // call some code that invokes a JSONP request to example.com
  requester.getJSONP('//example.com/data.js?callback=myCallback')
    .then((data) => {
      assert.deepEqual(
        data, 
        fakeData, 
        'the fake data was returned!'
      );
      done();
    });
});
```

### Final Word (and some caveats...)
The "Hijack the `src`" method is most certainly a glorious hack. Many of its concepts could be adapted to assert whether other properties are set on other types of elements or objects. (I considered a version that watched `Image.prototype.src` to assert beacons were fired on ad events.) However, even though I had a version of this running in a production test suite for quite a while, it is worth pointing out a few caveats. 

#### It Doesn't Work in Safari `:(`
Overwriting the getter/setter for an Html object in Safari simply errors out. Given the types of malicious code one could dream up using this approach, perhaps it is actually a _feature_ that Safari protects against it.

#### It Might Stop Working In Other Browsers 
On that note, it could arguably be considered a _bug_ that this works in other browsers at all! I suppose there is a chance the Chrome and Firefox teams will read this blog post and patch it in the next release. It is also worth noting that the [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob/Blob) and [`URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL) apis are considered experimental.

#### Third Party Code Might Change Its Implementation
The "Hijack the `src`" method is really only recommended to test code that you do not have control over (third party code). It is probably safer and more future-proof to use the "[Find and Stub](#the-find-and-stub-method)" method for code that you do control. It is worth noting that if the third party code you are stubbing refactors to use `setAttribute('src', src)` instead  `src=`, "Hijack the `src`" would  stop working.

### All Together Now!
Here is the full example sans comments for your copy-and-paste-style package management purposes.

```javascript
let alreadyRan = false;
export function watchScriptSrc() {
  try {
    if (!alreadyRan) {
      Object.defineProperty(
        HTMLScriptElement.prototype,
        'src',
        {
          configurable: true,
          enumerable: false,
          get() {
            return this._src || '';
          },
          set(src) {
            const replacementSrc = conditionallySwapSrc(src);
            this._src = replacementSrc;
            this.setAttribute('src', replacementSrc);
          }
        }
      );
      alreadyRan = true;
    } else {
      console.warn('you already ran `watchScriptSrc`. This only needs to happen ONCE.');
    }
  } catch (e) {
    console.error("Oh dear! This browser won't let me overwrite `src` getter/setter for <script> tags :(", e);
  }
}

const stubMap = new Map();
export function stubJSONPResponse(regex, data, callbackKey = 'callback') {
  stubMap.set(regex, { data, callbackKey });
}

export function restoreJSONPResponses() {
  stubMap.clear();
}

function conditionallySwapSrc(src) {
  for (const [regex, metadata] of stubMap) {
    if (regex.test(src)) {
      const { data, callbackKey } = metadata;
      const { [callbackKey]: callbackFnName } = extractQueryParams(src);

      if (callbackFnName) {
        return fakeJSONPResponseURL(data, callbackFnName);
      }
    }
  }
  return src;
}

function fakeJSONPResponseURL(data, callbackName) {
  const json = JSON.stringify(data);
  const template = `${callbackName}(${json})`;
  const blob = new Blob([template]);
  return URL.createObjectURL(blob);
}

function extractQueryParams(url) {
  const paramString = url.split(/[?;]/)[1];
  if (paramString) {
    return paramString.split('&').reduce((acc, param) => {
      const [k, v] = param.split('=');
      acc[k] = decodeURIComponent(v);
      return acc;
    }, {});
  } else {
    return {};
  }
}
```
