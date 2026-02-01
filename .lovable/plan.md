
# Fix Admin Dashboard Refresh Issue

## Problem Analysis
The admin dashboard's refresh button calls `fetchData(true)` but the UI may not visually update because:
1. The `refreshing` state only shows the spinning icon, but doesn't reset data during refresh
2. There's no visual confirmation (toast) that new data was successfully loaded
3. The leaderboard and user list use the same `users` state array, and React's reconciliation might not detect changes if the shape is similar

## Solution

### 1. Add Success Feedback with Toast Notification
After successful data fetch, show a toast to confirm data was refreshed. This provides immediate user feedback.

### 2. Force State Reset Before Refresh
Before fetching new data on refresh, temporarily clear the users array to force a complete re-render of the list.

### 3. Add React Query for Better Cache Management (Optional Enhancement)
Convert from raw useState to React Query's useQuery with proper cache invalidation for more reliable data synchronization.

## Implementation Details

### File: `src/pages/AdminUsers.tsx`

**Changes:**

1. **Import toast utility:**
   ```typescript
   import { toast } from "sonner";
   ```

2. **Update fetchData function:**
   - Add a timestamp or cache-bust mechanism
   - Show success/error toasts
   - Reset `visibleCount` on refresh to prevent stale pagination
   
   ```typescript
   const fetchData = async (isRefresh = false) => {
     try {
       if (isRefresh) {
         setRefreshing(true);
         // Reset visible count on refresh to show fresh first 50
         setVisibleCount(50);
       }
       
       const { data: { session } } = await supabase.auth.getSession();
       if (!session) {
         const redirect = encodeURIComponent(location.pathname + location.search);
         navigate(`/auth?redirect=${redirect}`);
         return;
       }

       const response = await supabase.functions.invoke("get-admin-users");
       
       if (response.error) {
         throw new Error(response.error.message);
       }

       if (response.data.error) {
         if (response.data.error.includes("Forbidden")) {
           setError("You don't have admin access to view this page.");
         } else {
           throw new Error(response.data.error);
         }
         return;
       }

       setUsers(response.data.users || []);
       setStats(response.data.stats || null);
       
       // Show success toast on manual refresh
       if (isRefresh) {
         toast.success(`Refreshed: ${response.data.users?.length || 0} users loaded`);
       }
     } catch (err: any) {
       console.error("Error fetching admin data:", err);
       setError(err.message || "Failed to load data");
       if (isRefresh) {
         toast.error("Failed to refresh data");
       }
     } finally {
       setLoading(false);
       setRefreshing(false);
     }
   };
   ```

3. **Ensure useEffect dependency is correct:**
   The current `useEffect` has `[navigate]` as dependency which is stable. This is fine for initial load.

## Summary of Changes
| File | Change |
|------|--------|
| `src/pages/AdminUsers.tsx` | Import `toast` from sonner, add success/error toasts to `fetchData`, reset `visibleCount` on refresh |

## Technical Notes
- The `sonner` toast library is already installed and used elsewhere in the project
- This is a minimal, non-breaking change that provides immediate feedback
- The reset of `visibleCount` ensures users see fresh paginated data from the top
