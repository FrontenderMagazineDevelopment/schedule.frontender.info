import mongoose from 'mongoose';
import Event from '../../models/Event';

export async function get(req, res) {
  let result;
  try {
    result = await Event.findById(mongoose.Types.ObjectId(req.params.id));
  } catch (error) {
    res.status(404);
    res.end();
    return;
  }

  res.status(200);
  res.send(result);
  res.end();
}

export default get;
