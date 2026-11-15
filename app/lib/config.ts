const FALSE_VALUES = new Set(["false", "off", "0", "no"]);

function flag(name: string, defaultValue: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) {
    return defaultValue;
  }
  return !FALSE_VALUES.has(value);
}

export function signupEnabled(): boolean {
  return flag("SIGNUP_ENABLED", true);
}

export function billingEnabled(): boolean {
  return flag("BILLING_ENABLED", true);
}

export function loginHint(): { email: string; password: string } | null {
  const email = process.env.LOGIN_HINT_EMAIL?.trim();
  const password = process.env.LOGIN_HINT_PASSWORD;
  return email && password ? { email, password } : null;
}
