#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

EMAIL_1="${1:-owner1@ourhome.local}"
PASS_1="${2:-secret123}"
EMAIL_2="${3:-owner2@ourhome.local}"
PASS_2="${4:-secret123}"

export DATABASE_URL="${DATABASE_URL:-file:./prisma/dev.db}"

rm -f dev.db prisma/dev.db
npm run db:push

node - "$EMAIL_1" "$PASS_1" "$EMAIL_2" "$PASS_2" <<'NODE'
import { PrismaClient } from '@prisma/client';
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const prisma = new PrismaClient();

function normalizeName(value) {
  return value.trim().toLocaleLowerCase('pt-BR');
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${Buffer.from(derived).toString('hex')}`;
}

async function seedUser(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  const household = await prisma.household.create({ data: {} });

  await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      householdId: household.id,
    },
  });

  await prisma.account.create({
    data: {
      householdId: household.id,
      name: 'Conta Principal',
      type: 'CHECKING',
      openingBalance: '0.00',
    },
  });

  await prisma.creditCard.create({
    data: {
      householdId: household.id,
      name: 'Cartao Principal',
      closeDay: 5,
      dueDay: 12,
    },
  });

  const defaults = ['Moradia', 'Alimentacao', 'Transporte', 'Saude', 'Lazer'];
  for (const category of defaults) {
    await prisma.category.create({
      data: {
        householdId: household.id,
        name: category,
        normalized: normalizeName(category),
      },
    });
  }
}

const [email1, pass1, email2, pass2] = process.argv.slice(2);

await seedUser(email1, pass1);
if (email2 && pass2 && email2 !== email1) {
  await seedUser(email2, pass2);
}

await prisma.$disconnect();
NODE

echo "Database reset complete."
echo "User A: $EMAIL_1 / $PASS_1"
if [[ "$EMAIL_2" != "$EMAIL_1" ]]; then
  echo "User B: $EMAIL_2 / $PASS_2"
fi
