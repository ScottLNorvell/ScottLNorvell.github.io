---
layout: jsvow
title: vacillate
group_with: jsvow
word: vacillate
definition_link: https://www.dictionary.com/browse/vacillate
pronunciation: vas-uh-leyt
---

_Utilities:_

```js
const unique = arr => [...new Set(arr)];

const shuffle = arr => arr
  .map(a => [Math.random(), a])
  .sort((a, b) => a[0] - b[0])
  .map(a => a[1]);

/**
 * Return shuffled array making sure no values are repeated
 * (important for vacillating!)
 */
const noRepeatNext = (arr) => {
  const shuffled = shuffle(arr);
  return arr[arr.length - 1] === shuffled[0]
    ? [...shuffled.slice(1), shuffled[0]]
    : shuffled;
};

const getNext = (arr, i) =>
  i === arr.length - 1
    ? [noRepeatNext(arr), 0]
    : [arr, i + 1];

function *generateRandomPairs(a, b) {
  let aIndex = a.length - 1;
  let bIndex = b.length - 1;

  while (true) {
    [a, aIndex] = getNext(a, aIndex);
    [b, bIndex] = getNext(b, bIndex);

    yield [
      a[aIndex],
      b[bIndex],
    ];
  }
}

const templates = [
  idea => `Just kidding: ${idea}`,
  idea => `No wait: ${idea}`,
  idea => `Actually: ${idea}`,
  idea => `What I really meant was: ${idea}`,
];
```

_And now..._

```js
// Vacillate [ vas-uh-leyt ]:

const vacillate = (...args) => {
  const ideas = unique(args);

  if (ideas.length <= 1) {
    throw new Error('must have more than 1 idea to vacillate');
  }

  const vacillations = Math.ceil(Math.random() * 10) + 5;
  const iterator = generateRandomPairs(ideas, templates);

  let iterations = 1;
  for (const [idea, template] of iterator) {
    switch (iterations) {
      case 1:
        console.log(idea)
        break;
      case vacillations:
        console.log(`${idea}! (vacillated ${vacillations} times)`);
        return idea;
      default:
        console.log(template(idea));
        break;
    }
    iterations++;
  }
};
```

> Don't speak JavaScript? Here is the [actual definition of {{page.title}}]({{page.definition_link}}).

## Thoughts
Wow, this one got more complicated than I thought it would! I definitely wanted a function that could vacillate a random number of times. I also wanted to be able to vacillate on a variable number of ideas.

I vacillated _(see what I did there)_ on whether to show the progress of the vacillation or just return the result. "Trust me. The computer vacillated... Here's the result!". In the end, I thought it might "teach" the vocabulary word better to show progress.

I wanted a function that would take in two arrays of arbitrary length (the `ideas` and the `templates`) and return a random pair from each. I also didn't want to repeat any one item from any consecutive pairs. That would just be some sloppy vacillating. I figured an infinite generator would do the trick, but getting it just right took a bit longer than expected.

Originally, I made the function asynchronous and had a sleep in between each vacillation so that it really felt like the computer was vacillating:

```js
const sleep = ms => new Promise(
  resolve => setTimeout(resolve, ms)
);
// and then in the function:
for (const [idea, template] of iterator) {
  await sleep(100);
  switch (iterations) {
  // ...
```

Then from a philosophical point of view, I started to think about the concept of writing a program to vacillate for me. We usually write programs to speed things up, so why arbitrarily slow this one down?

This function can vacillate at _most_ 15 times and at _fewest_ 6 times. I feel like I could have gotten silly and dramatically bumped up the total number of possible vacillations.
