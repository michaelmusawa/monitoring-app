export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  password: string;
  role: string;
  sector: string;
  status: string;
  createdAt: string;
}

export type UserActionState = {
  errors?: {
    userId?: string[];
    name?: string[];
    email?: string[];
    role?: string[];
    sector?: string[];
  };
  state_error?: string | null;
  message?: string | null;
};

export interface ArchiveActionState {
  /** form-level errors, keyed by field */
  errors?: Partial<Record<string, string[]>>;
  /** a top-level error not tied to a field */
  state_error?: string | null;
  /** a success message */
  message?: string | null;
}

export const initialUserActionState: ArchiveActionState = {
  errors: {},
  state_error: null,
  message: null,
};
