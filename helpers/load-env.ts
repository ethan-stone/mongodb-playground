import * as dotenv from "dotenv";

export function loadEnv(options?: dotenv.DotenvConfigOptions | undefined) {
  dotenv.config(options);
}

export function assertEnvVar(envVar: string | undefined, errMessage: string) {
  if (!envVar) throw new Error(errMessage);
  return envVar;
}
