export function isLocalEnvironment() {
  return (
    process.env.VERCEL_ENV?.toLowerCase() === 'development' ||
    process.env.NODE_ENV === 'development'
  );
}
