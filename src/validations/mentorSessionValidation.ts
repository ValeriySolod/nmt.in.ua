import Joi from "joi";

/** JSON body of POST /api/admin/sessions. Unknown keys are rejected. */
export const createMentorSessionSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  themeId: Joi.number().integer().positive().required(),
});
