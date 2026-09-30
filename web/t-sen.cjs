const S = require("@sentry/node");
S.init({ dsn: "http://khoa@127.0.0.1:9999/1", tracesSampleRate: 0, release: "t", debug: true });
S.captureException(new Error("server-thu6"));
S.close(5000).then((r) => console.log("close", r));
