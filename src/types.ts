/**
 * Represents the options expected by `useZodactiveForm()`.
 * Composed of functions meant to create and interact with
 * reactive objects such as ref() in vue or writable() in svelte.
 *
 * @template T - The type of the reactive class, using <unknown> if possible.
 */
export interface ZodactiveOptions<T = unknown> {
  /**
   * Instantiate and return a new reactive instance.
   *
   * ex: `() => ref<T>()`
   * ex: `() => writable<T>()`
   *
   * @template T - The type of the reactive object
   * @returns {unknown} - The created reactive object
   */
  createReactive: () => T;

  /**
   * Retrieves a value from a reactive object.
   *
   * @param ref - The reference object
   * @returns The retrieved value
   */
  getReactive: (ref: T) => unknown;

  /**
   * Sets the value of a reactive object.
   *
   * @param ref - The reference object
   * @param value - The new value to update
   */
  setReactive: (ref: T, value: unknown) => void;
}

/**
 * Represents a type that defines form fields for a given object type.
 * Each field in the form is represented by a key-value pair, where the key is the field name and the value is an object
 * containing the field value and any associated error message.
 *
 * @template T - The object type for which form fields are defined
 */
export type FormFields<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] extends Record<string, unknown>
    ? FormFields<T[K]>
    : { value: T[K]; error: string };
};
