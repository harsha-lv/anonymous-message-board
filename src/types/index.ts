import type { QueryResultRow } from 'pg';

export type MembershipStatus = 'non_member' | 'member' | 'admin';

/** A user as stored in PostgreSQL (includes the password hash). */
export interface UserRecord extends QueryResultRow {
  id: number;
  full_name: string;
  username: string;
  email: string;
  password: string;
  membership_status: MembershipStatus;
  is_admin: boolean;
  created_at: Date;
}

/** A user safe to keep in the session / send to views (no password hash). */
export interface UserProfile extends QueryResultRow {
  id: number;
  full_name: string;
  username: string;
  email: string;
  membership_status: MembershipStatus;
  is_admin: boolean;
  created_at: Date;
}

/** A message joined with its author's display name. */
export interface Message extends QueryResultRow {
  id: number;
  title: string;
  text: string;
  timestamp: Date;
  username: string;
  full_name: string | null;
}

/* -------------------------------------------------------------------------- */
/* Request payloads                                                           */
/* -------------------------------------------------------------------------- */

export interface SignUpFormData {
  full_name: string;
  username: string;
  email: string;
}

export interface SignUpBody extends SignUpFormData {
  password: string;
  confirm_password: string;
}

export interface LoginBody {
  username: string;
  password: string;
}

export interface NewMessageFormData {
  title: string;
  text: string;
}

export type NewMessageBody = NewMessageFormData;

export interface PasscodeBody {
  passcode: string;
}

/* -------------------------------------------------------------------------- */
/* View models                                                                */
/* -------------------------------------------------------------------------- */

/** The subset of express-validator errors the EJS templates use. */
export interface FormError {
  path: string;
  msg: string;
}

export interface SignUpViewModel {
  title: string;
  errors: FormError[];
  formData: Partial<SignUpFormData>;
}

export interface LoginViewModel {
  title: string;
  registered: boolean;
}

export interface NewMessageViewModel {
  title: string;
  errors: FormError[];
  formData: Partial<NewMessageFormData>;
}

export interface PasscodeViewModel {
  title: string;
  error: string | null;
}

export interface HomeViewModel {
  title: string;
  dbStatus: string;
  userCount: number;
  messageCount: number;
  messages: Message[];
}

/* -------------------------------------------------------------------------- */
/* Express / Passport augmentation                                           */
/* -------------------------------------------------------------------------- */

declare global {
  namespace Express {
    interface User {
      id: number;
      full_name: string;
      username: string;
      email: string;
      membership_status: MembershipStatus;
      is_admin: boolean;
      created_at: Date;
    }
  }
}
