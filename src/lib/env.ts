import { z } from 'zod';

const envSchema = z.object({
  // Upstash Redis
  UPSTASH_REDIS_REST_URL: z.string().url({
    message: 'UPSTASH_REDIS_REST_URL must be a valid URL'
  }),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, {
    message: 'UPSTASH_REDIS_REST_TOKEN is required'
  }),

  // ESPN Fantasy
  ESPN_LEAGUE_ID: z.string().min(1, {
    message: 'ESPN_LEAGUE_ID is required'
  }),
  ESPN_SEASON: z.string().regex(/^\d{4}$/, {
    message: 'ESPN_SEASON must be a 4-digit year'
  }),
  ESPN_SWID: z.string().optional(),
  ESPN_S2: z.string().optional(),

  // Vercel Cron
  CRON_SECRET: z.string().optional(),

  // Node env
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  // Use safeParse for better error handling
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    // Use flatten() to get user-friendly error messages
    const errors = result.error.flatten();

    // Create detailed error message
    const errorMessages: string[] = [];

    // Add form-level errors if any
    if (errors.formErrors.length > 0) {
      errorMessages.push(...errors.formErrors);
    }

    // Add field-level errors
    Object.entries(errors.fieldErrors).forEach(([field, messages]) => {
      if (messages && messages.length > 0) {
        errorMessages.push(`${field}: ${messages.join(', ')}`);
      }
    });

    throw new Error(
      `Environment validation failed:\n${errorMessages.join('\n')}`
    );
  }

  return result.data;
}

// Only validate env if not in build phase
// This prevents errors during build when env vars might not be available
let env: Env;

try {
  env = validateEnv();
} catch (error) {
  // In development, show the error but allow the app to continue
  // In production, this will fail the build/startup which is desired
  if (process.env.NODE_ENV === 'development') {
    console.error('Warning: Environment validation failed:', error);
    // Provide dummy values for development
    env = envSchema.parse({
      UPSTASH_REDIS_REST_URL: 'https://dummy.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'dummy_token',
      ESPN_LEAGUE_ID: '1044648461',
      ESPN_SEASON: '2025',
      NODE_ENV: 'development',
    });
  } else {
    throw error;
  }
}

export { env };
