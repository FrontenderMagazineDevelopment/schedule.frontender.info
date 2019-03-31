import { Event } from '@frontender-magazine/models';

export async function del(req, res) {
  if (req.user.scope.isOwner === false) {
    res.status(401);
    res.end();
    return;
  }

  const result = await Event.remove({ _id: req.params.id });

  if (!result.result.ok) {
    res.status(500);
    res.end();
    return;
  }

  if (!result.result.n) {
    res.status(404);
    res.end();
    return;
  }

  res.status(204);
  res.end();
}

export default del;
