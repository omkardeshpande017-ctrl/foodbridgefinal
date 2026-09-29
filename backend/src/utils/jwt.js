import jwt from 'jsonwebtoken';

export const signUser = (u) =>
  jwt.sign(
    {
      id: u._id.toString(),
      role: u.role,
      name: u.name,
      email: u.email,
    },
    process.env.JWT_SECRET || 'foodbridge_change_this_secret',
    {
      expiresIn: '7d',
    }
  );