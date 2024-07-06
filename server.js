import "dotenv/config.js";

import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import session from 'express-session';
import passport from 'passport';
import pluralize from 'pluralize';
import RedisStore from "connect-redis"
import redis from 'redis';

import logger from "morgan";
import indexRouter from "./routes/index.js";
import authRouter from "./routes/auth.js";
import "./db.js";

// Constants
const port = process.env.PORT || 3000;

// Create http server
const app = express();

// view engine setup
app.set("views", path.join("views"));
app.set("view engine", "pug");

app.locals.pluralize = pluralize;

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join("public")));


(async () => {

  // const redisStore=connectRedis(session);
  // Create Redis client
  const client = redis.createClient();

  client.on("error", (error) => console.error(`Redis Client Error: ${error}`));

  await client.connect();
  console.log('Redis client connected successfully.');


  // Use the session middleware
  app.use(session({
    store: new RedisStore({ client: client }),
    secret: 'keyboard cat',
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Set to true if using HTTPS
      maxAge: 1000 * 60 * 60 * 24 // Session expires after 1 day
    }
  }));

  app.use(passport.authenticate('session'));


  app.use("/", indexRouter);
  app.use("/", authRouter)

  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    next(createError(404));
  });

  // error handler
  app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
  });

  // Start http server
  app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
  })
})();
