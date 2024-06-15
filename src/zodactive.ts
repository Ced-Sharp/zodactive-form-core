import { ZodError, z } from "zod";
import { getDefaultsForSchema } from "zod-defaults";
import type { FormFields, ZodactiveOptions } from "./types";
import { type Obj, type ObjEffect, getObj, objectToFormFields } from "./utils";

export const useZodactiveForm = <
  S extends
    | z.ZodObject<z.ZodRawShape>
    | z.ZodEffects<z.ZodObject<z.ZodRawShape>>,
  R = unknown,
>(
  options: ZodactiveOptions<R>,
  schema: S,
  initialData?: z.TypeOf<S>,
) => {
  const create = options.createReactive;
  const setRef = options.setReactive;
  const getRef = options.getReactive;

  const initialValue = initialData || getDefaultsForSchema(schema);
  const initialFields = objectToFormFields(initialValue, schema);

  const validRef = create();
  const formErrorsRef = create();
  const formRef = create();

  setRef(validRef, false);
  setRef(formErrorsRef, []);
  setRef(formRef, initialFields);

  const forEachFields = (
    fields: FormFields<Record<string, unknown>>,
    callback: (field: { value: unknown; error: string }) => void,
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
          callback,
        );
      }
    }
  };

  const mapEachFields = <T = unknown>(
    fields: FormFields<Record<string, unknown>>,
    callback: (field: { value: unknown; error: string }) => T,
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
          callback,
        ) as Record<string, T>;
      }
    }

    return newFields;
  };

  const getFieldByPath = (path: string[]) => {
    const _path = [...path];
    const fullPath = path.join(".");
    let currentField = getRef(formRef) as Record<string, unknown>;
    let schemaField = getObj(schema).shape;

    while (_path.length > 0) {
      const name = _path.shift();
      if (!name) {
        throw new Error(`Failed to assign form field "${fullPath}".`);
      }

      if (!(name in currentField)) {
        // Field might be optional
        if (name in schemaField) {
          const objField = schemaField[name as keyof typeof schemaField];
          if (objField.constructor.name === z.ZodOptional.name) {
            // Field is optional, assign to it
            currentField[name] = { value: undefined, error: "" };
          } else {
            throw new Error(`Failed to assign form field "${fullPath}".`);
          }
        } else {
          throw new Error(`Failed to assign form field "${fullPath}".`);
        }
      }

      currentField = currentField[name] as Record<string, unknown>;

      const maybeNextField = schemaField[name as keyof typeof schemaField];
      if (
        (maybeNextField && "shape" in maybeNextField) ||
        "_def" in maybeNextField
      ) {
        const nextField = maybeNextField as Obj | ObjEffect;
        schemaField = getObj(nextField).shape;
      }
    }
    return currentField;
  };

  const normalizePath = (path: string | string[]) => {
    if (Array.isArray(path)) return path;
    if (path?.includes(".")) return path.split(".");
    return [path];
  };

  const assign = (path: string | string[], value: unknown) => {
    const field = getFieldByPath(normalizePath(path));
    console.log("assign:", path, field);
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
    setRef(formErrorsRef, []);
    const fields = getRef(formRef) as FormFields<Record<string, unknown>>;
    forEachFields(fields, (field) => {
      field.error = "";
    });
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
      // NOTE: Using name, because zod classes may differ at when used in
      //       a different project.
      if (
        typeof error === "object" &&
        error?.constructor?.name === ZodError.name
      ) {
        const fields = getRef(formRef) as FormFields<Record<string, unknown>>;
        const errors = (error as ZodError).flatten();

        for (const name in errors.fieldErrors) {
          const msg = errors.fieldErrors[name];
          fields[name].error = msg?.length ? msg[0] : "";
        }

        setRef(formErrorsRef, [...errors.formErrors]);
        setRef(formRef, getRef(formRef));
        setRef(validRef, false);
        return false;
      }
      setRef(validRef, false);
      throw error;
    }
  };

  validate();
  clearErrors();

  return {
    form: formRef,
    formErrors: formErrorsRef,
    valid: validRef,
    assign,
    clear,
    clearErrors,
    validate,
    toJson,
    getFieldByPath,
  };
};
