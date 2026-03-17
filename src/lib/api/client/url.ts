export function isAbsoluteHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function stripTrailingSlash(value: string) {
  if (!value) return '';
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function withLeadingSlash(value: string) {
  if (!value) return '';
  return value.startsWith('/') ? value : `/${value}`;
}

export function joinBaseAndPath(basePath: string, path: string) {
  const normalizedPath = withLeadingSlash(path);
  const normalizedBasePath = stripTrailingSlash(basePath);
  if (!normalizedBasePath) return normalizedPath;

  if (isAbsoluteHttpUrl(normalizedBasePath)) {
    return `${normalizedBasePath}${normalizedPath}`;
  }

  const relativeBasePath = withLeadingSlash(normalizedBasePath);
  if (
    normalizedPath === relativeBasePath ||
    normalizedPath.startsWith(`${relativeBasePath}/`)
  ) {
    return normalizedPath;
  }

  return `${relativeBasePath}${normalizedPath}`;
}
