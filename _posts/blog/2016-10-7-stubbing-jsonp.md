---
layout: post
title: Stubbing JsonP In Test Environments
group_with: blog
---

A javascript test suite for a site should live as independent of the "internet" as possible. It is good to stub out all data requests in your test suite for a number of reasons.

- Data is alive! Your data might change under your nose breaking assertions you might have made in your test suite
- Your front end test suite is not _necessarily_ testing your api's ability to return data. (You should have a back end test suite for that)
- If yours (or a third party's) api is down, your test suite should still run.

There are a number of ways to stub traditional cross domain data requests, most of which involve temporarily rewriting `XMLHttpRequest` or jQuery's ajax method (have a look at sinon's fake server [LINK])

### A Quick Overview of How JsonP Works
JsonP at its core is a browser hack to get around CORS issues. Basically, instead of using an `XMLHttpRequest` to get your data, you use a `<script>` tag. Because of jQuery's ajax method, the casual developer can invoke JsonP by simply changing one letter. (`$.ajax({ dataType: 'jsonp', url })` vs. `$.ajax({ dataType: 'json', url })`). However, to demystify things, here is a ridiculously simple example:

```javascript
// put a unique callback on the window
//   (to ensure uniqueness, we append a timestamp)
const callbackName = 'uniqueCallback' + (new Date()).getTime();
window[callbackName] = (data) => {
  // do something with the data here 
  console.log('here is that data =>', data);
};
// append the callback name to your request url
//   (the query param "callback" is pretty common but by no means standard, 
//   check the api's documentation)
const requestUrl = `http://server.com/data?callback=${callbackName}`;
// make a script element with your requestUrl as a source
const script = document.createElement('script');
script.src = requestUrl;
script.onload = () => // consider removing the script here
// append the script... that's it!
document.body.appendChild(script);
```

### Stubbing by "Just Calling the Javascript"
The somewhat boring

### Hijack the `src`
And now for the fun part! Imagine you are using some sort of minified third party SDK (like from an ad company) and need to, say, test if ads are rendering before a video in your custom html5 player. (Is this sounding like a true story?) As it turns out, javascript enables a glorious hack for this through the use of [`Object.defineProperty`](link).

#### `Object.defineProperty`
Consider an empty object called `obj`. Let's say I a want property `scott` that can only be set to one of three adjectives `'great'`, `'awesome'`, or  `'super'`. When I access the property, it appends `'REALLY '` to the adjective I set.

```javascript
obj.scott = 'great';
console.log(obj.scott); // => 'REALLY great'
obj.scott = 'super';
console.log(obj.scott); // => 'REALLY super'
obj.scott = 'ok'; // throws error
```

This task is actually quite trivial using `Object.defineProperty`.

```javascript
// declare acceptable adjectives (great, awesome, super)
const acceptableScottAdjectives = new Set(['great', 'awesome', 'super']);
// There's that definePropety I told you about! 
Object.defineProperty(obj, 'scott', {
  get: function() {
    // check the private value (see below)
    // prepend REALLY if it exists.
    if (this._scott) {
      return `REALLY ${this._scott}`;
    }
    return '';
  },
  set: function(value) {
    // for our setter, validate and set a private value 
    // - OR - throw an error!
    if (acceptableScottAdjectives.has(value)) {
      this._scott = value;
    } else {
      throw `"${value}" is not an acceptable adjective for scott`;
    }
  }
});
```

So you as you can see, Javascript gives us a huge amount of control over how getters and setters (`property=`) behave. Based on this example, we can extrapolate a solution to stubbing our simple JSONP method above.

#### Hijacking the `src`
The key to this problem lies in the line `script.src = requestUrl`. Since this is a basic setter method, we can use `Object.defineProperty` to control and potentially modify how this line behaves. First, we need to mimic the original behavior so that our meddling doesn't break any other code that depends on setting the `src` property of a script element. The following example should suffice.

```javascript
// Here `HTMLScriptElement.prototype` is stanging in for `obj`
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

Now that we have this working, let's contemplate the `set` function and see how it might better serve our purpose.

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

And now that we've seen how we can maliciously overwrite the `src` setter, let's see what we'll need to conditionally modify the `src` to stub in a test environment.
- `stubJsonPResponse`/`restoreJsonPResponses`: a way for the user to stub specific JSONP responses with custom fixture data before each test and restore after each test is run.
- `conditionallySwapOutSrc`: check regular expression patterns set in `stubJsonPResponse` and replace the `src` if a match is found.
- `fakeJsonPResponseURL`: create a replacement url that will call the provided callback with the fixture data.
- `extractQueryParams`: some kind of utility to extract query params from a url.

Let's get started!

#### `stubJsonPResponse`/`restoreJsonPResponses`
We'll store the urls we want to stub using a cool [ES6 `Map`](LINK) structure for a few reasons:

1. You can use regular expressions as keys (stay tuned for why that's cool)
2. It can be easily emptied for our restore function (see below)
3. It is built to be iterated over!

```javascript
// that map I was telling you about
const stubMap = new Map();
export function stubJsonPResponse(
    // some sort of RegExp that matches the url we want to stub
    // like `/example\.com/`
    regex, 
    // the fixture data to return instead of the response
    data, 
    // the query param that stores the jsonp callback
    // Use 'callback' as the default but allow for others like 'cbfn' etc
    callbackKey = 'callback'
  ) {
  // Set the RegExp as the key and all of the metadata we'll need to
  // properly stub
  stubMap.set(regex, { data, callbackKey });
}

export function restoreJsonPResponses() {
  // as mentioned above, restoring is this simple
  stubMap.clear();
}
```

#### `conditionallySwapOutSrc`

```javascript

function conditionallySwapOutSrc(src) {
  // iterate through our stubMap
  for (const [regex, metadata] of stubMap) {
    // see if we have a match
    if (regex.test(src)) {
      // extract the data and callbackKey the user provided
      const { data, callbackKey } = metadata;
      // try to get the callback function name from the queryParams
      const { [callbackKey]: callbackFnName } = extractQueryParams(src);

      // if it worked, return the fake response
      if (callbackFnName) {
        return fakeJsonPResponseURL(data, callbackFnName);
      }
    }
  }
  // if no matches, pass the original src right through
  return src;
}
```

#### `extractQueryParams`
This basically needs to turn `example.com?scott=great&javascript=fun` into `{scott: 'great', javascript: 'fun'}`. There are a lot of utilities that will do this. You can see my solution in the [full example](LINK).

```javascript
function extractQueryParams(url) {
  // split the url on '?' to get just the query params.
  // note: some request urls ad extra information after a semicolon,
  // so this handles that as well.
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

#### `fakeJsonPResponseURL`
Here comes the fun part. We need to make a JSONP response in memory that we can reference from a url so that we can put it on the script. It turns out we can use the [`Blob`](LINK) and [`URL`](LINK) apis for just this!

```javascript
function fakeJsonPResponseURL(data, callbackName) {
  // stringify our data
  const json = JSON.stringify(data);
  // build our template
  const template = `${callbackName}(${json})`;
  // construct our blob from the template
  const blob = new Blob([template]);
  // create and return a url reference to the blob
  // (will look something like "blob:http://example.com/asdfasdf-qwerqwer")
  return URL.createObjectURL(blob);
}
```

#### Useage
Now how might you use this in a test? Here is a simple example written in `Ember`'s flavor of `QUnit`.

```javascript

```

#### Caveats
- doesn't work in safari :(
- might inexplicably start not working in chrome/firefox 
- what if they use `setAttribute` instead of the `src` setter?

#### All Together now!
Here is the full example sans comments if you care to copy and paste.

```javascript

```
