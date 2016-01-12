---
layout: post
title: Ember Refresher Course
group_with: blog
---

# Ember Refresher
_(a MUST READ)_

### Introduction
Condé Nast Entertainment built [The Scene](htts://thescene.com) in [Ember](http://emberjs.com/) and [Rails](http://rubyonrails.org/) back in the summer of 2014. We launched with a Ember 1.7 canary because it had experimental support for query params which we needed for playlist pages. A LOT has changed about Ember since then. Many of the changes have been under-the-hood performance improvements. Many more came about to make Ember more straight-forward to newcomers and veterans alike. As a result, Ember 2.0 is actually much easier to use than Ember 1.7 because of the elimination of several confusing features.

### EVERYTHING is a component
In Ember 1.7, there were FAR too many ways to do the same thing.

For example, each of these renders `AwesomeStuff` and comes with it's own set of arbitrary quirks:
- Render inline as a `View`. This has it's own set of actions but can also take in things from the parent context



talk about how my team built a Ember 1.7 app and how things have changed

link to post mortem talk

things are more succinct

what is it? a view? a compontent? do I render it in an outlet? 

MOST of the time? It's a component

Where do I put my logic? my computed props? The View? The Controller? What's a service?

Answer Unless it's a query param

query params => controller

singleton/long-lived state => service

"decorations", actions, extra state => component

so this: (show confusing controller, view, template etc logic)
becomes this: (show)

We're almost done! How do we do animations? 

#### 1.7 => o shit! maybe we just skip it
(show ugly animation)
#### 1.? and on => liquid fire
(show sexy animation)

#### Talk about Integration Tests
(figure them out..)
