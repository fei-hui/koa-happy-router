# koa-happy-router

`koa-happy-router` provides easy-to-use routing configuraion likes `hapi`, powerful and freedom middleware mechanism.

## 🆕 Features

- Easy-to-use routing configuraion
- Powerful and freedom middleware mechanism
- Stronge error handler

## 📦 Install

If you use npm

```bash
npm install koa-happy-router
```

or yarn

```bash
yarn add koa-happy-router
```

## 🎮 Usage

### Basic Usage

```javascript
import Koa from "koa";
import HappyRouter from "koa-happy-router";

const app = new Koa();
const router = new HappyRouter();

router.addRoutes([
  {
    url: "/",
    handler: (ctx) => (ctx.body = "Hello World!"),
  },
]);

app.use(router.routes()).use(router.allowMethods());
app.listen(8080);
```

### Middlewares Usage

You can register the global middleware by `registerMiddlewares`, which can be used in routing after registration, and it focus some common logic. Use `sortMiddlewares` to arrange the execution order of middleware, likes onion ring model of `koa`.

```javascript
const Koa = require("koa");
// If you use `require`
const { default: HappyRouter } = require("koa-happy-router");
const { default: AsyncValidator } = require("async-validator");

const app = new Koa();
const router = new HappyRouter();

router.registerMiddlewares({
  validate: (config) => async (ctx, next) => {
    const source = { ...ctx.query };
    const schema = new AsyncValidator({ ...config });
    try {
      await schema.validate(source, { first: true });
      await next();
    } catch (error) {
      const { errors = [] } = error;
      ctx.body = { status: -2, ...errors[0] };
    }
  },
  needLogin: (needLogin) => async (ctx, next) => {
    if (needLogin && ctx.state.hasLogin) {
      await next();
    }
    ctx.body = { status: -1, message: "please login" };
  },
});
router.sortMiddlewares(["needLogin", "validate"]);

router.addRoutes([
  {
    url: "/",
    handler: (ctx) => (ctx.body = "Hello World!"),
  },
  {
    url: "/user",
    needLogin: true,
    validate: {
      id: {
        required: true,
      },
    },
    middlewares: [
      async (ctx, next) => {
        console.log("Find user data by id after needLogin and validate");
        await next();
      },
    ],
    handler: (ctx) => (ctx.body = "Hello World!"),
  },
]);

app.use(router.routes()).use(router.allowMethods());
app.listen(8080);
```

### Typescript

`koa-happy-router` is written in Typescript, so you could use it in Typescript.

```typescript
import Koa from "koa";
import HappyRouter from "koa-happy-router";

const app = new Koa();
const router = new HappyRouter();

interface addRoutesProps {
  needLogin: boolean;
}

router.registerMiddlewares({
  needLogin: (needLogin: boolean) => async (ctx, next) => {
    if (needLogin && ctx.state.hasLogin) {
      await next();
    }
    ctx.body = { status: -1, message: "please login" };
  },
});
router.addRoutes<addRoutesProps>([
  {
    url: "/",
    needLogin: true,
    handler: (ctx) => (ctx.body = "Hello World!"),
  },
]);

app.use(router.routes()).use(router.allowMethods());
app.listen(8080);
```
