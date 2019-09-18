## Conway's Game of Life
### using Rust 🦀 and WebAssembly 🕸

[![Build Status](https://travis-ci.org/svenfoo/wasm-game-of-life.svg?branch=master)](https://travis-ci.org/svenfoo/wasm-game-of-life)

This is based on [this nice tutorial][tutorial] on how to use Rust and WebAssembly together.

[tutorial]: https://rustwasm.github.io/docs/book/introduction.html


### 🛠️ Build with `wasm-pack build`

```
wasm-pack build
```

### 🔬 Test in Headless Browsers with `wasm-pack test`

```
wasm-pack test --headless --firefox
```

### 🏃 Run with `npm run start` in the www folder

```
npm run start
```

### Deploy to heroku

```
heroku container:login
heroku container:push web
heroku container:release web
heroku open
```

Optional, after `login`:
- verify Docker with: `docker ps`
- create new Heroku project if needed: `heroku create`