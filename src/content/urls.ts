const baseUrl = import.meta.env.BASE_URL;

export function appUrl(path: string): string {
  return `${baseUrl}${path.replace(/^\/+/, '')}`;
}

export function contentUrl(path: string): string {
  return appUrl(`content/${path.replace(/^\/?content\/?/, '')}`);
}
