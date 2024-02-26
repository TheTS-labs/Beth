/* eslint-disable @typescript-eslint/no-explicit-any */
export default <SelectType extends string[]>(obj: { [x: string]: any }, select: SelectType | "*" | undefined): any => {
  if (!Array.isArray(select) || !select) {
    return obj;
  }
  return { ...select.reduce((res, key) => ({ ...res, [key]: obj[key] }), { }) };
};