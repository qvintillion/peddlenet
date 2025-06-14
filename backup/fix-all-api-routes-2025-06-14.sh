#!/bin/bash

# Fix all API routes for static export builds
# This script adds the required dynamic export statements

echo "🔧 Fixing API routes for static export builds..."

# List of all API route files that need fixing
routes=(
  "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat/src/app/api/admin/activity/route.ts"
  "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat/src/app/api/admin/broadcast/route.ts"
  "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat/src/app/api/admin/database/route.ts"
  "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat/src/app/api/admin/database/wipe/route.ts"
  "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat/src/app/api/admin/info/route.ts"
  "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat/src/app/api/admin/room/[roomId]/messages/route.ts"
  "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat/src/app/api/admin/room/delete/route.ts"
  "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat/src/app/api/admin/rooms/detailed/route.ts"
  "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat/src/app/api/admin/users/[peerId]/remove/route.ts"
  "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat/src/app/api/admin/users/detailed/route.ts"
  "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat/src/app/api/admin/users/remove/route.ts"
  "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat/src/app/api/admin/users/route.ts"
  "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat/src/app/api/debug/room-codes/route.ts"
  "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat/src/app/api/register-room-code/route.ts"
  "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat/src/app/api/resolve-room-code/[code]/route.ts"
)

fixed_count=0
already_fixed_count=0

for route in "${routes[@]}"; do
  if [[ -f "$route" ]]; then
    # Check if already has dynamic export
    if grep -q "export const dynamic" "$route"; then
      echo "✅ Already fixed: $(basename "$route")"
      ((already_fixed_count++))
    else
      # Create backup
      cp "$route" "${route}.backup-$(date +%Y%m%d-%H%M%S)"
      
      # Add the exports after the last import line
      awk '
        /^import / { import_line = NR }
        END {
          if (import_line > 0) {
            for (i = 1; i <= NF; i++) {
              if (i == import_line + 1) {
                print ""
                print "// Required for static export builds"
                print "export const dynamic = '\''force-dynamic'\'';"
                print "export const revalidate = false;"
              }
              print
            }
          } else {
            print
          }
        }
        { print }
      ' "$route" > "${route}.tmp" && mv "${route}.tmp" "$route"
      
      echo "🔧 Fixed: $(basename "$route")"
      ((fixed_count++))
    fi
  else
    echo "❌ File not found: $route"
  fi
done

echo ""
echo "📊 Summary:"
echo "- Fixed: $fixed_count files"
echo "- Already fixed: $already_fixed_count files"
echo "🎉 Done!"
