export default abstract class BaseValidator {
  abstract validate(value: unknown): Promise<unknown|undefined>;
}