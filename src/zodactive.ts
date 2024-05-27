import { ZodError, z } from "zod";
import { getDefaultsForSchema } from "zod-defaults";
import type { FormFields, ZodactiveOptions } from "./types";
import { objectToFormFields } from "./utils";

export const useZodactiveForm = <
	S extends z.ZodObject<z.ZodRawShape>,
	R = unknown
>(
	options: ZodactiveOptions<R>,
	schema: S,
	initialData?: z.TypeOf<S>
) => {
	const create = options.createReactive;
	const setRef = options.setReactive;
	const getRef = options.getReactive;

	const initialValue = initialData || getDefaultsForSchema(schema);
	const initialFields = objectToFormFields(initialValue, schema);

	const validRef = create();
	const formRef = create();

	setRef(validRef, false);
	setRef(formRef, initialFields);

	const forEachFields = (
		fields: FormFields<Record<string, unknown>>,
		callback: (field: { value: unknown; error: string }) => void
	) => {
		for (const fieldName in fields) {
			const field = fields[fieldName];
			const isObject =
				Object.prototype.toString.call(field) === "[object Object]";
			if (isObject && "value" in field && "error" in field) {
				callback(field);
			} else if (isObject) {
				forEachFields(
					field as unknown as FormFields<Record<string, unknown>>,
					callback
				);
			}
		}
	};

	const mapEachFields = <T = unknown>(
		fields: FormFields<Record<string, unknown>>,
		callback: (field: { value: unknown; error: string }) => T
	) => {
		const newFields: Partial<
			Record<keyof typeof fields, T | Record<string, T>>
		> = {};
		for (const fieldName in fields) {
			const field = fields[fieldName];
			const isObject =
				Object.prototype.toString.call(field) === "[object Object]";
			if (isObject && "value" in field && "error" in field) {
				newFields[fieldName] = callback(field);
			} else if (isObject) {
				newFields[fieldName] = mapEachFields(
					field as unknown as FormFields<Record<string, unknown>>,
					callback
				) as Record<string, T>;
			}
		}

		return newFields;
	};

	const getFieldByPath = (path: string[]) => {
		const fullPath = path.join(".");
		let currentField = getRef(formRef) as Record<string, unknown>;
		while (path.length > 0) {
			const name = path.shift()!;
			if (!(name in currentField)) {
				throw new Error(`Failed to assign form field "${fullPath}".`);
			}
			currentField = currentField[name] as Record<string, unknown>;
		}
		return currentField;
	};

	const normalizePath = (path: string | string[]) => {
		if (Array.isArray(path)) return path;
		if (path && path.includes(".")) return path.split(".");
		return [path];
	};

	const assign = (path: string | string[], value: unknown) => {
		const field = getFieldByPath(normalizePath(path));
		field.value = value;
		setRef(formRef, getRef(formRef));
	};

	/**
	 * Resets the form (clear values and clear errors).
	 */
	const clear = () => {
		setRef(formRef, initialFields);
	};

	/**
	 * Removes any error states from the form.
	 */
	const clearErrors = () => {
		const fields = getRef(formRef) as FormFields<Record<string, unknown>>;
		forEachFields(fields, (field) => (field.error = ""));
		setRef(formRef, getRef(formRef));
	};

	const toJson = (): z.TypeOf<S> => {
		const fields = getRef(formRef) as FormFields<Record<string, unknown>>;
		return mapEachFields(fields, (field) => field.value);
	};

	const validate = () => {
		clearErrors();

		try {
			schema.parse(toJson());
			setRef(validRef, true);
			return true;
		} catch (error) {
			if (error instanceof ZodError) {
				const fields = getRef(formRef) as FormFields<Record<string, unknown>>;
				const errors = error.flatten();

				Object.entries(errors.fieldErrors).forEach(([name, msg]) => {
					fields[name].error = msg?.length ? msg[0]! : "";
				});

				setRef(formRef, getRef(formRef));
				setRef(validRef, false);
				return false;
			} else {
				setRef(validRef, false);
				throw error;
			}
		}
	};

	validate();
	clearErrors();

	return {
		form: formRef,
		valid: validRef,
		assign,
		clear,
		clearErrors,
		validate,
		toJson,
	};
};
