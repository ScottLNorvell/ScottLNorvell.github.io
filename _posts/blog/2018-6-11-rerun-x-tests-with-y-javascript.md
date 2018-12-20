---
layout: post
title: Rerun X tests with Y (where Y is JavaScript!)
group_with: blog
---

As JavaScript developers (talk about how it's great to change code and have it refresh in the browser) If you're not developing like that as a JavaScript developer, you should... it's great!

Recently my team decided to revive some antiquated .Net (SP?) services to [GOlang](#LINK).

I started going through the go with tests book (talk about nervous tick about)

But seriously... I change some code... I mouse or alt-tab over to the terminal... I type in `go test` or just hit the up arrow if I'm lucky... What if it just restarted on its own?

Let's get started. Here's an example of what we're working on from the Go with TESTS book.

```go
// hello.go
package main

import "fmt"

func Hello() string {
  return "Hello, world"
}

func main() {
  fmt.Println(Hello())
}

// hello_test.go
package main

import "testing"

func TestHello(t *testing.T) {
  got := Hello()
  want := "Hello, world"

  if got != want {
    t.Errorf("got '%s' want '%s'", got, want)
  }
}
```

The really great thing about `nodemon` is that it doesn't care what it's watching and it doesn't care what it runs after something changes.

Let's install [`nodemon`](#LINK)

```bash
yarn global add nodemon
```

OR

```bash
npm install -g nodemon
```
