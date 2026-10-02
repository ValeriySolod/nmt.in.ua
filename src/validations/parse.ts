import Joi from "joi";

export const joiOptions: Joi.ValidationOptions = {
  abortEarly: true,
  allowUnknown: false,
  stripUnknown: false,
  convert: true,
  errors: { wrap: { label: false } },
};

export function validateSchema<T>(
  schema: Joi.ObjectSchema<T>,
  value: unknown,
  options: Joi.ValidationOptions = joiOptions,
): { ok: true; value: T } | { ok: false; detail: Joi.ValidationErrorItem } {
  const result = schema.validate(value, options);
  if (result.error) {
    const detail = result.error.details[0];
    return {
      ok: false,
      detail: detail ?? {
        message: "Validation failed",
        path: [],
        type: "any.invalid",
      },
    };
  }
  return { ok: true, value: result.value as T };
}
