export const MANIFEST_GENERAL_TYPE = 'general';
export const MANIFEST_PROJECT_TYPE = 'project';
export const MANIFESTS = [
  MANIFEST_GENERAL_TYPE,
  MANIFEST_PROJECT_TYPE,
];
export const HTTP_PORT = 7000;
export const HTTP_HOST = process.env.HTTP_HOST || 'localhost';
export const AUTH_HOST = process.env.AUTH_HOST || HTTP_HOST;
export const AUTH_JWT_SECRET = process.env.AUTH_JWT_ACCESS_TOKEN_SECRET ?? 'secret';
export const AUTH_MODE = process.env.AUTH_MODE || 'header';

export function getHostWithSchema(host: string): string {
  return host.startsWith('http') ? host : `http://${host}`;
}

export function getHost(host: string): string {
  return host.startsWith('http://') ? host.slice(7) : host.startsWith('https://') ? host.slice(8) : host;
}
