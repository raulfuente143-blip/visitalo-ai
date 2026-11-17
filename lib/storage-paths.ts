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

type StorageFile = { bucket: string; path: string };

// Auditoría C1: un archivo solo "pertenece" a una propiedad si está dentro de su carpeta.
// Así el servidor nunca borra archivos de otra propiedad o de otra agencia, aunque alguien
// haya guardado una URL ajena en la base de datos.
export function isPropertyFile(file: StorageFile | null, propertyId: string): file is StorageFile {
  if (!file || !propertyId || file.path.includes("..")) return false;
  switch (file.bucket) {
    case "property-photos":
    case "floor-plans":
      return file.path.startsWith(`properties/${propertyId}/`);
    case "property-videos":
      return file.path.startsWith(`${propertyId}/`);
    default:
      return false;
  }
}

// Solo acepta URLs públicas de NUESTRO Supabase, del bucket indicado y de la carpeta de la propiedad.
export function isOwnedStorageUrl(url: string | null | undefined, bucket: string, propertyId: string) {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  if (!url || !base || !url.startsWith(`${base}${PUBLIC_MARKER}`)) return false;
  const file = parseStorageUrl(url);
  return file !== null && file.bucket === bucket && isPropertyFile(file, propertyId);
}

// Como groupStoragePaths, pero descartando todo lo que no sea de la carpeta de la propiedad.
export function groupPropertyStoragePaths(urls: (string | null | undefined)[], propertyId: string) {
  const map = new Map<string, Set<string>>();
  for (const url of urls) {
    const file = parseStorageUrl(url);
    if (isPropertyFile(file, propertyId)) addStoragePath(map, file.bucket, file.path);
  }
  return map;
}
