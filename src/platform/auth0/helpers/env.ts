export const hasAuth0Env = () =>
  Boolean(
    process.env.WINOE_AUTH0_SECRET &&
    process.env.WINOE_AUTH0_DOMAIN &&
    process.env.WINOE_AUTH0_CLIENT_ID &&
    process.env.WINOE_AUTH0_CLIENT_SECRET &&
    process.env.WINOE_APP_BASE_URL,
  );

export const signInReturnToPath = '/dashboard';
