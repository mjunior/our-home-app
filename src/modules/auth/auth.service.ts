import { z } from "zod";

import { prisma } from "../shared/persistence/prisma";
import { AuthError } from "./auth.errors";
import { hashPassword, verifyPassword } from "./password-hasher";

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export interface AuthUserView {
  userId: string;
  email: string;
  householdId: string;
}

const bootstrapCategories = ["Moradia", "Alimentacao", "Transporte", "Saude", "Lazer"];

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

export class AuthService {
  async register(input: { email: string; password: string }): Promise<AuthUserView> {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      throw new AuthError("AUTH_INVALID_INPUT", "AUTH_INVALID_INPUT");
    }

    const db = prisma as any;
    const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      throw new AuthError("AUTH_EMAIL_ALREADY_USED", "AUTH_EMAIL_ALREADY_USED");
    }

    const passwordHash = await hashPassword(parsed.data.password);

    let created: any;
    try {
      created = await db.$transaction(async (tx: any) => {
        const household = await tx.household.create({ data: {} });
        const user = await tx.user.create({
          data: {
            email: parsed.data.email,
            passwordHash,
            householdId: household.id,
          },
        });

        await tx.account.create({
          data: {
            householdId: household.id,
            name: "Conta Principal",
            type: "CHECKING",
            openingBalance: "0.00",
          },
        });

        await tx.creditCard.create({
          data: {
            householdId: household.id,
            name: "Cartao Principal",
            closeDay: 5,
            dueDay: 12,
          },
        });

        for (const category of bootstrapCategories) {
          await tx.category.create({
            data: {
              householdId: household.id,
              name: category,
              normalized: normalizeName(category),
            },
          });
        }

        return user;
      });
    } catch (error: any) {
      if (error?.code === "P2002") {
        throw new AuthError("AUTH_EMAIL_ALREADY_USED", "AUTH_EMAIL_ALREADY_USED");
      }
      throw error;
    }

    return {
      userId: created.id,
      email: created.email,
      householdId: created.householdId,
    };
  }

  async authenticate(input: { email: string; password: string }): Promise<AuthUserView> {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      throw new AuthError("AUTH_INVALID_CREDENTIALS", "AUTH_INVALID_CREDENTIALS");
    }

    const db = prisma as any;
    const user = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) {
      throw new AuthError("AUTH_INVALID_CREDENTIALS", "AUTH_INVALID_CREDENTIALS");
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      throw new AuthError("AUTH_INVALID_CREDENTIALS", "AUTH_INVALID_CREDENTIALS");
    }

    return {
      userId: user.id,
      email: user.email,
      householdId: user.householdId,
    };
  }

  async getUserById(userId: string): Promise<AuthUserView | null> {
    if (!userId.trim()) {
      return null;
    }

    const db = prisma as any;
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      householdId: user.householdId,
    };
  }
}
