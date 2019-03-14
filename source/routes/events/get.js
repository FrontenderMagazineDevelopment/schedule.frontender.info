import Event from '../../models/Event';

export async function get(req, res) {
  const { SCHEDULE_DOMAIN } = process.env;
  const query = {};

  if (req.query.state !== undefined) {
    query.state = req.query.state;
  }

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
  const total = await Event.find(query).countDocuments();
  const pagesCount = Math.ceil(total / perPage);

  res.setHeader('X-Pagination-Current-Page', page);
  res.setHeader('X-Pagination-Per-Page', perPage);
  res.setHeader('X-Pagination-Total-Count', total);
  res.setHeader('X-Pagination-Page-Count', pagesCount);

  const links = [];
  links.push(`<${SCHEDULE_DOMAIN}?page=1>; rel=first`);
  if (page > 1) {
    links.push(`<${SCHEDULE_DOMAIN}?page=${page - 1}>; rel=prev`);
  }
  links.push(`<${SCHEDULE_DOMAIN}?page=${page}>; rel=self`);
  if (page < pagesCount) {
    links.push(`<${SCHEDULE_DOMAIN}?page=${page + 1}>; rel=prev`);
  }
  links.push(`<${SCHEDULE_DOMAIN}?page=${pagesCount}>; rel=last`);
  res.setHeader('Link', links.join(', '));

  const result = await Event.find(query)
    .skip((page - 1) * perPage)
    .limit(perPage);

  res.status(200);
  res.send(result);
  res.end();
};

export default get;
