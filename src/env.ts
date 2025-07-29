import { z } from "zod";

const PORT = 9000;

const EnvSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.coerce.number().default(PORT),
    POSTGRES_PORT: z.coerce.number(),
    POSTGRES_HOST: z.string().default("localhost"),
    POSTGRES_DB: z.string(),
    POSTGRES_PASSWORD: z.string(),
    POSTGRES_USER: z.string(),
    SERVER_URL: z.string().optional(),
    TOKEN: z.string().optional(),
    MSAL_CLIENT_ID: z.uuid(),
    MSAL_TENANT_ID: z.uuid(),
    MSAL_CLIENT_SCOPE: z.string(),
    MSAL_CLIENT_SECRET: z.string(),
    MSAL_REDIRECT_URL: z.url().default(`http://localhost:${PORT}/login/callback`)
  })
  .refine(
    (data) =>
      data.NODE_ENV !== "production" ||
      (data.NODE_ENV === "production" && data.SERVER_URL),
    {
      message:
        "When NODE_ENV is set to 'production', SERVER_URL must be provided to the environment.",
      path: ["SERVER_URL"],
    }
  )
  .refine((data) => data.NODE_ENV === "development" || data.TOKEN, {
    message:
      "TOKEN must be provided to the environment if NODE_ENV is anything other than 'development'.",
    path: ["TOKEN"],
  });
export type env = z.infer<typeof EnvSchema>;

const { data: env, error } = EnvSchema.safeParse(process.env);

if (error) {
  console.error("❌ Invalid env:");
  console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export default env!;
