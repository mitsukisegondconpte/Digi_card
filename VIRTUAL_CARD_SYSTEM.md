# Virtual Card System - Complete Implementation Guide

## 🎯 Product Overview

**Concept**: Allow users to create virtual cards directly from their wallet for online payments.

**Target Users**: 
- Students (no international cards)
- Freelancers (secure payments)
- Young professionals (privacy-first)

**Key Differentiators**:
- ✅ Instant creation (< 30 seconds)
- ✅ Multiple card types (limited, single-use, permanent)
- ✅ OTP protection on every transaction
- ✅ Block/delete anytime
- ✅ Real-time balance tracking

---

## 📱 User Flows

### Flow 1: Creating a Card (5 min)
```
Dashboard 
  ↓ [Click "Create Card"]
Choose Type Screen
  ↓ [Select: Limited / Single-use / Permanent]
Set Amount & Limit
  ↓ [Slider: 10-500 HTG]
Set Duration (if limited)
  ↓ [7/30/90 days]
Review & Confirm
  ↓ [Show full preview]
Enter PIN for Confirmation
  ↓ [OTP sent to phone]
Success Screen
  ↓ [Show card number, expiry, CVV]
Dashboard (card now active)
```

### Flow 2: Using a Card
```
User initiates payment on external site
  ↓ [Enters card number]
Payment request reaches our system
  ↓ [Tokenize if PCI-DSS required]
OTP sent to user's phone
  ↓ [SMS: "Confirm HTG 50 payment to Netflix?"]
User confirms OTP
  ↓ [Backend validates]
Payment processed
  ↓ [Deduct from card balance]
Real-time update in wallet
  ↓ [User sees "Last used: now"]
```

### Flow 3: Blocking a Card
```
Dashboard → Select Card
  ↓
Detail Screen
  ↓ [Click "Block Card"]
Confirmation dialog
  ↓ [Are you sure?]
Card status → "blocked"
  ↓ [Future transactions rejected]
Notification to user
```

---

## 🗄️ Supabase Database Schema

### Table: `virtual_cards`
```sql
CREATE TABLE virtual_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Card Details
  name TEXT NOT NULL,
  card_number_encrypted TEXT NOT NULL, -- Store encrypted
  card_expiry TEXT NOT NULL, -- MM/YY
  card_cvv_encrypted TEXT NOT NULL, -- Store encrypted
  
  -- Financial
  initial_amount DECIMAL(10, 2) NOT NULL,
  current_balance DECIMAL(10, 2) NOT NULL,
  spend_limit DECIMAL(10, 2), -- NULL if permanent
  amount_spent DECIMAL(10, 2) DEFAULT 0,
  
  -- Type & Duration
  card_type TEXT NOT NULL, -- 'limited' | 'single-use' | 'permanent'
  duration_days INTEGER, -- NULL if permanent
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  
  -- Status & Security
  status TEXT DEFAULT 'active', -- 'active' | 'blocked' | 'expired'
  is_locked BOOLEAN DEFAULT FALSE,
  last_used_at TIMESTAMP,
  transaction_count INTEGER DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_cards ON virtual_cards(user_id);
CREATE INDEX idx_card_status ON virtual_cards(status);
```

### Table: `virtual_card_transactions`
```sql
CREATE TABLE virtual_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES virtual_cards(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Transaction Details
  merchant_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'HTG',
  transaction_type TEXT, -- 'charge' | 'refund'
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending' | 'completed' | 'failed' | 'reversed'
  status_reason TEXT,
  
  -- Security
  otp_verified BOOLEAN DEFAULT FALSE,
  otp_attempts INTEGER DEFAULT 0,
  ip_address INET,
  user_agent TEXT,
  
  -- Metadata
  external_ref TEXT, -- Payment gateway reference
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_card_transactions ON virtual_card_transactions(card_id);
```

### Table: `virtual_card_security_logs`
```sql
CREATE TABLE virtual_card_security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES virtual_cards(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Log Details
  event_type TEXT NOT NULL, -- 'blocked' | 'limit_exceeded' | 'otp_failed' | 'suspicious_pattern'
  event_description TEXT,
  severity TEXT, -- 'info' | 'warning' | 'critical'
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 Security Architecture

### 1. Data Encryption
```javascript
// Frontend: Never log sensitive data
const sensitiveFields = ['card_number', 'cvv', 'pin'];

// Backend: AES-256 encryption for card data
const encryptCardNumber = (cardNumber, key) => {
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  return cipher.update(cardNumber) + cipher.final();
};
```

### 2. OTP Protection (Mandatory)
```javascript
// Every transaction requires OTP
POST /api/virtual-cards/verify-transaction
{
  "transaction_id": "tx_123",
  "otp_code": "123456",
  "user_id": "user_123"
}

Response: {
  "verified": true,
  "transaction_status": "completed",
  "balance_updated": 450.50
}
```

### 3. Fraud Detection
```javascript
// Rules:
- Block if 3+ failed OTPs in 10 minutes
- Block if amount > 2x user's avg transaction
- Block if transaction from new IP
- Block if transaction frequency > 10/hour
- Alert user if balance < 5% of limit
```

### 4. PCI-DSS Compliance
```javascript
// Never store full card numbers in plain text
// Use tokenization for payment processing
// E2E encryption for card data in transit
// Secure storage: encrypted DB + key rotation
// Log all access to card data
```

---

## 🚀 API Endpoints

### Create Virtual Card
```
POST /api/virtual-cards/create
{
  "name": "Netflix",
  "card_type": "limited",
  "amount": 50,
  "spend_limit": 75,
  "duration_days": 30
}

Response: {
  "id": "vc_abc123",
  "card_number": "4532****8901",
  "expiry": "01/26",
  "cvv": "847",
  "status": "active",
  "created_at": "2025-01-20T10:30:00Z"
}
```

### Get Card Details
```
GET /api/virtual-cards/:id

Response: {
  "id": "vc_abc123",
  "name": "Netflix",
  "card_number": "4532****8901",
  "balance": 45.99,
  "spent": 4.01,
  "limit": 50,
  "status": "active",
  "last_used": "2025-01-20T08:15:00Z"
}
```

### List User Cards
```
GET /api/virtual-cards?status=active

Response: [
  { ... card 1 ... },
  { ... card 2 ... }
]
```

### Block/Delete Card
```
PUT /api/virtual-cards/:id/block
{
  "reason": "Suspicious activity"
}

DELETE /api/virtual-cards/:id
```

### Get Transactions
```
GET /api/virtual-cards/:id/transactions?limit=20

Response: [
  {
    "id": "tx_123",
    "merchant": "Netflix",
    "amount": 15.99,
    "status": "completed",
    "date": "2025-01-20T08:15:00Z"
  }
]
```

### Verify OTP
```
POST /api/transactions/:id/verify-otp
{
  "otp": "123456"
}

Response: {
  "verified": true,
  "transaction_status": "completed"
}
```

---

## 💾 Backend Implementation (Node.js + Express)

```javascript
// server.js
const express = require('express');
const crypto = require('crypto');
const supabase = require('@supabase/supabase-js');

const app = express();
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// === CREATE CARD ===
app.post('/api/virtual-cards/create', async (req, res) => {
  const { name, card_type, amount, spend_limit, duration_days } = req.body;
  const user_id = req.user.id; // From auth middleware

  try {
    // Validate user balance
    const { data: wallet } = await db
      .from('wallets')
      .select('balance')
      .eq('user_id', user_id)
      .single();

    if (wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Generate card details
    const cardNumber = generateCardNumber(); // 4532 + random
    const expiry = calculateExpiry(card_type, duration_days);
    const cvv = generateCVV();

    // Encrypt sensitive data
    const encryptedNumber = encryptAES256(cardNumber, process.env.ENCRYPTION_KEY);
    const encryptedCVV = encryptAES256(cvv, process.env.ENCRYPTION_KEY);

    // Create card in DB
    const { data: newCard, error } = await db
      .from('virtual_cards')
      .insert({
        user_id,
        name,
        card_number_encrypted: encryptedNumber,
        card_expiry: expiry,
        card_cvv_encrypted: encryptedCVV,
        initial_amount: amount,
        current_balance: amount,
        spend_limit,
        card_type,
        duration_days,
        expires_at: calculateExpiryDate(card_type, duration_days)
      })
      .select();

    if (error) throw error;

    // Deduct from wallet balance
    await db
      .from('wallets')
      .update({ balance: wallet.balance - amount })
      .eq('user_id', user_id);

    // Log security event
    await db.from('virtual_card_security_logs').insert({
      card_id: newCard[0].id,
      user_id,
      event_type: 'created',
      severity: 'info'
    });

    res.json({
      id: newCard[0].id,
      card_number: maskCardNumber(cardNumber),
      expiry,
      cvv, // Only show once at creation
      status: 'active',
      balance: amount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === GET CARD DETAILS ===
app.get('/api/virtual-cards/:id', async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const { data: card, error } = await db
      .from('virtual_cards')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id)
      .single();

    if (error || !card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Don't return encrypted data
    res.json({
      id: card.id,
      name: card.name,
      card_number: maskCardNumber(card.card_number_encrypted),
      expiry: card.card_expiry,
      balance: card.current_balance,
      spent: card.amount_spent,
      limit: card.spend_limit,
      status: card.status,
      type: card.card_type,
      created_at: card.created_at,
      expires_at: card.expires_at,
      last_used: card.last_used_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === LIST CARDS ===
app.get('/api/virtual-cards', async (req, res) => {
  const user_id = req.user.id;
  const { status } = req.query;

  try {
    let query = db
      .from('virtual_cards')
      .select('*')
      .eq('user_id', user_id);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: cards, error } = await query;

    if (error) throw error;

    res.json(cards.map(card => ({
      id: card.id,
      name: card.name,
      card_number: maskCardNumber(card.card_number_encrypted),
      balance: card.current_balance,
      spent: card.amount_spent,
      limit: card.spend_limit,
      status: card.status,
      created_at: card.created_at
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === VERIFY OTP & PROCESS TRANSACTION ===
app.post('/api/transactions/:id/verify-otp', async (req, res) => {
  const { id: txId } = req.params;
  const { otp } = req.body;
  const user_id = req.user.id;

  try {
    // Get transaction
    const { data: tx, error: txError } = await db
      .from('virtual_card_transactions')
      .select('*')
      .eq('id', txId)
      .eq('user_id', user_id)
      .single();

    if (txError || !tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Verify OTP
    const isOtpValid = await verifyOTP(user_id, otp);
    if (!isOtpValid) {
      // Increment failed attempts
      await db
        .from('virtual_card_transactions')
        .update({ otp_attempts: tx.otp_attempts + 1 })
        .eq('id', txId);

      // Block if 3+ failures
      if (tx.otp_attempts >= 3) {
        await db
          .from('virtual_cards')
          .update({ status: 'blocked' })
          .eq('id', tx.card_id);

        await db.from('virtual_card_security_logs').insert({
          card_id: tx.card_id,
          user_id,
          event_type: 'otp_failed',
          severity: 'critical'
        });
      }

      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Mark transaction as completed
    await db
      .from('virtual_card_transactions')
      .update({ 
        status: 'completed',
        otp_verified: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', txId);

    // Update card balance & spent
    const { data: card } = await db
      .from('virtual_cards')
      .select('*')
      .eq('id', tx.card_id)
      .single();

    await db
      .from('virtual_cards')
      .update({
        current_balance: card.current_balance - tx.amount,
        amount_spent: card.amount_spent + tx.amount,
        last_used_at: new Date().toISOString(),
        transaction_count: card.transaction_count + 1
      })
      .eq('id', tx.card_id);

    res.json({ verified: true, status: 'completed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === BLOCK CARD ===
app.put('/api/virtual-cards/:id/block', async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const { error } = await db
      .from('virtual_cards')
      .update({ status: 'blocked', is_locked: true })
      .eq('id', id)
      .eq('user_id', user_id);

    if (error) throw error;

    await db.from('virtual_card_security_logs').insert({
      card_id: id,
      user_id,
      event_type: 'blocked_by_user',
      severity: 'info'
    });

    res.json({ status: 'blocked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === DELETE CARD ===
app.delete('/api/virtual-cards/:id', async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    // Only delete if balance is back to 0 (optional rule)
    const { data: card } = await db
      .from('virtual_cards')
      .select('*')
      .eq('id', id)
      .single();

    if (card.current_balance > 0) {
      // Refund balance to main wallet
      const { data: wallet } = await db
        .from('wallets')
        .select('balance')
        .eq('user_id', user_id)
        .single();

      await db
        .from('wallets')
        .update({ balance: wallet.balance + card.current_balance })
        .eq('user_id', user_id);
    }

    await db
      .from('virtual_cards')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);

    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === HELPER FUNCTIONS ===
function generateCardNumber() {
  return '4532' + Math.random().toString().slice(2, 12) + Math.random().toString().slice(2, 6);
}

function generateCVV() {
  return Math.floor(Math.random() * 900) + 100;
}

function maskCardNumber(encrypted) {
  // Decrypt first, then mask (or mask encrypted)
  return '4532 **** **** ' + encrypted.slice(-4);
}

function encryptAES256(data, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + encrypted;
}

function decryptAES256(encrypted, key) {
  const iv = Buffer.from(encrypted.slice(0, 32), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
  let decrypted = decipher.update(encrypted.slice(32), 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function calculateExpiry(type, days) {
  const now = new Date();
  let expDate;
  
  if (type === 'permanent') {
    expDate = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
  } else {
    expDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }
  
  return `${String(expDate.getMonth() + 1).padStart(2, '0')}/${String(expDate.getFullYear()).slice(-2)}`;
}

function calculateExpiryDate(type, days) {
  if (type === 'permanent') {
    return new Date(new Date().getFullYear() + 2, new Date().getMonth(), new Date().getDate());
  }
  return new Date(new Date().getTime() + days * 24 * 60 * 60 * 1000);
}

async function verifyOTP(userId, otp) {
  // Compare with OTP sent via SMS (implement your SMS service)
  // e.g., Twilio, AWS SNS
  const { data: otpRecord } = await db
    .from('otp_codes')
    .select('*')
    .eq('user_id', userId)
    .eq('code', otp)
    .gt('expires_at', new Date().toISOString())
    .single();

  return !!otpRecord;
}

app.listen(3000, () => console.log('Virtual Card API running on :3000'));
```

---

## 🎨 UI/UX Design Highlights

### Color Scheme
- **Primary**: Red (#EF4444) - Action, important
- **Secondary**: Blue (#3B82F6) - Info, trust
- **Success**: Green (#22C55E) - Confirmations
- **Neutral**: Gray scale - Structure

### Typography
- **Headers**: Inter Bold 16-24px
- **Body**: Inter Regular 14px
- **Numbers**: Mono (card numbers, amounts)

### Component Spacing
- Padding: 16px default
- Gap between elements: 12px
- Border radius: 12px (cards), 8px (buttons)

### Micro-interactions
- Hover states on all clickable elements
- Smooth transitions (150-200ms)
- Loading states for async actions
- Toast notifications for confirmations

---

## 📊 Metrics to Track

### User Metrics
- Cards created per user
- Avg card lifetime
- Reuse rate by card type
- Conversion: View → Create

### Financial Metrics
- Total value locked in virtual cards
- Transaction volume per card
- Average transaction value
- Refund rate

### Security Metrics
- Failed OTP attempts
- Blocked cards (reasons)
- Fraudulent transactions detected
- User block/unlock ratio

---

## 🚀 Rollout Plan

### Phase 1 (Week 1-2): Beta
- Limited to 100 users
- Manual approval of large transactions
- Daily monitoring

### Phase 2 (Week 3-4): Soft Launch
- 1,000 users
- In-app onboarding
- Support team on standby

### Phase 3 (Month 2): Full Launch
- All users
- Feature complete
- Marketing push

---

## 🔗 Integration Points

### Payment Gateways
- Stripe Connect (for payments)
- PayPal (alternative)
- Local providers (Digicel)

### SMS Service
- Twilio (OTP)
- AWS SNS (backup)

### Email Service
- SendGrid (confirmations)

### Analytics
- Segment (tracking)
- Mixpanel (funnels)

---

## ❓ FAQ Implementation

**Q: What happens to funds if card expires?**
A: Remaining balance is automatically returned to main wallet.

**Q: Can I change the limit after creation?**
A: No, but you can delete and create a new one.

**Q: How long does card creation take?**
A: Instant (~2-3 seconds).

**Q: What if I lose the card number?**
A: Check the "My Cards" section — it's always there.

**Q: Can merchants see my real card?**
A: No, they only see the virtual card number.

---

## ⚠️ Risk Management

| Risk | Mitigation |
|------|-----------|
| Fraud | OTP + IP validation + transaction limits |
| Data breach | AES-256 encryption + key rotation |
| User confusion | Clear onboarding + in-app tooltips |
| Abuse (limits) | Transaction caps + rate limiting |
| Refund disputes | Transaction logs + proof of payment |

---

## 🔗 References & Standards

- PCI-DSS Level 1 (for card data)
- OWASP Top 10 (security)
- ISO 27001 (data protection)
- Stripe API design (as inspiration)
