import jwt from 'jsonwebtoken';

async function auth(req, res, next){
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if(token == null){
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.AUX_SECRET, err => {
    if(err){
      return res.sendStatus(403);
    }

    next();
  });
}

export default auth;