import 'babel-polyfill';
import mongoose from 'mongoose';
import restify from 'restify';
import jwt from 'restify-jwt';
import cookieParser from 'restify-cookies';
import dotenv from 'dotenv';
import fs from 'fs';
import { resolve } from 'path';
import validator from 'restify-joi-middleware';
import validatePost from './validators/event/post';
import validatePut from './validators/event/put';
import validatePatch from './validators/event/patch';

import Event from './models/Event';

const ENV_PATH = resolve(__dirname, '../../.env');
const CONFIG_DIR = '../config/';
const CONFIG_PATH = resolve(
  __dirname,
  `${CONFIG_DIR}application.${process.env.NODE_ENV || 'local'}.json`,
);
if (!fs.existsSync(ENV_PATH)) throw new Error('Envirnment files not found');
dotenv.config({ path: ENV_PATH });

if (!fs.existsSync(CONFIG_PATH)) throw new Error(`Config not found: ${CONFIG_PATH}`);
const config = require(CONFIG_PATH); // eslint-disable-line
const { name, version } = require('../package.json');

const jwtOptions = {
  secret: process.env.JWT_SECRET,
  getToken: req => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      return req.query.token;
    } else if (req.cookies && req.cookies.token) {
      return req.cookies.token;
    }
    return null;
  },
};

const PORT = process.env.PORT || 3050;
const server = restify.createServer({ name, version });
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.gzipResponse());
server.use(cookieParser.parse);
server.use(validator());

server.pre((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.charSet('utf-8');
  return next();
});

server.get('/', jwt(jwtOptions), async (req, res, next) => {
  if (req.user.scope.isTeam === false) {
    res.status(401);
    res.end();
    return next();
  }

  if (req.url === '/favicon.ico') {
    res.state(204);
    res.end();
    return next();
  }

  const query = {};

  if (req.query.from !== undefined) {
    query.from = req.query.from;
  }

  if (req.query.to !== undefined) {
    query.from = req.query.to;
  }

  if (req.query.article_id !== undefined) {
    query.article_id = req.query.article_id;
  }

  if (req.query.article_id !== undefined) {
    query.article_id = req.query.article_id;
  }

  const page = parseInt(req.query.page, 10) || 1;
  const perPage = parseInt(req.query.per_page, 10) || 20;
  const total = await Event.find(query).count();
  const pagesCount = Math.ceil(total / perPage);

  res.setHeader('X-Pagination-Current-Page', page);
  res.setHeader('X-Pagination-Per-Page', perPage);
  res.setHeader('X-Pagination-Total-Count', total);
  res.setHeader('X-Pagination-Page-Count', pagesCount);

  const links = [];
  links.push(`<${config.domain}?page=1>; rel=first`);
  if (page > 1) {
    links.push(`<${config.domain}?page=${page - 1}>; rel=prev`);
  }
  links.push(`<${config.domain}?page=${page}>; rel=self`);
  if (page < pagesCount) {
    links.push(`<${config.domain}?page=${page + 1}>; rel=prev`);
  }
  links.push(`<${config.domain}?page=${pagesCount}>; rel=last`);
  res.setHeader('Link', links.join(', '));

  const result = await Event.find(query)
    .skip((page - 1) * perPage)
    .limit(perPage);
  res.status(200);
  res.send(result);
  res.end();
  return true;
});

server.post(
  {
    path: '/',
    validation: validatePost,
  },
  jwt(jwtOptions),
  async (req, res, next) => {
    if (req.user.scope.isTeam === false) {
      res.status(401);
      res.end();
      return next();
    }

    const user = new Event(req.params);
    let result;
    try {
      result = await user.save();
    } catch (error) {
      res.status(400);
      res.send(error.message);
      res.end();
      return next();
    }

    res.link('Location', `${config.domain}${result._id}`);
    res.header('content-type', 'json');
    res.status(201);
    res.send(result);
    res.end();
    return next();
  },
);

// Event

/**
 * Replace event by id
 * @type {String} id - event id
 */
server.put(
  {
    path: '/:id',
    validation: validatePut,
  },
  jwt(jwtOptions),
  async (req, res, next) => {
    if (req.user.scope.isOwner === false) {
      res.status(401);
      res.end();
      return next();
    }

    const result = await Event.replaceOne({ _id: req.params.id }, req.params);

    if (!result.ok) {
      res.status(500);
      res.end();
      return next();
    }

    if (!result.n) {
      res.status(404);
      res.end();
      return next();
    }

    let user;
    try {
      user = await Event.findById(req.params.id);
    } catch (error) {
      res.status(404);
      res.end();
      return next();
    }

    res.status(200);
    res.send(user);
    res.end();
    return next();
  },
);

/**
 * Edit event by id
 * @type {String} id - event id
 */
server.patch(
  {
    path: '/:id',
    validation: validatePatch,
  },
  jwt(jwtOptions),
  async (req, res, next) => {
    if (req.user.scope.isTeam === false) {
      res.status(401);
      res.end();
      return next();
    }

    const result = await Event.updateOne({ _id: req.params.id }, req.params);

    if (!result.ok) {
      res.status(500);
      res.end();
      return next();
    }

    if (!result.n) {
      res.status(404);
      res.end();
      return next();
    }

    let user;
    try {
      user = await Event.findById(req.params.id);
    } catch (error) {
      res.status(404);
      res.end();
      return next();
    }

    res.status(200);
    res.send(user);
    res.end();
    return next();
  },
);

/**
 * Get event by ID
 * @type {String} id - event id
 * @return {Object} - event
 */
server.get('/:id', jwt(jwtOptions), async (req, res, next) => {
  if (req.params.id === 'favicon.ico') {
    res.status(204);
    res.end();
    return next();
  }

  if (req.user.scope.isTeam === false) {
    res.status(401);
    res.end();
    return next();
  }

  let result;
  try {
    result = await Event.findById(req.params.id);
  } catch (error) {
    res.status(404);
    res.end();
    return next();
  }

  res.status(200);
  res.send(result);
  res.end();
  return next();
});

/**
 * Remove event by ID
 * @type {String} - event id
 */
server.del('/:id', jwt(jwtOptions), async (req, res, next) => {
  if (req.user.scope.isOwner === false) {
    res.status(401);
    res.end();
    return next();
  }

  const result = await Event.remove({ _id: req.params.id });

  if (!result.result.ok) {
    res.status(500);
    res.end();
    return next();
  }

  if (!result.result.n) {
    res.status(404);
    res.end();
    return next();
  }

  res.status(204);
  res.end();
  return next();
});

server.opts('/:id', jwt(jwtOptions), async (req, res) => {
  const methods = ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  const method = req.header('Access-Control-Request-Method');
  if (methods.indexOf(method) === -1) {
    res.status(400);
    res.end();
    return;
  }
  res.setHeader('Access-Control-Allow-Methods', methods.join(','));
  res.status(200);
  res.end();
});

server.opts('/', jwt(jwtOptions), async (req, res) => {
  const methods = ['OPTIONS', 'GET', 'POST'];
  const method = req.header('Access-Control-Request-Method');
  if (methods.indexOf(method) === -1) {
    res.status(400);
    res.end();
    return;
  }
  res.setHeader('Access-Control-Allow-Methods', methods.join(','));
  res.status(200);
  res.end();
});

(async () => {
  mongoose.Promise = global.Promise;
  await mongoose.connect(
    `mongodb://${config.mongoDBHost}:${config.mongoDBPort}/${config.mongoDBName}`,
    { useMongoClient: true },
  );
  server.listen(PORT);
})();
