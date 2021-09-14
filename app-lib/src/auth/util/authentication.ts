import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRole } from '../enums/user-role.enum';

const saltRounds = 10;

export function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    bcrypt.compare(plainText, hash, (err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(result);
    });
  });
}

export function hashPassword(plainText: string): Promise<string> {
  return new Promise((resolve, reject) => {
    bcrypt.hash(plainText, saltRounds, (err, hash) => {
      if (err) {
        reject(err);
      }

      resolve(hash);
    });
  });
}

export function createJWT(secret: string, data: { sub: string, roles: UserRole[] }): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(data, secret, (err, token) => {
      if (err) {
        return reject(err);
      }

      return resolve(token as string);
    });
  });
}

export function decodeJWT(secret: string, token: string): Promise<{ sub: string }> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        reject(err);
      }

      const { sub } = decoded as { sub: string };

      resolve({ sub });
    });
  });
}
