export class Config {
  constructor(private env: NodeJS.ProcessEnv) {}

  public getConfig(): ENV {
    const envTyped: { [key: string]: unknown } = {
      APP_PORT: this.env.APP_PORT ? Number(this.env.APP_PORT) : undefined,
      POSTGRES_USER: this.env.POSTGRES_USER,
      POSTGRES_PASSWORD: this.env.POSTGRES_PASSWORD,
      POSTGRES_DB: this.env.POSTGRES_DB,
      POSTGRES_HOST: this.env.POSTGRES_HOST,
      REDIS_REQUIRED: this.env.REDIS_REQUIRED ? Boolean(this.env.REDIS_REQUIRED) : undefined,
      USER_EX_SECS: this.env.USER_EX_SECS ? Number(this.env.USER_EX_SECS) : undefined,
      USER_REPMISSIONS_EX_SECS: this.env.USER_REPMISSIONS_EX_SECS ? 
                                Number(this.env.USER_REPMISSIONS_EX_SECS) : undefined,
      NODE_ENV: this.env.NODE_ENV ? this.env.NODE_ENV : "development"
    };

    Object.keys(envTyped).map((key: string) => {
      if (envTyped[key] === undefined) {
        throw new Error(`Undefined value for .env variable: ${key}`);
      }
    });

    return envTyped as unknown as ENV;
  }
}

export default interface ENV {
  APP_PORT: number
  POSTGRES_USER: string
  POSTGRES_PASSWORD: string
  POSTGRES_DB: string
  POSTGRES_HOST: string
  POSTGRES_PORT: number
  REDIS_REQUIRED: boolean

  USER_EX_SECS: number
  USER_REPMISSIONS_EX_SECS: number

  NODE_ENV: "development" | string
}