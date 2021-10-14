import Application from "koa";
import { RouterContext } from "koa-router";

const DEBUG_COLOR = "\x1B[0m";
const ERROR_COLOR = "\x1B[31m";

/** Output logs to console */
const log = (content = "", isError = false): void => {
  const textColor = isError ? ERROR_COLOR : DEBUG_COLOR;
  const prefixText = [textColor, isError ? "ERROR" : "DEBUG", textColor];
  console.log(prefixText.join(""), content);
};

/** Add 0 in front of numbers less than 10, like 9 -> 09 */
const addZeroBeforeNumber = (num: number, count = 2): string => {
  const repeatZero = "0".repeat(count);
  return `${repeatZero}${num}`.slice(-1 * count);
};

/** Format timestamp to standard time */
const formatTimestamp = (timestamp: number): string => {
  const dateInstance = new Date(timestamp);
  const year = dateInstance.getFullYear();
  const month = addZeroBeforeNumber(dateInstance.getMonth() + 1);
  const date = addZeroBeforeNumber(dateInstance.getDate());
  const hours = addZeroBeforeNumber(dateInstance.getHours());
  const minutes = addZeroBeforeNumber(dateInstance.getMinutes());
  const seconds = addZeroBeforeNumber(dateInstance.getSeconds());
  const milliseconds = addZeroBeforeNumber(dateInstance.getMilliseconds(), 3);

  return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}::${milliseconds}`;
};

/**
 * Middlewares of logger
 */
const requestLogger = (ctx: RouterContext, next: Application.Next) => {
  let startTime = 0;
  let errorInstance: Error;

  /** Get guest's IP address */
  const getIPAddress = (): string => {
    return ctx.request.ip || "";
  };

  /** Get params in request's body */
  const getRequestBodyParams = (): Promise<string> => {
    const { req: request } = ctx;
    return new Promise((resolve) => {
      let data = "";
      request.on("data", (chunk) => (data += chunk));
      // Remove all line breaks and spaces in string
      request.on("end", () => resolve(data.replace(/(\r\n|\n|\r|\s)/gm, "")));
      // Return empty string by default
      request.on("error", () => resolve(""));
    });
  };

  /**
   * Log at start time of request
   *
   * @example
   * ```shell
   * DEBUG [::ffff:127.0.0.1] [2020-01-01 00:00:00::001] --> GET /api/demo?key=value - UserAgent
   * ```
   */
  const onStarted = async () => {
    startTime = Date.now();

    const IPAddress = getIPAddress();
    const requestBodyParams = await getRequestBodyParams();

    log(
      [
        `[${IPAddress}] [${formatTimestamp(
          startTime
        )}] --> ${ctx.method.toUpperCase()}`,
        ctx.url,
        requestBodyParams,
        ctx.header["user-agent"],
      ]
        .filter((item) => !!item)
        .join(" - ")
    );
  };

  /**
   * Log at finish time of request
   *
   * @example
   * ```shell
   * DEBUG [::ffff:127.0.0.1] [2020-01-01 00:00:00::001] <-- GET /api/demo?key=value - 20ms
   * ```
   */
  const onFinished = () => {
    const endTime = Date.now();
    const IPAddress = getIPAddress();

    log(
      [
        `[${IPAddress}] [${formatTimestamp(
          endTime
        )}] <-- ${ctx.method.toUpperCase()}`,
        ctx.url,
        ctx.status,
        `${endTime - (startTime || 0)}ms`,
      ].join(" - "),
      !!errorInstance
    );
  };

  onStarted();

  return next()
    .catch((error) => {
      // Record error
      errorInstance = error;
    })
    .then(() => {
      onFinished();
      // Rethrow error
      if (errorInstance) {
        throw errorInstance;
      }
    });
};

export default requestLogger;
