---
layout: post
title: Stubbing JsonP In Test Environments
group_with: blog
---

A test suite for a javascript page should live as independent of the "internet" as possible. It is good to stub out all data requests in your test suite for a number of reasons.

- Data is alive! Your data might change under your nose breaking assertions you might have made in your test suite
- Your front end test suite is not _necessarily_ testing your api's ability to return data. (You should have a back end test suite for that)
- If yours (or a third party's) api is down, your test suite should still run.


### A Quick Overview of How JsonP Works

### Stubbing by "Just Calling the Javascript"

### Hijack the `src`

#### Caveats
- doesn't work in safari :(
- might inexplicably start not working in chrome/firefox 
