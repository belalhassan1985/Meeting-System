# Deployment Checklist - UserRole Fix

## ✅ Changes Made

### 1. UserRole Enum Values (lowercase 'admin')
- ✅ `packages/shared/src/types.ts` → `ADMIN = 'admin'`
- ✅ `apps/api/src/entities/user.entity.ts` → `ADMIN = 'admin'`

### 2. Service Updates
- ✅ `apps/api/src/services/admin.service.ts` → Uses `UserRole.ADMIN`
- ✅ `apps/api/src/services/room.service.ts` → Checks `user.role === 'admin'`
- ✅ `apps/api/src/services/user.service.ts` → Imports `UserRole` correctly

### 3. Frontend Updates
- ✅ `apps/web/src/components/custom-video-conference.tsx` → Supports `UserRole.ADMIN`

### 4. Migration Removed
- ✅ `apps/api/src/main.ts` → Removed automatic migration (not needed)

## 🔍 Expected Database Values

Users table should have:
```sql
role = 'admin'  -- lowercase for admin users
role = 'user'   -- lowercase for regular users
```

## 🚀 Deployment Steps

1. **Commit changes:**
   ```bash
   git add .
   git commit -m "fix: Use lowercase 'admin' role consistently across all packages"
   git push
   ```

2. **Wait for Coolify deployment** (2-5 minutes)

3. **Clear browser cache** after deployment

4. **Test endpoints:**
   - GET `/admin/admin-users` - Should return admin users
   - POST `/rooms/{id}/join` - Should work for admin users
   - Video conference - Admin controls should appear

## 🐛 If Still Getting 500 Errors

Check Coolify logs for:
- Build errors
- Runtime errors
- Database connection issues
- Environment variables (LIVEKIT_API_KEY, LIVEKIT_API_SECRET)

## 📝 Key Points

- All enum values use lowercase: `'admin'`, `'user'`
- Database already has lowercase values (no migration needed)
- Shared package must be rebuilt before API and Web
- Browser cache may need clearing after deployment
