# Testnet Testing Guide

This guide will help you test the Stacky wallet on testnets before deploying to production.

## Prerequisites

Before testing, ensure you have:
- ✅ Expo notifications configured (app.json)
- ✅ Test wallet with funds
- ✅ Physical device (for push notifications)
- ✅ Alchemy API key configured

## Step 1: Get Testnet Funds

### Sepolia Testnet (Ethereum)

**Option 1: Alchemy Faucet** (Recommended)
1. Visit: https://sepoliafaucet.com/
2. Login with your Alchemy account
3. Enter your wallet address from the app
4. Get 0.5 SepoliaETH per day

**Option 2: Infura Faucet**
1. Visit: https://www.infura.io/faucet/sepolia
2. Login with GitHub
3. Get 0.5 SepoliaETH per day

**Option 3: QuickNode Faucet**
1. Visit: https://faucet.quicknode.com/ethereum/sepolia
2. Get 0.05 SepoliaETH instantly

### Polygon Amoy Testnet (Recommended for DeFi testing)

**Option 1: Alchemy Polygon Faucet**
1. Visit: https://www.alchemy.com/faucets/polygon-amoy
2. Get 0.5 MATIC per day

**Option 2: Official Polygon Faucet**
1. Visit: https://faucet.polygon.technology/
2. Select Amoy Testnet
3. Get test MATIC

## Step 2: Configure Your Wallet for Testnet

1. **Open the app**
2. **Switch to testnet**:
   - Tap the chain switcher on home screen
   - Enable "Testnet Mode" toggle
   - Select either Sepolia or Polygon Amoy

3. **Verify testnet mode**:
   - You should see a warning banner
   - Balance should show testnet currency

## Step 3: Test Receive Flow

### Test QR Code Generation

1. **Navigate to Receive screen**:
   - Tap "Receive" quick action on home screen

2. **Verify QR code**:
   - QR code should display your wallet address
   - Format: `ethereum:0x...`

3. **Test copy address**:
   - Tap "Copy Address" button
   - Should see "Copied!" confirmation
   - Paste in notes app to verify

4. **Test share**:
   - Tap "Share" button
   - Share via Messages/Email
   - Verify address is correct

### Receive Test Funds

1. Copy your address from Receive screen
2. Visit a faucet (see Step 1)
3. Request testnet funds
4. **Wait 30-60 seconds** for confirmation
5. **Pull to refresh** on home screen
6. Verify balance updated

## Step 4: Test Send Flow

### Test Transaction Preview

1. **Navigate to Send screen**:
   - Tap "Send" quick action on home screen

2. **Test address validation**:
   ```
   ✅ Valid: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
   ❌ Invalid: 0x123 (too short)
   ❌ Invalid: not-an-address
   ```

3. **Test QR scanner**:
   - Tap QR icon
   - Allow camera permission
   - Scan a test QR code
   - Verify address fills in correctly

4. **Test amount input**:
   ```
   Small test: 0.001
   Medium test: 0.01
   Large test: 0.1
   ```

5. **Test MAX button**:
   - Tap "MAX"
   - Verify it reserves gas (amount < total balance)

6. **Verify transaction preview**:
   - Should show gas fee in USD
   - Should show gas price in Gwei
   - Should show total cost (amount + gas)
   - Should update in real-time

### Execute Test Transaction

**Test Address (Safe)**: `0x0000000000000000000000000000000000000000`

1. Enter test address
2. Enter small amount (0.001)
3. Wait for preview to load
4. Review warnings
5. **Tap Send**
6. **Confirm transaction**

Expected result:
- ✅ Transaction submitted
- ✅ Redirects to home/activity
- ✅ Shows pending transaction
- ✅ Confirms after ~15 seconds (Sepolia) or ~2 seconds (Polygon)

### Test Edge Cases

**Test 1: Insufficient balance**
- Try to send more than you have
- Should show warning: "Insufficient balance"
- Send button should be disabled

**Test 2: High gas fee**
- During network congestion
- Should show warning: "High gas fee: $X.XX"
- Can still send if desired

**Test 3: Invalid recipient**
- Enter invalid address
- Should show red border
- Error message: "Invalid address format"
- Send button disabled

## Step 5: Test Push Notifications

### Setup

1. **Run on physical device** (emulators don't support push)
2. **Allow notifications** when prompted
3. **Keep app in background** for testing

### Test Scenarios

**Test 1: Transaction Confirmed**
```typescript
// Trigger manually from code for testing
await notifyTransactionConfirmed({
  transactionHash: '0x...',
  type: 'Send',
  amount: '0.01',
  token: 'ETH',
});
```

Expected:
- ✅ Notification appears
- ✅ Shows transaction type
- ✅ Shows amount and token
- ✅ Plays sound
- ✅ Tap opens app to activity screen

**Test 2: Limit Order Executed** (after contracts deployed)
```typescript
await notifyLimitOrderExecuted({
  orderId: '1',
  tokenIn: 'USDC',
  tokenOut: 'ETH',
  amountIn: '100',
  amountOut: '0.05',
  price: '2000',
  transactionHash: '0x...',
});
```

Expected:
- ✅ Notification: "Limit Order Executed! 🎯"
- ✅ Shows swap details
- ✅ Tap opens to positions screen

## Step 6: Test Position Tracking

### Prerequisites
- Contracts must be deployed to testnet
- Contracts addresses updated in `lib/testnet.ts`

### Test Limit Orders

1. **Create test limit order**:
   - Navigate to DeFi → Limit Orders
   - Set token pair (e.g., USDC → ETH)
   - Set target price
   - Set expiration (1 hour for testing)
   - Confirm transaction

2. **Verify on Positions screen**:
   - Navigate to Positions tab
   - Switch to "Limit Orders" tab
   - Should see active order card
   - Verify all details are correct

3. **Test cancel**:
   - Tap "Cancel" on order card
   - Confirm cancellation
   - Order should disappear

### Test DCA Strategies

1. **Create test DCA strategy**:
   - Navigate to DeFi → DCA
   - Set token pair
   - Set amount per interval: 0.01
   - Set interval: 1 hour (for testing)
   - Set max executions: 5
   - Confirm transaction

2. **Verify on Positions screen**:
   - Navigate to Positions tab
   - Switch to "DCA Strategies" tab
   - Should see strategy card
   - Progress bar should show 0/5
   - Next execution time visible

3. **Wait for execution** (1 hour):
   - Should receive push notification
   - Progress updates to 1/5
   - Transaction appears in Activity

4. **Test pause**:
   - Tap "Pause" on strategy card
   - Confirm pause
   - Strategy should pause executions

## Step 7: Integration Testing

### Full User Flow Test

**Scenario**: New user receives funds and creates automation

1. **Setup**:
   - Fresh wallet (or new account)
   - Get testnet funds from faucet

2. **Receive funds**:
   - Open Receive screen
   - Request funds from faucet
   - Verify balance updates

3. **Create limit order**:
   - Navigate to DeFi → Limit Orders
   - Create order with half of balance
   - Verify gas estimation
   - Confirm transaction

4. **Monitor position**:
   - Check Positions tab
   - Verify order appears
   - Enable notifications if prompted

5. **Simulate execution** (or wait for price):
   - Order executes when price hits target
   - Receive push notification
   - Check Activity for transaction
   - Verify tokens received

6. **Create DCA**:
   - Use remaining balance
   - Set up 3 purchases over 3 hours
   - Monitor first execution

7. **Clean up**:
   - Cancel remaining orders
   - Pause DCA if needed

## Common Issues & Solutions

### Issue: "Gas estimation failed"
**Solution**:
- Check you have enough balance
- Try reducing send amount
- Switch to different RPC if testnet is congested

### Issue: "Push notifications not working"
**Solution**:
- Must use physical device
- Check notification permissions in Settings
- Verify EAS project ID in app.json
- Rebuild app after adding notifications plugin

### Issue: "Transaction stuck pending"
**Solution**:
- Normal on testnets (can take 1-5 minutes)
- Check block explorer
- If stuck >10 minutes, may need to increase gas

### Issue: "Positions not loading"
**Solution**:
- Verify contracts are deployed
- Check contract addresses in `lib/testnet.ts`
- Ensure you're on correct testnet
- Pull to refresh

### Issue: "Balance not updating"
**Solution**:
- Wait for block confirmation (15s Sepolia, 2s Polygon)
- Pull to refresh on home screen
- Check transaction in Activity tab
- Verify on block explorer

## Testing Checklist

Use this checklist before considering testnet testing complete:

### Basic Functionality
- [ ] Wallet creation/import
- [ ] Balance displays correctly
- [ ] Price feeds work
- [ ] Chain switching works
- [ ] Testnet warning shows

### Receive Flow
- [ ] QR code generates
- [ ] Copy address works
- [ ] Share address works
- [ ] Funds received successfully
- [ ] Balance updates

### Send Flow
- [ ] Address validation works
- [ ] QR scanner works
- [ ] Amount validation works
- [ ] MAX button works
- [ ] Gas estimation shows
- [ ] Transaction preview accurate
- [ ] Warnings display properly
- [ ] Transaction executes
- [ ] Confirmation received

### Notifications
- [ ] Permission requested
- [ ] Transaction notifications work
- [ ] Sound plays
- [ ] Tap opens correct screen
- [ ] Badge updates

### Positions (after contract deployment)
- [ ] Limit orders display
- [ ] DCA strategies display
- [ ] Progress tracking works
- [ ] Cancel/pause works
- [ ] Notifications on execution

### Edge Cases
- [ ] Insufficient balance handled
- [ ] Invalid addresses rejected
- [ ] High gas warnings show
- [ ] Network errors handled gracefully
- [ ] Offline mode works

## Next Steps After Testing

Once all tests pass:

1. **Document any bugs** found during testing
2. **Fix critical issues** before beta
3. **Deploy contracts** to testnet
4. **Integrate contract addresses**
5. **Test full automation flow**
6. **Get 5-10 beta testers**
7. **Collect feedback**
8. **Iterate and improve**
9. **Prepare for mainnet** deployment

## Block Explorers

View transactions on testnet explorers:

- **Sepolia**: https://sepolia.etherscan.io/
- **Polygon Amoy**: https://amoy.polygonscan.com/

Search for:
- Your wallet address
- Transaction hashes
- Contract addresses

## Support

If you encounter issues:
1. Check this guide first
2. Review error messages carefully
3. Check block explorer
4. Verify RPC endpoints
5. Try different testnet if one is congested

Good luck testing! 🚀
