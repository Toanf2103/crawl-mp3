export const appConfig = () => ({
  secretToken: process.env.SECRET_TOKEN,
  jwtExpired: parseInt(process.env.JWT_EXPIRED_IN_SECOND ?? '') ?? 60 * 60,
  urlVerify: `${process.env.BASE_URL_FE}/${process.env.URL_VERIFY}`,
  appName: process.env.APP_NAME,
  urlResetPass: `${process.env.BASE_URL_FE}/${process.env.URL_RESET_PASS}`,
  port: parseInt(process.env.APP_PORT ?? '') || 33333,
});
