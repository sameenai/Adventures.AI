#!/bin/bash
set -euo pipefail

echo "Seeding database..."
npx tsx prisma/seed.ts
echo "Seed complete."
