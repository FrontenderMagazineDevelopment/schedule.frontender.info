import mongoose from 'mongoose';
import { resolve } from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import Article from './models/Article';
import Event from './models/Event';

const articlesList = require('./articles.json');
// const contributorsList = require('./contributors.json');

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

(async () => {
  mongoose.Promise = global.Promise;
  await mongoose.connect(
    `mongodb://${config.mongoDBHost}:${config.mongoDBPort}/${config.mongoDBName}`,
    { useMongoClient: true },
  );

  const articles = Object.values(articlesList);
  const published = articles.filter(
    article => article.ready === true && article.reponame !== undefined,
  );
  const freezed = articles.filter(
    article => article.ready === false && article.reponame !== undefined,
  );

  console.log('pub:', published.length);
  published.forEach(async article => {
    let repo;

    if (Array.isArray(article.reponame)) {
      repo = article.reponame[article.reponame.length - 1].split('?')[0];
    } else {
      repo = article.reponame;
    }

    const result = await Article.find({
      $or: [{ 'translations.reponame': repo }, { reponame: repo }],
    });
    console.log('reponame: ', repo);

    if (result.length > 0) {
      // console.log(result[0]._id,
      //   (
      //     (result[0].translations) &&
      //     (result[0].translations[0]) &&
      //     result[0].translations[0].published
      //   ) ||
      //   (
      //     result[0] &&
      //     result[0].published
      //   )
      // );

      const from =
        (result[0].translations &&
          result[0].translations[0] &&
          result[0].translations[0].published) ||
        (result[0] && result[0].published);

      const id = result[0]._id;

      const event = {
        article_id: id,
        from,
        responsible: ['59e4a3a6d8a0a22d41a34b6d'],
        state: 'published',
      };

      console.log(event);

      const user = new Event(event);
      await user.save();
    } else {
      console.log(article);
    }
  });

  // mongoose.connection.close();
})();
