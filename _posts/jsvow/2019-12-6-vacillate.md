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
const sleep = ms => new Promise(
  resolve => setTimeout(resolve, ms)
);

const unique = arr => [...new Set(arr)];

const shuffle = arr => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i)
    const temp = copy[i]
    copy[i] = copy[j]
    copy[j] = temp
  }
  return copy;
}

// Return shuffled array making sure no values are repeated
// (important for vacillating!)
const noRepeatNext = (arr) => {
  const shuffled = shuffle(arr);
  return arr[arr.length - 1] === shuffled[0]
    ? shuffled.reverse()
    : shuffled;
};

const getNext = (arr, i) =>
  i === arr.length - 1
    ? [noRepeatNext(arr), 0]
    : [arr, i + 1];


function *genRandomPairs(a, b) {
  let aIndex = 0;
  let bIndex = 0;
  while (true) {
    yield [
      a[aIndex],
      b[bIndex],
    ];

    [a, aIndex] = getNext(a, aIndex);
    [b, bIndex] = getNext(b, bIndex);
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

const vacillate = async (...ideas) => {
  ideas = unique(ideas);

  if (ideas.length <= 1) {
    throw new Error('must have more than 1 idea to vacillate');
  }

  const iterator = genRandomPairs(
    shuffle(ideas),
    shuffle(templates),
  );

  const [initialIdea] = iterator.next().value;

  await sleep(100);

  console.log(initialIdea);

  for (let i=0; i<10; i++) {
    await sleep(100);
    const [idea, template] = iterator.next().value;
    console.log(template(idea));
  }

  const [decision] = iterator.next().value;

  return decision;
};
```

> Don't speak JavaScript? Here is the [actual definition of {{page.title}}]({{page.definition_link}}).
