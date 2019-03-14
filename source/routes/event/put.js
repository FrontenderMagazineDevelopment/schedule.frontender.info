import Event from '../../models/Event';

export async function put(req, res) {
  if (req.user.scope.isOwner === false) {
    res.status(401);
    res.end();
    return;
  }

  const result = await Event.replaceOne({ _id: req.params.id }, req.params);

  if (!result.ok) {
    res.status(500);
    res.end();
    return;
  }

  if (!result.n) {
    res.status(404);
    res.end();
    return;
  }

  let user;
  try {
    user = await Event.findById(req.params.id);
  } catch (error) {
    res.status(404);
    res.end();
    return;
  }

  res.status(200);
  res.send(user);
  res.end();
}

export default put;
