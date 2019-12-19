(function () {

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

const vacillate = (...args) => {
  const ideas = unique(args);
  const TIMES = Math.ceil(Math.random() * 10) + 5;

  if (ideas.length <= 1) {
    throw new Error('must have more than 1 idea to vacillate');
  }

  const iterator = generateRandomPairs(ideas, templates);

  let iterations = 1;
  for (const [idea, template] of iterator) {
    switch (iterations) {
      case 1:
        console.log(idea)
        break;
      case TIMES:
        console.log(`${idea}! (vacillated ${TIMES} times)`);
        return idea;
      default:
        console.log(template(idea));
        break;
    }
    iterations++;
  }
};

window.JSVOW = {
  words: {
    vacillate,
  },
  utils: {
    unique,
    shuffle,
    noRepeatNext,
    generateRandomPairs,
  }
}

})();
