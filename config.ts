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
      USER_EX: this.env.USER_EX ? Number(this.env.USER_EX) : undefined,
      USER_PERMISSIONS_EX: this.env.USER_PERMISSIONS_EX ? 
                                Number(this.env.USER_PERMISSIONS_EX) : undefined,
      POST_EX: this.env.POST_EX ? Number(this.env.USER_EX) : undefined,
      POST_COMMENTS_EX: this.env.POST_EX ? Number(this.env.USER_EX) : undefined,
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

  USER_EX: number
  USER_PERMISSIONS_EX: number

  POST_EX: number
  POST_COMMENTS_EX: number

  NODE_ENV: "development" | string
}