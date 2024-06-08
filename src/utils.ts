import { z } from "zod";
import type { FormFields } from "./types.js";

/**
 * Checks if a given field is an object type in Zod schema.
 *
 * @param field - The field to be checked for object type.
 * @returns Whether the field is an object type or not.
 */
export const isFieldAnObject = (
	field: z.ZodTypeAny
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
	S extends z.ZodObject<z.ZodRawShape>
>(
	object: T,
	schema: S
): FormFields<T> =>
	Object.fromEntries(
		Object.entries(object).map(([field, value]) => {
			const fieldType = schema.shape[field];
			if (!isFieldAnObject(fieldType)) return [field, { value, error: "" }];
			const composedValue = objectToFormFields(
				value as z.infer<typeof fieldType>,
				schema.shape[field] as z.ZodObject<z.ZodRawShape>
			);
			return [field, composedValue];
		})
	);
