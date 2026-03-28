import { Injectable } from '@nestjs/common';
import { customAlphabet, nanoid } from 'nanoid';

@Injectable()
export class GenerateAccessIdService {
  generate() {
    const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);
    return nanoid();
  }
}
