import { z } from "zod";
import type { FormFields } from "./types.js";

export type Obj = z.ZodObject<z.ZodRawShape>;
export type ObjEffect = z.ZodEffects<Obj>;

export const getObj = <S extends Obj | ObjEffect>(def: S) => {
  if (def.constructor.name === z.ZodEffects.name) {
    return (def as ObjEffect)._def.schema;
  }
  return def as Obj;
};

/**
 * Checks if a given field is an object type in Zod schema.
 *
 * @param field - The field to be checked for object type.
 * @returns Whether the field is an object type or not.
 */
export const isFieldAnObject = (
  field: z.ZodTypeAny,
): field is
  | z.AnyZodObject
  | z.ZodIntersection<z.AnyZodObject, z.AnyZodObject> =>
  field instanceof z.ZodObject || field instanceof z.ZodIntersection;

/**
 * Converts an object to form fields based on a given schema.
 *
 * This function will wrap all values in the provided object with
 * an additional error field: `{value: <value>, error: ''}`
 *
 * @template T - Generic representing the object type.
 * @template S - Generic representing the schema type.
 * @param object - The object to convert to form fields.
 * @param schema - The schema defining the structure of the form fields.
 * @returns FormFields<T> - An object representing the form fields generated from the input object.
 */
export const objectToFormFields = <
  T extends Record<string, unknown>,
  S extends Obj | ObjEffect,
>(
  object: T,
  schema: S,
): FormFields<T> =>
  Object.fromEntries(
    Object.entries(object).map(([field, value]) => {
      const _shape = getObj(schema).shape;
      const fieldType = _shape[field];
      if (!isFieldAnObject(fieldType)) return [field, { value, error: "" }];
      const composedValue = objectToFormFields(
        value as z.infer<typeof fieldType>,
        _shape[field] as Obj,
      );
      return [field, composedValue];
    }),
  );
