const Koa = require("koa");
const http = require("http");
const should = require("should");
const expect = require("expect.js");
const request = require("supertest");
const HappyRouter = require("../../dist/lib").default;

describe("Constructor", () => {
  it("1. Create new HappyRouter", (done) => {
    const router = new HappyRouter();
    router.should.be.instanceOf(HappyRouter);
    done();
  });
  it("2. Add prefix in constructor", (done) => {
    const app = new Koa();
    const router = new HappyRouter({
      prefix: "/api",
    });
    router.addRoutes([
      {
        url: "/",
        method: "GET",
        handler: (ctx) => {
          ctx.body = { text: "Hello World" };
        },
      },
    ]);
    app.use(router.routes()).use(router.allowedMethods());

    request(http.createServer(app.callback()))
      .get("/api")
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.eql({ text: "Hello World" });
        done();
      });
  });
  it("3. Add errorHandler in constructor", (done) => {
    const app = new Koa();
    const router = new HappyRouter({
      errorHandler: (error, ctx) => {
        ctx.body = { status: -1, message: error.message };
      },
    });
    router.addRoutes([
      {
        url: "/",
        method: "GET",
        handler: (ctx) => {
          ctx.body = JSON.parse("");
        },
      },
    ]);
    app.use(router.routes()).use(router.allowedMethods());

    request(http.createServer(app.callback()))
      .get("/")
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.eql({
          status: -1,
          message: "Unexpected end of JSON input",
        });
        done();
      });
  });
  it("4. Multiple constructor", (done) => {
    const app = new Koa();
    const oneRouter = new HappyRouter({
      prefix: "/one",
    });
    const twoRouter = new HappyRouter({
      prefix: "/two",
    });
    oneRouter.addRoutes([
      {
        url: "/",
        method: "GET",
        handler: (ctx) => (ctx.body = "This is one page"),
      },
    ]);
    twoRouter.addRoutes([
      {
        url: "/",
        method: "GET",
        handler: (ctx) => (ctx.body = "This is two page"),
      },
    ]);
    app.use(oneRouter.routes()).use(twoRouter.routes());

    request(http.createServer(app.callback()))
      .get("/one")
      .expect(200)
      .end((error, response) => {
        if (error) return done(error);
        expect(response.text).to.be("This is one page");

        request(http.createServer(app.callback()))
          .get("/two")
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.text).to.be("This is two page");
            done();
          });
      });
  });
  it("5. Merge multiple constructor", (done) => {
    const app = new Koa();
    const router = new HappyRouter();
    const oneRouter = new HappyRouter({
      prefix: "/one",
    });
    const twoRouter = new HappyRouter({
      prefix: "/two",
    });
    oneRouter.addRoutes([
      {
        url: "/",
        method: "GET",
        handler: (ctx) => (ctx.body = "This is one page"),
      },
    ]);
    twoRouter.addRoutes([
      {
        url: "/",
        method: "GET",
        handler: (ctx) => (ctx.body = "This is two page"),
      },
    ]);
    router.use(oneRouter.routes()).use(twoRouter.routes());
    app.use(router.routes());

    request(http.createServer(app.callback()))
      .get("/one")
      .expect(200)
      .end((error, response) => {
        if (error) return done(error);
        expect(response.text).to.be("This is one page");

        request(http.createServer(app.callback()))
          .get("/two")
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.text).to.be("This is two page");
            done();
          });
      });
  });
});

describe("Request", () => {
  it("1. Return text", (done) => {
    const app = new Koa();
    const router = new HappyRouter();
    router.addRoutes([
      {
        url: "/",
        method: "GET",
        handler: (ctx) => {
          ctx.body = "Hello World";
        },
      },
    ]);
    app.use(router.routes()).use(router.allowedMethods());

    request(http.createServer(app.callback()))
      .get("/")
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.text).to.be("Hello World");
        done();
      });
  });
  it("2. Return HTML", (done) => {
    const app = new Koa();
    const router = new HappyRouter();
    const content = [
      "<!DOCTYPE html>",
      "<head>",
      '  <meta charset="utf-8" />',
      '  <meta content="IE=edge" http-equiv="X-UA-Compatible" />',
      `  <title>Hello, World!</title>`,
      "</head>",
      "<html>",
      "  <body>",
      `    <h1>Hello, World!</h1>`,
      "  </body>",
      "</html>",
    ].join("\t");
    router.addRoutes([
      {
        url: "/",
        method: "GET",
        handler: (ctx) => {
          ctx.body = content;
        },
      },
    ]);
    app.use(router.routes()).use(router.allowedMethods());

    request(http.createServer(app.callback()))
      .get("/")
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.text).to.be(content);
        done();
      });
  });
  it("3. Return json", (done) => {
    const app = new Koa();
    const router = new HappyRouter();
    router.addRoutes([
      {
        url: "/",
        method: "GET",
        handler: (ctx) => {
          ctx.body = { text: "Hello World" };
        },
      },
    ]);
    app.use(router.routes()).use(router.allowedMethods());

    request(http.createServer(app.callback()))
      .get("/")
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.eql({ text: "Hello World" });
        done();
      });
  });
  it("4. Return 404 code", (done) => {
    const app = new Koa();
    const router = new HappyRouter();
    router.addRoutes([
      {
        url: "/",
        method: "GET",
        handler: (ctx) => {
          ctx.code = 404;
        },
      },
    ]);
    app.use(router.routes()).use(router.allowedMethods());

    request(http.createServer(app.callback()))
      .get("/")
      .expect(200)
      .end((err, res) => {
        if (err) {
          expect(res.statusCode).to.be(404);
          done();
        }
      });
  });
  it("5. Mutiple requests", (done) => {
    const app = new Koa();
    const router = new HappyRouter();
    router.addRoutes([
      {
        url: "/",
        method: "GET",
        handler: (ctx) => {
          ctx.body = "Hello World";
        },
      },
      {
        url: "/:name",
        method: "GET",
        handler: (ctx) => {
          ctx.body = `Hello ${ctx.params.name}`;
        },
      },
    ]);
    app.use(router.routes()).use(router.allowedMethods());

    request(http.createServer(app.callback()))
      .get("/")
      .expect(200)
      .end((error, response) => {
        if (error) return done(error);
        expect(response.text).to.be("Hello World");

        request(http.createServer(app.callback()))
          .get("/Feihui")
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.text).to.be("Hello Feihui");
            done();
          });
      });
  });
});

describe("Middlewares", () => {
  it("1. Global Middleware", (done) => {
    const app = new Koa();
    const router = new HappyRouter();
    const middlewareSort = [];
    router.registerMiddlewares({
      testMiddlewares: (text) => async (_ctx, next) => {
        middlewareSort.push(text);
        await next();
      },
    });
    router.addRoutes([
      {
        url: "/",
        method: "GET",
        testMiddlewares: "testMiddlewares",
        handler: (ctx) => {
          middlewareSort.push("Hello World");
          ctx.body = middlewareSort.join(",");
        },
      },
    ]);
    app.use(router.routes()).use(router.allowedMethods());

    request(http.createServer(app.callback()))
      .get("/")
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.text).to.be("testMiddlewares,Hello World");
        done();
      });
  });
  it("2. Multiple global middlewares", (done) => {
    const app = new Koa();
    const router = new HappyRouter();
    const middlewareSort = [];
    router.registerMiddlewares({
      firstMiddlewares: (text) => async (_ctx, next) => {
        middlewareSort.push(text);
        await next();
      },
      secondMiddlewares: (text) => async (_ctx, next) => {
        middlewareSort.push(text);
        await next();
      },
      thirdMiddlewares: (text) => async (_ctx, next) => {
        middlewareSort.push(text);
        await next();
      },
    });
    router.addRoutes([
      {
        url: "/",
        method: "GET",
        firstMiddlewares: "firstMiddlewares",
        secondMiddlewares: "secondMiddlewares",
        thirdMiddlewares: "thirdMiddlewares",
        handler: (ctx) => {
          middlewareSort.push("Hello World");
          ctx.body = middlewareSort.join(",");
        },
      },
    ]);
    app.use(router.routes()).use(router.allowedMethods());

    request(http.createServer(app.callback()))
      .get("/")
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.text).to.be(
          "firstMiddlewares,secondMiddlewares,thirdMiddlewares,Hello World"
        );
        done();
      });
  });
  it("3. Order of global middlewares", (done) => {
    const app = new Koa();
    const router = new HappyRouter();
    const middlewareSort = [];
    router.registerMiddlewares({
      firstMiddlewares: (text) => async (_ctx, next) => {
        middlewareSort.push(text);
        await next();
      },
      secondMiddlewares: (text) => async (_ctx, next) => {
        middlewareSort.push(text);
        await next();
      },
      thirdMiddlewares: (text) => async (_ctx, next) => {
        middlewareSort.push(text);
        await next();
      },
    });
    router.sortMiddlewares([
      "thirdMiddlewares",
      "firstMiddlewares",
      "secondMiddlewares",
    ]);
    router.addRoutes([
      {
        url: "/",
        method: "GET",
        firstMiddlewares: "firstMiddlewares",
        secondMiddlewares: "secondMiddlewares",
        thirdMiddlewares: "thirdMiddlewares",
        handler: (ctx) => {
          middlewareSort.push("Hello World");
          ctx.body = middlewareSort.join(",");
        },
      },
    ]);
    app.use(router.routes()).use(router.allowedMethods());

    request(http.createServer(app.callback()))
      .get("/")
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.text).to.be(
          "thirdMiddlewares,firstMiddlewares,secondMiddlewares,Hello World"
        );
        done();
      });
  });
  it("4. Route middlewares", (done) => {
    const app = new Koa();
    const router = new HappyRouter();
    const middlewareSort = [];
    router.addRoutes([
      {
        url: "/",
        method: "GET",
        middlewares: [
          async (_ctx, next) => {
            middlewareSort.push("firstMiddlewaresInRoute");
            await next();
          },
          async (_ctx, next) => {
            middlewareSort.push("secondMiddlewaresInRoute");
            await next();
          },
        ],
        handler: (ctx) => {
          middlewareSort.push("Hello World");
          ctx.body = middlewareSort.join(",");
        },
      },
    ]);
    app.use(router.routes()).use(router.allowedMethods());

    request(http.createServer(app.callback()))
      .get("/")
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.text).to.be(
          "firstMiddlewaresInRoute,secondMiddlewaresInRoute,Hello World"
        );
        done();
      });
  });
  it("5. Order of middlewares in global and route", (done) => {
    const app = new Koa();
    const router = new HappyRouter();
    const middlewareSort = [];
    router.registerMiddlewares({
      firstMiddlewares: (text) => async (_ctx, next) => {
        middlewareSort.push(text);
        await next();
      },
      secondMiddlewares: (text) => async (_ctx, next) => {
        middlewareSort.push(text);
        await next();
      },
      thirdMiddlewares: (text) => async (_ctx, next) => {
        middlewareSort.push(text);
        await next();
      },
    });
    router.sortMiddlewares([
      "thirdMiddlewares",
      "firstMiddlewares",
      "secondMiddlewares",
    ]);
    router.addRoutes([
      {
        url: "/",
        method: "GET",
        firstMiddlewares: "firstMiddlewares",
        secondMiddlewares: "secondMiddlewares",
        thirdMiddlewares: "thirdMiddlewares",
        middlewares: [
          async (_ctx, next) => {
            middlewareSort.push("firstMiddlewaresInRoute");
            await next();
          },
          async (_ctx, next) => {
            middlewareSort.push("secondMiddlewaresInRoute");
            await next();
          },
        ],
        handler: (ctx) => {
          middlewareSort.push("Hello World");
          ctx.body = middlewareSort.join(",");
        },
      },
    ]);
    app.use(router.routes()).use(router.allowedMethods());

    request(http.createServer(app.callback()))
      .get("/")
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.text).to.be(
          "thirdMiddlewares,firstMiddlewares,secondMiddlewares,firstMiddlewaresInRoute,secondMiddlewaresInRoute,Hello World"
        );
        done();
      });
  });
  it("6. Only load used middlewares", (done) => {
    const app = new Koa();
    const router = new HappyRouter();
    const middlewareSort = [];
    router.registerMiddlewares({
      firstMiddlewares: (text) => async (_ctx, next) => {
        middlewareSort.push(text);
        await next();
      },
      secondMiddlewares: (text) => async (_ctx, next) => {
        middlewareSort.push(text);
        await next();
      },
      thirdMiddlewares: (text) => async (_ctx, next) => {
        middlewareSort.push(text);
        await next();
      },
    });
    router.addRoutes([
      {
        url: "/",
        method: "GET",
        firstMiddlewares: "firstMiddlewares",
        thirdMiddlewares: "thirdMiddlewares",
        handler: (ctx) => {
          middlewareSort.push("Hello World");
          ctx.body = middlewareSort.join(",");
        },
      },
    ]);
    app.use(router.routes()).use(router.allowedMethods());

    request(http.createServer(app.callback()))
      .get("/")
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.text).to.be("firstMiddlewares,thirdMiddlewares,Hello World");
        done();
      });
  });
  it("7. Register middleware by use", (done) => {
    const app = new Koa();
    const router = new HappyRouter();
    router.use(async (ctx, next) => {
      ctx.body = ctx.body || { text: "Hello World from use" };
      await next();
    });
    router.addRoutes([
      {
        url: "/helloworld",
        method: "GET",
        handler: (ctx) => {
          ctx.body = { text: "Hello World" };
        },
      },
      {
        url: "/use",
        method: "GET",
      },
    ]);
    app.use(router.routes());
    request(http.createServer(app.callback()))
      .get("/helloworld")
      .expect(200)
      .end((error, response) => {
        if (error) return done(error);
        expect(response.body).to.eql({ text: "Hello World" });

        request(http.createServer(app.callback()))
          .get("/use")
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.body).to.eql({ text: "Hello World from use" });
            done();
          });
      });
  });
  it("8. Order of middlewares between use and registerMiddlewares", (done) => {
    const app = new Koa();
    const router = new HappyRouter();
    const middlewareSort = [];
    router.use(async (_ctx, next) => {
      middlewareSort.push("beforeOneMiddlewares");
      await next();
    });
    router.registerMiddlewares({
      firstMiddlewares: (text) => async (_ctx, next) => {
        middlewareSort.push(text);
        await next();
      },
      secondMiddlewares: (text) => async (_ctx, next) => {
        middlewareSort.push(text);
        await next();
      },
      thirdMiddlewares: (text) => async (_ctx, next) => {
        middlewareSort.push(text);
        await next();
      },
    });
    router.sortMiddlewares([
      "thirdMiddlewares",
      "firstMiddlewares",
      "secondMiddlewares",
    ]);
    router.use(async (_ctx, next) => {
      middlewareSort.push("beforeTwoMiddlewares");
      await next();
    });
    router.addRoutes([
      {
        url: "/",
        method: "GET",
        firstMiddlewares: "firstMiddlewares",
        secondMiddlewares: "secondMiddlewares",
        thirdMiddlewares: "thirdMiddlewares",
        middlewares: [
          async (_ctx, next) => {
            middlewareSort.push("firstMiddlewaresInRoute");
            await next();
          },
          async (_ctx, next) => {
            middlewareSort.push("secondMiddlewaresInRoute");
            await next();
          },
        ],
        handler: (ctx) => {
          middlewareSort.push("Hello World");
          ctx.body = middlewareSort.join(",");
        },
      },
    ]);
    router.use(async (_ctx, next) => {
      middlewareSort.push("noExecute");
      await next();
    });
    app.use(router.routes()).use(router.allowedMethods());

    request(http.createServer(app.callback()))
      .get("/")
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.text).to.be(
          "beforeOneMiddlewares,beforeTwoMiddlewares,thirdMiddlewares,firstMiddlewares,secondMiddlewares,firstMiddlewaresInRoute,secondMiddlewaresInRoute,Hello World"
        );
        done();
      });
  });
});
