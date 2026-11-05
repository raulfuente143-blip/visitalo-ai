// Convierte las URL públicas de Supabase Storage en { bucket, path } para poder borrar los archivos.
const PUBLIC_MARKER = "/storage/v1/object/public/";

export function parseStorageUrl(url: string | null | undefined): { bucket: string; path: string } | null {
  if (!url) return null;
  const index = url.indexOf(PUBLIC_MARKER);
  if (index === -1) return null;
  const rest = url.slice(index + PUBLIC_MARKER.length).split("?")[0];
  const [bucket, ...parts] = rest.split("/");
  if (!bucket || parts.length === 0) return null;
  return { bucket, path: decodeURIComponent(parts.join("/")) };
}

export function addStoragePath(map: Map<string, Set<string>>, bucket: string, path: string) {
  const paths = map.get(bucket) ?? new Set<string>();
  paths.add(path);
  map.set(bucket, paths);
}

export function groupStoragePaths(urls: (string | null | undefined)[]) {
  const map = new Map<string, Set<string>>();
  for (const url of urls) {
    const parsed = parseStorageUrl(url);
    if (parsed) addStoragePath(map, parsed.bucket, parsed.path);
  }
  return map;
}
