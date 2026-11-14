import { Role } from "@prisma/client";

export interface AuthenticatedUser {
  userId: string;
  email: string;
  displayName: string;
  role: Role;
  organizationId: string | null;
}
