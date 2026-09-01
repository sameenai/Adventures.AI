#!/bin/bash
set -euo pipefail

echo "Running Prisma migrations..."
npx prisma migrate dev "$@"
echo "Migrations complete."
