import vine from "@vinejs/vine";


export const userRegistrationValidate=vine.object({

        firstName: vine.string().minLength(1).maxLength(100),  // First name between 1-100 chars
        lastName: vine.string().minLength(1).maxLength(100),   // Last name between 1-100 chars
        email: vine.string().email(),                          // Valid email
        password: vine.string().minLength(8).maxLength(150),    // Password between 8-150 chars
})
export const userLoginValidate=vine.object({
    email:vine.string().email(),
    password:vine.string().minLength(8).maxLength(150)
 })