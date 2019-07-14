# Heroku / Node Cluster / Socket.io Test

This is a proof of concept application to prove that Heroku cannot handle socket.io polling transports while using Node clusters.

The problem is that all the "sticky session" solutions have all of the workers using a random port on their server.listen(), and Heroku blocks all ports aside from `process.env.PORT`.

**The source code was originally built here**: https://github.com/ANURAGVASI/socket.io-multiserver-chatApp
**Accompanying blog article**: https://blog.imaginea.com/7597-2/

Summary of the issue:

1. For any heroku app that has at least 1 2x Dyno, two+ workers will be created (this can be simulated by creating two socket)
   1. Override the `WEB_CONCURRENCY` environment variable to `3` to allow workers on any dyno size
2. Because socket.io uses many http requests for a handshake or long polling transport, the same worker must handle all requests
   1. Note: this library has set the transport to `['polling']` to force the simulation of browsers or networks without websocket support

You can run this locally to confirm it is working

```shell
npm run build
npm start
```

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)
