import Application from "koa";
import KoaRouter from "koa-router";
import {
  INITIAL_METHOD,
  INITIAL_ROUTE_FIELDS,
  REQUEST_METHODS,
} from "./constants";

/** Router instance */
export interface RouterOptions {
  prefix?: string;
  env?: "development" | "production";
  strict?: boolean;
  methods?: Array<keyof typeof REQUEST_METHODS>;
  errorHandler?: (
    error: Error,
    ctx: KoaRouter.RouterContext,
    next?: Application.Next
  ) => void;
}

/** Middlewares in route */
export type RouteMiddlewares = Array<
  (ctx: KoaRouter.RouterContext, next: Application.Next) => Promise<void>
>;

/** Handler method in route */
export type RouteHandler = (
  ctx: KoaRouter.RouterContext,
  next?: Application.Next
) => void | Promise<void>;

/** Route properties */
export type Route<T = void> = {
  url: string;
  handler?: RouteHandler;
  middlewares: RouteMiddlewares;
  method?: keyof typeof REQUEST_METHODS;
} & T;

/** Return middlewares by currying */
export type Middlewares = (
  options: any
) => (ctx: KoaRouter.RouterContext, next: Application.Next) => Promise<void>;

// TODO:
// 1. 测试环境可以自动生成接口文档，可自定义接口文档的地址/页面
/**
 * `koa-happy-router` provides easy-to-use routing configuraion, smart and powerful middleware mechanism.
 * Make the code easy to read and maintain.
 * @property
 * - `addRoutes` - Add routes to router
 * - `sortMiddlewares` - Declare the execution order of middlewares
 * - `registerMiddlewares` - Register middlewares with router
 * - `use` - Use given middleware
 * - `routes` - Returns routes matching the request
 * - `allowedMethods` - Returns separate middleware for response
 * @example
 * ```javascript
 * const Koa = require('koa');
 * const HappyRouter = require('koa-happy-router');
 * const app = new Koa();
 * const router = new HappyRouter();
 *
 * // middlewares
 * router.sortMiddlewares(['auth', 'demo']);
 * router.registerMiddlewares({
 *   demo: (demoOptions = {}) => async (ctx, next) => {
 *     console.log('demo', demoOptions);
 *     await next();
 *   },
 *   auth: (authOptions = false) => async (ctx, next) => {
 *     console.log('auth', authOptions);
 *     await next();
 *   }
 * });
 *
 * // router
 * router.addRoutes([
 *  {
 *    url: '/',
 *    mehtod: 'GET',
 *    auth: true,
 *    demo: {
 *      text: 'auth will excute before than demo'
 *    },
 *    handler: (ctx) => ctx.body = `Hello World`
 *  }
 * ]);
 * app.use(router.routes()).use(router.allowedMethods());
 *
 * app.listen(8080);
 * ```
 */
class HappyRouter {
  private errorHandler?: RouterOptions["errorHandler"];
  private routerInstance?: KoaRouter;
  private middlewaresKeys: Set<string> = new Set();
  private middlewaresStack: Map<string, Middlewares> = new Map();

  /**
   * @property
   * - `env` Runtime envrionment.
   * - `prefix` Prefix for all routes.
   * - `strict` Whether or not routes should matched strictly. If `strict` matching is enabled, the trailing slash is taken into account when matching routes.
   * - `methods` Methods which should be supported by the router.
   * - `errorHandler` Error collection mechanism to collect error in `handler` method.
   * @example
   * ```javascript
   * const Koa = require('koa');
   * const HappyRouter = require('koa-happy-router');
   * const app = new Koa();
   * const router = new HappyRouter({
   *   prefix: 'api',
   *   env: 'development',
   *   strict: true,
   *   methods: ['GET', 'POST', 'OPTIONS'],
   *   errorHandler: (error, ctx) => {
   *     ctx.body = { status: -1, message: error.message, url: ctx.url }
   *   }
   * });
   * ```
   */
  constructor(options?: RouterOptions) {
    if (typeof options?.errorHandler === "function") {
      this.errorHandler = options.errorHandler;
    }
    this.routerInstance = new KoaRouter({
      prefix: options?.prefix,
      strict: options?.strict,
      methods: options?.methods,
    });
  }

  /**
   * Add optional error collection mechanism to collect error in `handler` method.
   */
  private async createHandler(
    handler: RouteHandler,
    context: KoaRouter.RouterContext,
    next: Application.Next
  ): Promise<void> {
    if (this.errorHandler) {
      try {
        await handler(context, next);
      } catch (error) {
        this.errorHandler(error, context);
      }
    } else {
      await handler(context, next);
    }
  }
  /**
   * Add routes to router, you could handle the logic in middlewares
   * if middlewares registered by `registerMiddlewares` method.
   *
   * @example
   * ```javascript
   * router.addRoutes([
   *   // Basic Example
   *   {
   *     url: '/',
   *     method: 'GET',
   *     handler: ctx => ctx.body = `Hello, World!`
   *   },
   *   // Middlewares Example
   *   {
   *     url: '/user',
   *     method: 'POST',
   *     permit: true, // Middlewares in global register by registerMiddlewares
   *     middlewares: [
   *       // Middlewares in route
   *       async (ctx, next) => {
   *         console.log('Route middlewares');
   *         await next();
   *       }
   *     ],
   *     handler: ctx => ctx.body = `Hello, ${ctx.session.name}!`
   *   }
   * ]);
   * ```
   */
  public addRoutes<T>(routesList: Route<T>[]): void {
    const routerInstance = this.routerInstance as KoaRouter;
    routesList.forEach((route) => {
      const routeMethod = REQUEST_METHODS[route.method || INITIAL_METHOD];
      const routeInstance = routerInstance[routeMethod].bind(routerInstance);

      // Filter middlewares which unregister in global and unused in route
      const routeMiddlewaresKeys = Object.keys(route).filter(
        (key) =>
          !INITIAL_ROUTE_FIELDS.includes(key) && this.middlewaresStack.has(key)
      );
      // The order of declaration in sortMiddlewares prefer than keys from Object.keys when isn't declared.
      const middlewaresKeys =
        this.middlewaresKeys.size > 0
          ? [...this.middlewaresKeys].filter((key) =>
              routeMiddlewaresKeys.includes(key)
            )
          : routeMiddlewaresKeys;

      // Global middleware takes precedence over local middleware
      const routeMiddlewares = [
        ...middlewaresKeys.map((key) => {
          const middlewareInstance = this.middlewaresStack.get(
            key
          ) as Middlewares;
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return middlewareInstance(route[key]);
        }),
        ...(route.middlewares || []),
      ];

      routeInstance(
        route.url,
        ...(routeMiddlewares as KoaRouter.IMiddleware[]),
        (ctx, next) =>
          route.handler && this.createHandler(route.handler, ctx, next)
      );
    });
  }
  /**
   * Declare the execution order of middlewares and execute in this order.
   * Used earlier than the `addRoutes` method.
   *
   * @example
   * ```javascript
   * router.sortMiddlewares(['permit', 'validate']);
   * ```
   */
  public sortMiddlewares(keys: string[] = []): void {
    keys.forEach((key) => {
      this.middlewaresKeys.add(key);
    });
  }
  /**
   * Register middlewares with router, and its will load only used middlewares in routes.
   * Used earlier than the `addRoutes` method.
   *
   * @example
   * ```javascript
   * router.registerMiddlewares({
   *   permit: (options = false) => async (ctx, next) => {
   *     if(options && !!ctx.session.status) {
   *       return ctx.body = 'please login';
   *     }
   *     await next();
   *   }
   * });
   * ```
   */
  public registerMiddlewares(middlewares: Record<string, Middlewares>): void {
    Object.keys(middlewares).forEach((key) => {
      this.middlewaresStack.set(key, middlewares[key]);
    });
  }
  /**
   *
   * Use constuctor or middlewares.
   *
   * Middlewares will execute in the order of defined by `.use()` and its run before `registerMiddlewares`.
   * Used earlier than the `addRoutes` method.
   *
   * @example
   * ```javascript
   * router.use(async(ctx, next) => {
   *   console.log('use before registerMiddlewares');
   *   await next();
   * });
   * ```
   */
  public use(...middleware: RouteMiddlewares) {
    const routerInstance = this.routerInstance as KoaRouter;
    return routerInstance.use(...middleware);
  }
  /**
   * Returns router middleware which dispatches a route matching the request.
   */
  public routes(): KoaRouter.IMiddleware {
    const routerInstance = this.routerInstance as KoaRouter;
    return routerInstance.routes();
  }
  /**
   * Returns separate middleware for responding to `OPTIONS` requests with an `Allow` header containing the allowed methods,
   * as well as responding with `405 Method Not Allowed` and `501 Not Implemented` as appropriate.
   */
  public allowedMethods(
    options?: KoaRouter.IRouterAllowedMethodsOptions
  ): KoaRouter.IMiddleware {
    const routerInstance = this.routerInstance as KoaRouter;
    return routerInstance.allowedMethods(options);
  }
}

export default HappyRouter;
