import { Event } from '@frontender-magazine/models';

export async function post(req, res) {
  const { SCHEDULE_DOMAIN } = process.env;

  if (req.user.scope.isTeam === false) {
    res.status(401);
    res.end();
    return;
  }

  const user = new Event(req.body);
  let result;
  try {
    result = await user.save();
  } catch (error) {
    res.status(400);
    res.send(error.message);
    res.end();
    return;
  }

  res.link('Location', `${SCHEDULE_DOMAIN}${result._id}`);
  res.header('content-type', 'json');
  res.status(201);
  res.send(result);
  res.end();
}

export default post;
