import bcrypt from 'bcryptjs';
import { User as SequelizeUser } from './index.js';

SequelizeUser.prototype.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default SequelizeUser;
