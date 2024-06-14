import { describe, expect, it } from "vitest";
import { z } from "zod";
import { useZodactiveForm } from "./zodactive.js";

const createReactive = () => ({ value: null });
const setReactive = (ref: { value: unknown }, value: unknown) =>
	(ref.value = value);
const getReactive = (ref: { value: unknown }) => ref.value;
const opts = { createReactive, setReactive, getReactive };

const userSchema = z.object({
	username: z.string().min(3),
	displayName: z.string().min(3).optional(),
	age: z.number().min(18, "User is too young").max(99, "User is too old"),
});

const userSchemaValid = z.object({
	username: z.string().min(3).default("John"),
	displayName: z.string().min(3).default("John"),
	age: z.number().min(18).max(99).default(36),
});

describe("Zodactive Core", () => {
	describe("when initialized", () => {
		it("should be valid with initialized with empty schema", () => {
			const { valid } = useZodactiveForm(opts, z.object({}));
			expect(valid).toHaveProperty("value", true);
		});

		it("should be valid when initialized with a schema which is valid with its default values", () => {
			const { valid } = useZodactiveForm(opts, userSchemaValid);
			expect(valid).toHaveProperty("value", true);
		});

		it("should be invalid when initialize with a schema which is not valid with its default values", () => {
			const { valid } = useZodactiveForm(opts, userSchema);
			expect(valid).toHaveProperty("value", false);
		});

		it("should be invalid when initialized with initialData that is not valid", () => {
			const { valid } = useZodactiveForm(opts, userSchema, {
				username: "a",
				age: 2,
			});
			expect(valid).toHaveProperty("value", false);
		});

		it("should be valid when initialized with initialData that is valid", () => {
			const { valid } = useZodactiveForm(opts, userSchema, {
				username: "aaa",
				age: 20,
			});
			expect(valid).toHaveProperty("value", true);
		});

		it("should be valid when initialized with valid data and optional data is missing", () => {
			const { valid } = useZodactiveForm(opts, userSchema, {
				username: "John",
				age: 20,
			});

			expect(valid).toHaveProperty("value", true);
		});

		it("should be invalid when initialized with valid data and optional data is provided, but invalid", () => {
			const { valid } = useZodactiveForm(opts, userSchema, {
				username: "John",
				displayName: "",
				age: 20,
			});

			expect(valid).toHaveProperty("value", false);
		});

		it("should be valid when initialized with valid data and valid optional data", () => {
			const { valid } = useZodactiveForm(opts, userSchema, {
				username: "John",
				displayName: "John",
				age: 20,
			});

			expect(valid).toHaveProperty("value", true);
		});

		it("should not contain optional properties if they do not define default values", () => {
			const { form } = useZodactiveForm(opts, userSchema);
			expect(form.value).toMatchObject({
				username: { value: "", error: "" },
				age: { value: 0, error: "" },
			});
		});
	});

	describe("when providing a schema", () => {
		it("should support forms with boolean values", () => {
			const { form, valid, assign, validate } = useZodactiveForm(
				opts,
				z.object({
					valid: z.boolean().refine((v) => v === true, "Must be valid"),
				})
			);

			expect(form.value).toMatchObject({ valid: { value: false, error: "" } });
			expect(valid.value).toBe(false);

			assign("valid", true);
			validate();

			expect(form.value).toMatchObject({ valid: { value: true, error: "" } });
			expect(valid.value).toBe(true);
		});

		it("should support forms with string values", () => {
			const { form, valid, assign, validate } = useZodactiveForm(
				opts,
				z.object({ name: z.string().min(3) })
			);

			expect(form.value).toMatchObject({ name: { value: "", error: "" } });
			expect(valid.value).toBe(false);

			assign("name", "John");
			validate();

			expect(form.value).toMatchObject({ name: { value: "John", error: "" } });
			expect(valid.value).toBe(true);
		});

		it("should support forms with array values", () => {
			const { form, valid, assign, validate } = useZodactiveForm(
				opts,
				z.object({ tags: z.array(z.string()).min(3) })
			);

			expect(form.value).toMatchObject({ tags: { value: [], error: "" } });
			expect(valid.value).toBe(false);

			assign("tags", ["a", "b", "c"]);
			validate();

			expect(form.value).toMatchObject({
				tags: { value: ["a", "b", "c"], error: "" },
			});
			expect(valid.value).toBe(true);
		});

		it("should support forms with tuple values", () => {
			const { form, valid, assign, validate } = useZodactiveForm(
				opts,
				z.object({
					signal: z.tuple([z.string(), z.boolean(), z.number().min(1)]),
				})
			);

			expect(form.value).toMatchObject({
				signal: { value: ["", false, 0], error: "" },
			});
			expect(valid.value).toBe(false);

			assign("signal", ["", false, 2]);
			validate();

			expect(form.value).toMatchObject({
				signal: { value: ["", false, 2], error: "" },
			});
			expect(valid.value).toBe(true);
		});

		it("should support forms with object values", () => {
			const { form, valid, assign, validate } = useZodactiveForm(
				opts,
				z.object({
					user: z.object({ name: z.string().min(1), age: z.number().min(1) }),
				})
			);

			const match = {
				user: {
					name: { value: "", error: "" },
					age: { value: 0, error: "" },
				},
			};

			const match2 = {
				user: {
					name: { value: "a", error: "" },
					age: { value: 1, error: "" },
				},
			};

			expect(form.value).toMatchObject(match);
			expect(valid.value).toBe(false);

			assign("user.name", "a");
			assign(["user", "age"], 1);
			validate();

			expect(form.value).toMatchObject(match2);
			expect(valid.value).toBe(true);
		});
	});

	describe("when validating", () => {
		it("should be valid when optional fields are missing", () => {
			const { form, valid, assign, validate } = useZodactiveForm(
				opts,
				z.object({
					title: z.string().min(3),
					slug: z.string().min(3).optional(),
				})
			);

			expect(form.value).toMatchObject({ title: { value: "", error: "" } });
			assign("title", "Hello");
			validate();
			expect(valid.value).toBe(true);
		});

		it("should be valid when optional fields are not provided, but assigned to", () => {
			const schema = z.object({
				title: z.string().min(3),
				slug: z.string().min(3).optional(),
			});
			const { form, valid, assign, validate } = useZodactiveForm(opts, schema);

			expect(form.value).toMatchObject({ title: { value: "", error: "" } });

			assign("title", "yes");
			assign("slug", "yes");

			validate();

			expect(valid.value).toBe(true);
		});

		it("should be invalid when optional fields are provided and invalid", () => {
			const schema = z.object({
				title: z.string().min(3),
				slug: z.string().min(3, "3!").optional(),
			});
			const { form, valid, assign, validate } = useZodactiveForm(opts, schema);

			expect(form.value).toMatchObject({ title: { value: "", error: "" } });

			assign("title", "Hello");
			assign("slug", "no");

			validate();

			expect(form.value).toMatchObject({
				title: { value: "Hello", error: "" },
				slug: {
					value: "no",
					error: "3!",
				},
			});
			expect(valid.value).toBe(false);
		});

		it("should be valid when optional fields are provided and valid", () => {
			const schema = z.object({
				title: z.string().min(3),
				slug: z.string().min(3, "3!").optional(),
			});
			const { form, valid, assign, validate } = useZodactiveForm(opts, schema);

			expect(form.value).toMatchObject({ title: { value: "", error: "" } });

			assign("title", "Hello");
			assign("slug", "yes");

			validate();

			expect(form.value).toMatchObject({
				title: { value: "Hello", error: "" },
				slug: { value: "yes", error: "" },
			});
			expect(valid.value).toBe(true);
		});

		it("should be invalid if the schema has a refinement that returns false", () => {
			const schema = z
				.object({
					password: z.string().min(3, "3!"),
					confirmPassword: z.string().min(3, "3!"),
				})
				.refine((obj) => obj.password === obj.confirmPassword, "confirm!");

			const { formErrors, valid, assign, validate } = useZodactiveForm(
				opts,
				schema
			);

			expect(valid.value).toBe(false);

			assign("password", "123");
			assign("confirmPassword", "321");

			validate();
			expect(valid.value).toBe(false);
			expect(formErrors.value).toEqual(["confirm!"]);

			assign("confirmPassword", "123");

			validate();
			expect(valid.value).toBe(true);
			expect(formErrors.value).toEqual([]);
		});
	});
});
