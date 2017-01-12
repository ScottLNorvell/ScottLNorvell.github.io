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

Consider an empty object called `obj`. Let's say I a want property `scott` that can only be set to one of three adjectives `'great'`, `'awesome'`, or  `'super'` and when I access the property, it appends `'REALLY '` to the adjective I set.

```javascript
obj.scott = 'great'
console.log(obj.scott) // => 'REALLY great'
obj.scott = 'super'
console.log(obj.scott) // => 'REALLY super'
obj.scott = 'ok' // throws error
```

This task is actually quite trivial using `Object.defineProperty`.

```
const acceptableScottAdjectives = new Set(['great', 'awesome', 'super']);
Object.defineProperty(obj, 'scott', {
  get: function() {
    if (this._scott) {
      return `REALLY ${this._scott}`;
    }
    return '';
  },
  set: function(value) {
    if (acceptableScottAdjectives.has(value)) {
      this._scott = value;
    } else {
      throw `"${value}" is not an acceptable adjective for scott`;
    }
  }
});
```

#### Caveats
- doesn't work in safari :(
- might inexplicably start not working in chrome/firefox 
- what if they use `setAttribute` instead of the `src` setter?
