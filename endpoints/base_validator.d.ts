declare class IBaseValidator {
  validate(value: unknown): Promise<unknown|undefined>;
}