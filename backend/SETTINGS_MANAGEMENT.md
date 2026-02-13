# System Settings Management ✅

## Overview

Super Admins can now configure critical platform parameters **without code changes** through the Settings API. All hardcoded values have been replaced with dynamic, database-backed settings.

### 🎛️ Configurable Settings

| Setting | Key | Default | Description |
|---------|-----|---------|-------------|
| **Commission Rate** | `commission_rate_bp` | 500 (5%) | Ambassador commission in basis points |
| **Customer Discount** | `customer_discount_percent` | 5% | Discount when using referral codes |
| **Commission Hold** | `commission_hold_days` | 14 days | Days before commission available |
| **Max File Size** | `max_file_size_mb` | 5 MB | Maximum upload size |
| **Max Bulk Qty** | `max_bulk_order_qty` | 10,000 | Max quantity per order |
| **Min Order** | `min_order_amount_cents` | 1000 ($10) | Minimum order amount |
| **Payment Timeout** | `payment_timeout_minutes` | 30 min | Payment session expiry |
| **Refund Window** | `refund_window_days` | 14 days | Refund eligibility period |

## 📊 API Endpoints (Super Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get all settings |
| PUT | `/api/settings/:key` | Update a setting |
| PUT | `/api/settings` | Batch update settings |
| POST | `/api/settings/:key/reset` | Reset to default |

## 🔧 Usage Examples

### Get All Settings
```bash
curl http://localhost:8080/api/settings \
  -b cookies.txt
```

### Update Commission Rate to 7%
```bash
curl -X PUT http://localhost:8080/api/settings/commission_rate_bp \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "value": "700",
    "description": "Increased to 7% for Q1 promotion"
  }'
```

### Batch Update Multiple Settings
```bash
curl -X PUT http://localhost:8080/api/settings \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "settings": [
      {
        "key": "commission_rate_bp",
        "value": "600",
        "description": "6% standard rate"
      },
      {
        "key": "customer_discount_percent",
        "value": "10",
        "description": "10% promo discount"
      },
      {
        "key": "commission_hold_days",
        "value": "7",
        "description": "Reduced to 7 days"
      }
    ]
  }'
```

### Reset Setting to Default
```bash
curl -X POST http://localhost:8080/api/settings/commission_rate_bp/reset \
  -b cookies.txt
```

## ⚡ Performance: In-Memory Caching

Settings are **cached in memory** to avoid database queries on every request:

- ✅ **Fast**: No DB hit for each commission calculation
- ✅ **Auto-refresh**: Cache updates when settings change
- ✅ **Fallback**: Uses defaults if database unavailable

## 🔐 Security

- **Super Admin Only**: All settings endpoints protected
- **Audit Trail**: Tracks who updated and when
- **Type Safety**: Validation prevents invalid values

## 📝 How It Works

### 1. Settings Service Architecture
```typescript
// Auto-initialized on first use
await SettingsService.getCommissionRateBp(); // 500

// Super Admin updates
await SettingsService.update('commission_rate_bp', '700', userId);

// Cached value updated instantly
await SettingsService.getCommissionRateBp(); // 700
```

### 2. Dynamic Usage in Business Logic
```typescript
// Before (Hardcoded)
const commissionRate = 500; // ❌ Fixed

// After (Dynamic)
const commissionRate = await SettingsService.getCommissionRateBp(); // ✅ Configurable
```

### 3. Auto-Applied Across Platform
Settings changes **immediately affect**:
- New ambassador approvals (commission rate)
- Referral code validation (customer discount)
- Commission availability calculations (hold period)

## 🎯 Benefits

1. **No Deployments Needed**: Change rates without code changes
2. **A/B Testing**: Test different commission structures
3. **Seasonal Promotions**: Easily adjust discounts  
4. **Fraud Prevention**: Adjust hold periods based on refund patterns
5. **Scalability**: Modify limits as platform grows

## 📋 Adding New Settings

To add a new configurable setting:

1. **Define in types**:
```typescript
// src/types/settings.types.ts
export enum SettingKey {
  MY_NEW_SETTING = 'my_new_setting',
}

export const DEFAULT_SETTINGS = {
  [SettingKey.MY_NEW_SETTING]: {
    value: '100',
    description: 'My setting description',
  },
};
```

2. **Use in code**:
```typescript
const value = await SettingsService.getNumber('my_new_setting');
```

## ⚠️ Important Notes

- **Basis Points**: Commission rate uses BP (500 = 5%)
- **Cache**: Clear cache with `SettingsService.clearCache()` if needed
- **Validation**: Add Zod schemas for complex settings
- **Backwards Compatible**: Defaults ensure old code works

This makes your platform **infinitely more flexible** while maintaining type safety and performance!
