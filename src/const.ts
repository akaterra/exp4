export const MANIFEST_GENERAL_TYPE = 'general';
export const MANIFEST_PROJECT_TYPE = 'project';
export const MANIFESTS = [
  MANIFEST_GENERAL_TYPE,
  MANIFEST_PROJECT_TYPE,
];
export const HTTP_PORT = 7000;
export const AUTH_DOMAIN = process.env.AUTH_DOMAIN || 'http://localhost:7000';
export const AUTH_MODE = process.env.AUTH_MODE || 'header';
export const JWT_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET ?? 'secret';
