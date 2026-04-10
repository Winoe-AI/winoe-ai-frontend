import {
  parsePermissionsString as parsePermissionsStringImpl,
  rolesToPermissions as rolesToPermissionsImpl,
  toStringArray as toStringArrayImpl,
} from '@/platform/auth/claimsDecode';

export const toStringArray = toStringArrayImpl;

export const parsePermissionsString = parsePermissionsStringImpl;

export const rolesToPermissions = rolesToPermissionsImpl;
