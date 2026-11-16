export function toPublicUser(user) {
  if (!user) return null;
  return {
    id: String(user._id ?? user.id),
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
    mustChangePassword: Boolean(user.mustChangePassword),
    lastLoginAt: user.lastLoginAt ?? null,
  };
}

export default toPublicUser;
