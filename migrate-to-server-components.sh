#!/bin/bash

echo "🔄 Migrating AdaPlanning to Server Components + Cookies architecture..."

# Create backup directory
backup_dir="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$backup_dir"

echo "📦 Creating backups in $backup_dir..."

# Backup current files
cp middleware.ts "$backup_dir/"
cp src/app/layout.tsx "$backup_dir/"  
cp -r src/contexts "$backup_dir/"
cp -r src/app/auth "$backup_dir/"

echo "🔄 Replacing with Server Components versions..."

# Replace files with Server Components versions
mv middleware-server-components.ts middleware.ts
mv src/app/layout-server-components.tsx src/app/layout.tsx
mv src/contexts/AuthContext-server-components.tsx src/contexts/AuthContext.tsx

# Replace auth callback
rm -rf src/app/auth/callback
mv src/app/auth/callback-server-components src/app/auth/callback

# Update page to remove ProtectedRoute (already done)
echo "✅ Files replaced successfully"

echo "📝 Summary of changes:"
echo "  ✅ Middleware: Simplified (no API calls)"
echo "  ✅ Layout: Server Components fetch user data"
echo "  ✅ AuthContext: Simplified client state"
echo "  ✅ Callback: httpOnly cookie management"
echo "  ✅ API Routes: Token & logout management"

echo "🚀 Ready to test! Run 'npm run dev' and visit localhost:3005"
echo "🔗 Authentication flow: localhost:3005 → AdaAuth → callback → app"

echo "📋 Next steps:"
echo "  1. Test authentication flow"
echo "  2. Verify user data displays correctly"
echo "  3. Test logout functionality"
echo "  4. Deploy to production"

echo "✅ Migration complete!"