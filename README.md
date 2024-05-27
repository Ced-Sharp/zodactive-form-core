[npm]: https://img.shields.io/npm/v/@zodactive-form/core
[npm-url]: https://www.npmjs.com/package/@zodactive-form/core
[size]: https://packagephobia.now.sh/badge?p=@zodactive-form/core
[size-url]: https://packagephobia.now.sh/result?p=@zodactive-form/core
[libera]: https://img.shields.io/badge/libera-manifesto-lightgrey.svg
[libera-url]: https://liberamanifesto.com

<h1 align="center">Zodactive Form</h1>
<h2 align="center">Core</h2>

<p align="center">
    Zodactive Form aims to provide very simple form reactivity
    based on the Zod validation library.
</p>

<p align="center">

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto][libera]][libera-url]

</p>

## Preface

This is not an official Zod library. This is a personal project which is mainly meant
to be used by my other projects. However, you are free to use it if you find it useful.

In addition, this library is under development and not all functionality from zod is
supported yet.

## Description

The core library provides the main logic used in zodactive form. It is not reactive by
itself and requires the use of the proper adapter for the frontend framework being used.

Here is a list of planned adapters (these may not be available yet):

- @zodactive-form/react
- @zodactive-form/preact
- @zodactive-form/solid
- @zodactive-form/qwik
- @zodactive-form/vue
- @zodactive-form/svelte
- @zodactive-form/angular

## Dependencies

This library uses zod to handle validation and my own zod-defaults package to create the
initial state of the form when no initial data is provided.

## Installation

As a simple npm package, it can be installed using your favorite package manager:

```shell
npm install @zodactive-form/core
```

# Usage

Core expects to be provided with factories allowing it to interact with a wide range of different
reactivity systems. The following example shows how to use @zodactive-form/core with svelte.

```svelte
<script lang="ts">
import type { FormEventHandler } from "svelte/elements";
import { z } from "zod";
import { get, writable, type Writable } from "svelte/store";
import { useZodactiveForm, type FormFields } from "@zodactive-form/core";

const userSchema = z.object({
	name: z.string().min(3),
	age: z.number().min(18),
});

const createReactive = () => writable();
const setReactive = <T = unknown>(ref: Writable<T>, value: T) => ref.set(value);
const getReactive = <T = unknown>(ref: Writable<T>): T => get(ref);

const {
	assign,
	form: rawForm,
	validate,
	valid: rawValid,
} = useZodactiveForm({ createReactive, setReactive, getReactive }, userSchema);

const form = rawForm as Writable<FormFields<z.infer<typeof userSchema>>>;
const valid = rawValid as Writable<boolean>;

const handleSubmit = () => {
	if (validate()) {
		// Form is valid!
		// Do fetch() to api, etc
	}
};

const updateForm =
	(path: string, asNumber = false): FormEventHandler<HTMLInputElement> =>
	(ev) =>
		assign(
			path,
			asNumber ? parseFloat(ev.currentTarget.value) : ev.currentTarget.value,
		);
</script>

<p>The form is currently: {$valid ? 'Valid!' : 'Not valid.'}</p>
<form on:submit|preventDefault={handleSubmit}>
  <label>
    <span>Name</span>
    <input type="text" value={$form.name.value} on:input={updateForm('name')} />
    <span class="error">{$form.name.error}</span>
  </label>
  <label>
    <span>Age</span>
    <input type="number" value={$form.age.value} on:input={updateForm('age', true)} />
    <span class="error">{$form.age.error}</span>
  </label>
  <button type="submit">Submit</button>
</form>

<style>
form {
  display: flex;
  flex-flow: column nowrap;
  gap: .5rem;
}

label {
  display: flex;
  flex-flow: column nowrap;
  place-items: flex-start;
}

input {
  width: 100%;
}

form button:last-child {
  margin-top: 1rem;
}
</style>
```

As you can see above, the following is happening:

1. The different factories to access the `writable()` from svelte are created;
2. The `userSchema` zod schema is defined;
3. The zodactive form hook is called with the factories and the schema, generating the reactive `form` and `validate` variables;
4. The form then uses the `.value` and the `.error` to reactively update according to the state of the form;
5. When a value changes, `assign()` is called to properly update the zodactive form;
6. When the form is submitted, `validate()` is called to update the errors based on the zod schema;

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
