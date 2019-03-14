import mongoose from 'mongoose';
import jwt from 'restify-jwt';
import restify from 'restify';
import cookieParser from 'restify-cookies';
import dotenv from 'dotenv';
import { resolve } from 'path';
import validator from 'restify-joi-middleware';

import validatePost from './validators/event/post';
import validatePut from './validators/event/put';
import validatePatch from './validators/event/patch';

import { event, events } from './routes';

const ENV_PATH = resolve(__dirname, '../.env');
dotenv.config({
  allowEmptyValues: false,
  path: ENV_PATH,
});

const { MONGODB_PORT, MONGODB_HOST, MONGODB_NAME, JWT_SECRET } = process.env;
const PORT = process.env.PORT || 3070;
const { name, version } = require('../package.json');

const jwtOptions = {
  secret: JWT_SECRET,
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

server.get('/', events.get);

server.post(
  {
    path: '/',
    validation: validatePost,
  },
  jwt(jwtOptions),
  event.post,
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
  event.put,
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
  event.patch,
);

/**
 * Get event by ID
 * @type {String} id - event id
 * @return {Object} - event
 */
server.get('/:id', event.get);

/**
 * Remove event by ID
 * @type {String} - event id
 */
server.del('/:id', jwt(jwtOptions), event.del);

server.opts('/:id', jwt(jwtOptions), event.opt);

server.opts('/', jwt(jwtOptions), events.opt);

(async () => {
  mongoose.Promise = global.Promise;
  await mongoose.connect(`mongodb://${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_NAME}`, {
    useNewUrlParser: true,
    useCreateIndex: true,
  });
  server.listen(PORT);
})();
