import {z} from "zod";

export const registerUserSchema = z.object({
    email: z.email(),
    password: z.string(),
});

export const loginUserSchema = z.object({
    email: z.email(),
    password: z.string(),
});

export const createApiKeySchema = z.object({
  name: z.string().min(3, "Key name must be at least 3 characters").max(50, "Key name too long").trim(),
});
