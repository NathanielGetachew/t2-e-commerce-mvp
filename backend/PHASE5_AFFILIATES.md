# Phase 5 Complete - Affiliates API with Security ✅

## What's Been Built

The Affiliates/Ambassador API is complete with **enterprise-grade security** and fraud prevention.

### 🔒 Security Features Implemented
- **Self-Referral Prevention**: Ambassadors cannot refer themselves
- **Pending Commission Ledger**: 14-day hold before withdrawal
- **Unique Code Validation**: Prevents duplicate ambassador codes
- **Rejected Ambassador Check**: Blocks codes from rejected applicants
- **Transaction Safety**: Database transactions for critical operations

### 🎯 Core Features
- **Ambassador Application**: Submit and review applications
- **Referral Tracking**: Track clicks, conversions, and commissions
- **Custom Codes**: Ambassadors can personalize their codes
- **Commission Calculation**: Automatic calculation based on order totals
- **Stats Dashboard**: Comprehensive metrics for ambassadors

### 📁 New Files Created

**Services:**
- `src/services/affiliate.service.ts` - Business logic with fraud detection (350+ lines)

**Controllers:**
- `src/controllers/affiliate.controller.ts` - Request handlers

**Routes:**
- `src/routes/affiliate.routes.ts` - 9 affiliate endpoints

**Types:**
- `src/types/affiliate.types.ts` - Validation schemas

## 📊 API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/affiliates/validate` | Validate referral code |

### Authenticated User Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/affiliates/apply` | Submit application |
| GET | `/api/affiliates/stats` | Get referral stats |
| PATCH | `/api/affiliates/custom-code` | Update ambassador code |

### Admin Only Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/affiliates/applications` | Get pending applications |
| POST | `/api/affiliates/applications/:id/approve` | Approve application |
| POST | `/api/affiliates/applications/:id/reject` | Reject application |
| GET | `/api/affiliates` | Get all ambassadors |

## 🔒 Security & Fraud Prevention

### 1. Self-Referral Prevention
```typescript
// Fraud check: Ambassador cannot refer themselves
if (order.userId === ambassador.id) {
  logger.warn(`Ambassador ${ambassador.id} attempted self-referral`);
  throw new Error('Ambassadors cannot refer themselves');
}
```

### 2. Pending Commission System
**Commissions are held for 14 days to prevent fraud:**
- Customer places order with referral code
- Commission calculated and recorded as PENDING
- After 14 days (past refund window), status changes to AVAILABLE
- Ambassador can withdraw available commissions

**Implementation:**
```typescript
const fourteenDaysAgo = new Date();
fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

const pendingCommissions = referrals
  .filter(ref => ref.createdAt > fourteenDaysAgo)
  .reduce((sum, ref) => sum + ref.commissionCents, 0);
```

### 3. Rejected Ambassador Protection
```typescript
// Check if ambassador was previously rejected
const rejectedApp = await prisma.ambassadorApplication.findFirst({
  where: {
    userId: ambassador.id,
    status: AmbassadorApplicationStatus.REJECTED,
  },
});

if (rejectedApp) {
  logger.warn(`Attempted use of code from rejected ambassador`);
  return { valid: false };
}
```

### 4. Unique Code Generation
- Auto-generates unique codes: `AMB-JOH-1234`
- Validates uniqueness before assignment
- Up to 10 attempts to find unique code
- Admins can approve or customize codes

## 🧪 Testing Examples

### Submit Ambassador Application
```bash
curl -X POST http://localhost:8080/api/affiliates/apply \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "socialLinks": {
      "instagram": "https://instagram.com/myhandle",
      "tiktok": "https://tiktok.com/@myhandle"
    },
    "whyJoin": "I have a strong social media presence with 10,000+ followers interested in wholesale products.",
    "marketingStrategy": "I plan to create product review videos and share discount codes with my audience."
  }'
```

### Validate Referral Code (Public)
```bash
curl -X POST http://localhost:8080/api/affiliates/validate \
  -H "Content-Type: application/json" \
  -d '{"code": "AMB-JOH-1234"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ambassadorName": "John Doe",
    "discountPercentage": 5
  }
}
```

### Get Ambassador Stats
```bash
curl http://localhost:8080/api/affiliates/stats \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ambassadorCode": "AMB-JOH-1234",
    "commissionRateBp": 500,
    "totalEarnings": 15000,
    "pendingEarnings": 3000,
    "availableForWithdrawal": 12000,
    "metrics": {
      "clicks": 0,
      "conversions": 25,
      "revenueGenerated": 300000
    },
    "recentReferrals": [
      {
        "id": "ref_123",
        "orderNumber": "ORD-2024-001",
        "customerName": "Jane Smith",
        "commissionCents": 1200,
        "status": "available",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

### Update Custom Code
```bash
curl -X PATCH http://localhost:8080/api/affiliates/custom-code \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"customCode": "MYCUSTOMCODE"}'
```

### Approve Application (Admin)
```bash
curl -X POST http://localhost:8080/api/affiliates/applications/APP_ID/approve \
  -b cookies.txt
```

## 📦 Commission Calculation

### How It Works

1. **Customer Uses Code**:
   ```typescript
   // Frontend sends referral code with order
   { referralCode: "AMB-JOH-1234" }
   ```

2. **Backend Validates**:
   ```typescript
   const validation = await AffiliateService.validateReferralCode(code);
   // Returns: { valid: true, ambassadorId, discountPercentage: 5 }
   ```

3. **Order Placed**:
   ```typescript
   // After successful payment
   await AffiliateService.recordCommission(orderId, ambassadorCode);
   ```

4. **Commission Calculated**:
   ```typescript
   const commissionCents = Math.floor(
     (order.totalCents * ambassador.commissionRateBp) / 10000
   );
   // Example: $100 order × 500bp (5%) = $5.00 commission
   ```

5. **Status Tracking**:
   - Days 1-13: `PENDING` (can be refunded)
   - Day 14+: `AVAILABLE` (ready for withdrawal)

## 📊 Metrics Breakdown

### Total Earnings
Sum of all commissions (pending + available)

### Pending Earnings
Commissions from orders less than 14 days old

### Available for Withdrawal
Commissions from orders 14+ days old

### Conversions
Total number of successful referrals

### Revenue Generated
Total order value from all referrals

## ⚠️ Important Notes

1. **Commission Rate**: Default 5% (500 basis points)
2. **Customer Discount**: 5% off when using referral code
3. **Holding Period**: 14 days before commission is available
4. **Fraud Prevention**: No self-referrals, rejected ambassadors blocked
5. **Code Format**: Uppercase letters, numbers, hyphens, underscores only

## 🎯 Integration with Order Flow

**In your order creation endpoint, add:**

```typescript
// After order is created and paid
if (referralCode) {
  try {
    await AffiliateService.recordCommission(order.id, referralCode);
  } catch (error) {
    logger.error('Failed to record commission:', error);
    // Don't fail the order if commission recording fails
  }
}
```

## 🚀 Next: Phase 6 (Coupons + Payment Security)

Final phase will include:
- Coupon management
- **Payment webhook verification** (Chapa/Telebirr)
- Order transaction safety
- Final security hardening

Ready to complete the backend!
