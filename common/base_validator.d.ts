declare class IBaseValidator {
  validate(schema: unknown, value: unknown): Promise<unknown|undefined>;
}