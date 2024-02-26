export = ICRUDModel;

declare class ICRUDModel<CreateType, ReadType> {
  constructor(
    public db: Knex,
    public logger: winston.Logger,
    public redisClient: RedisClientType, 
    public config: ENV
  );

  //                              ↓ Return identifier of created record 
  async create(args: CreateType): Promise<string | number>;
  async read<SelectType extends keyof ReadType>(
    identifier: string | number, select?: SelectType[] | "*"
  ): Promise<ReadType | undefined | Pick<ReadType, SelectType>>;
  async update(identifier: string | number, args: Partial<ReadType>): Promise<void>;
  async delete(identifier: string | number): Promise<void>;
}