import jwt from 'jsonwebtoken';
import config from '../config/env';
import { UserRole } from '@prisma/client';

export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
}

export class JWTService {
    static sign(payload: JWTPayload): string {
        return jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn,
        });
    }

    static verify(token: string): JWTPayload {
        try {
            return jwt.verify(token, config.jwt.secret) as JWTPayload;
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    static decode(token: string): JWTPayload | null {
        try {
            return jwt.decode(token) as JWTPayload;
        } catch {
            return null;
        }
    }
}
