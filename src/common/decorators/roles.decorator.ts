import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const LEVEL_KEY = 'level';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
export const MinLevel = (level: number) => SetMetadata(LEVEL_KEY, level);