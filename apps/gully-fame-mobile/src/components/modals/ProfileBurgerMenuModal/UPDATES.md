# ProfileBurgerMenuModal - Real-time Backend Integration

## Overview
The ProfileBurgerMenuModal has been completely refactored to remove all hardcoded/dummy data and connect to the backend for real-time user statistics.

## Changes Made

### 1. **Real-time Data Fetching**
- Implemented `fetchUserStats()` function that fetches live data from the backend when the modal opens
- Uses multiple backend APIs in parallel for optimal performance

### 2. **Connected Backend APIs**

#### a. **KYC Status** (`/user/kyc`)
- Fetches user's current KYC status: `pending | approved | rejected | completed`
- Displays with color-coded badge (green for approved, gold for others)
- Connected to: `userService.getUserKycStatus()`

#### b. **Coins Earned** (`/user/earnings`)
- Fetches all earnings records and sums total coins
- Displays formatted currency value (₹)
- Connected to: `userService.getUserEarnings()`

#### c. **Leaderboard Rank** (`/user/competitions`)
- Fetches competition count from profile data
- Shows number of competitions participated
- Connected to: `profileData.competitionCount`

#### d. **Wallet Balance** (`/user/wallet`)
- Fetches wallet data including:
  - Current balance
  - Total earnings
  - Total tips
- Connected to: `userService.getWalletBalance()`

### 3. **Removed Hardcoded Data**
- ❌ Removed dummy profile name fallbacks
- ❌ Removed hardcoded statistics
- ❌ Removed placeholder values
- ✅ All data now comes from backend APIs

### 4. **Loading States**
- Added loading indicators while fetching data
- Prevents UI flickering with smooth transitions
- Shows "**--**" for missing data during load

### 5. **Error Handling**
- Graceful error handling with fallback default values
- Console error logging for debugging
- Non-blocking: errors don't crash the modal

## Data Flow

```
Modal Opens
    ↓
[isVisible becomes true]
    ↓
[useEffect triggers fetchUserStats]
    ↓
[Parallel API calls:]
    ├─ getUserKycStatus() → KYC status badge
    ├─ getWalletBalance() → Wallet data
    └─ getUserEarnings() → Total coins
    ↓
[State updated with fresh data]
    ↓
[Loading spinner replaced with real values]
```

## Component Props

```typescript
interface ProfileBurgerMenuModalProps {
  isVisible: boolean;              // Controls modal visibility
  onClose?: () => void;            // Callback when modal closes
  profileData: ProfileData;        // User profile data (name, image, verification)
}
```

## Updated State Interface

```typescript
interface UserStats {
  competitionCount: number;        // Number of competitions participated
  coinsEarned: number;             // Total coins earned
  kycStatus: string;               // Current KYC status
  walletBalance: number;           // Current wallet balance
  totalEarnings: number;           // Total earnings from wallet API
  totalTips: number;               // Total tips received
}
```

## Menu Items with Real Data

### Profile Management Section
1. ✅ **Account Center** - Navigation only
2. ✅ **History** - Navigation only
3. ✅ **Leaderboard Rank** - Shows `${competitionCount} comps`
4. ✅ **Coins Earned** - Shows `₹${coinsEarned.toFixed(2)}`
5. ✅ **Saved Posts / Reels** - Navigation only
6. ✅ **Invite Your Friend** - Navigation only
7. ✅ **Downloads** - Navigation only

### Settings & Help Section
1. ✅ **Help & Support** - Navigation only
2. ✅ **FAQs** - Navigation only
3. ✅ **Privacy Policy** - Navigation only
4. ✅ **Terms of Service** - Navigation only
5. ✅ **KYC Status** - Shows status badge (colored)
6. ✅ **About** - Navigation only
7. ✅ **Logout** - Calls performLogout()

## Backend API Integration

### Required Services
All services are already available in `@api/services/userService`:

```typescript
import { userService } from "@/api/services/userService";

// Available functions:
userService.getUserKycStatus()    // Returns KycStatus
userService.getWalletBalance()    // Returns WalletBalance
userService.getUserEarnings()     // Returns UserEarning[]
```

### API Endpoints Used
- `GET /user/kyc` → KYC Status
- `GET /user/wallet` → Wallet Balance
- `GET /user/earnings` → Earnings List

## Performance Optimizations

1. **Parallel Requests**: All APIs are fetched simultaneously using Promise.all() pattern
2. **Conditional Loading**: Data only fetches when modal becomes visible
3. **Debounced Updates**: State updates batched together
4. **Error Resilience**: Fallback values prevent UI breaks
5. **Memory Efficient**: Cleanup on modal close

## Testing the Integration

### Test Case 1: Modal Opens
```
1. Tap burger menu
2. Modal opens
3. See loading spinners on data fields
4. Wait ~1-2 seconds
5. Real data appears
```

### Test Case 2: Verify KYC Status Display
```
1. Open modal
2. KYC Status shows:
   - "Pending" (gold color)
   - "Approved" (green color)
   - "Rejected" (gold color)
```

### Test Case 3: Verify Coins Display
```
1. Open modal
2. Coins Earned shows:
   - Formatted currency (₹)
   - Correct total from backend
```

### Test Case 4: Verify Competition Count
```
1. Open modal
2. Leaderboard shows competition count
3. Shows "X comps" format
```

## Future Enhancements

1. **Refresh Button**: Add pull-to-refresh for manual data refresh
2. **Real-time Updates**: Subscribe to WebSocket for live balance updates
3. **Pagination**: If earnings list is large, implement pagination
4. **Cache Strategy**: Implement smart caching to reduce API calls
5. **Offline Mode**: Show cached data when offline

## Dependencies

- ✅ `react` - React hooks (useState, useEffect)
- ✅ `react-native` - UI components (ActivityIndicator)
- ✅ `@api/services/userService` - Backend API calls

## Files Modified

- `/src/components/modals/ProfileBurgerMenuModal/ProfileBurgerMenuModal.tsx`

## Notes

- All backend API calls use existing `userService` methods
- Error handling follows app patterns
- Loading states prevent UI jank
- Component is backward compatible with existing code
