export async function opt(req, res) {
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
}

export default opt;
