import joi from 'joi';

export default {
  body: joi
    .object()
    .keys({
      article_id: joi.string(),
      from: joi.date(),
      to: joi.date(),
      responsible: joi.array().items(joi.string()),
      abstract: joi.string(),
      state: joi
        .string()
        .valid([
          'planned',
          'permission_requested',
          'permission_granted',
          'permission_denied',
          'translation',
          'translated',
          'editorial',
          'edited',
          'published_for_subscribers',
          'published',
          'outdated',
          'freezed',
          'canceled',
        ]),
      _id: joi.string().required(),
      __v: joi.number(),
    })
    .required(),
};
