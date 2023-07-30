/* eslint-disable @typescript-eslint/no-explicit-any */
export default (obj: { [x: string]: any }, ...args: any[]): any => {
  if (args.includes("*")) {
    return obj;
  }
  return { ...args.reduce((res, key) => ({ ...res, [key]: obj[key] }), { }) };
};