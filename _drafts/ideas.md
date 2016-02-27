---
layout: post
title: Ideas
group_with: blog
---

So we should choose one and do it!

### MongoDB and Mongoid (tips and tricks)
- take a look and re-work n+1 tracker docs
- optimizing
  + includes
  + pluck
  + redundant storage
  + embedded vs associated
  + only

### JS deconstruction tips!

### About our ember upgrade
perhaps re-work ember-refresher doc

### Uses for Ember Helpers
- is-active-index
  + instead of sitting there wondering if it exists in ember (ok, spend a few mins with the docs to make sure you don't create it twice) create it! I'm not kidding man, it's a super simple function
- useage 
  + `{{like-this}}` 
  + `{{other-component prop=(like-this)}}`
  + `{{if (like-this) 'this'}}`
- testing
- what does ember g do? (exports function _AND_ helper) Why?
  + for the test
  + so you can use it in computed props etc
    * Show tn-action-button label refactor

### To Use the Library or NOT to use the library
- READ it! (library readthru)
- if you're using a framework
- double (triple? quadruple?) jQuery
- enter modules (only load what you need!)

### Adventures in Ember Testing
- test helpers (show matcher)
  + unit
  + integration
  + acceptance

### Musings in premature optimizations

### My Code Review policy
- scrutinize
- if you haven't made ONE suggestion, you haven't done your job
- even if you don't agree with the suggestion
  + start the conversation! (possibly not worth changing, but did you consider:)
- even if it's a one-line change (more of a challenge)
- changes:
  + style-guide
  + could this be dryer
  + could this be prematurely optimized?
