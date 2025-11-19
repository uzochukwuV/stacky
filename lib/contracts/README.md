# Smart Contract Integration Layer

This directory contains the infrastructure for integrating smart contracts into your native wallet dApp.

## 🏗️ Architecture

The contract layer is built on three core principles:

1. **Reusable Base Class**: `BaseContract` provides common functionality for all contracts
2. **Multi-Chain Support**: Contracts work seamlessly across different chains
3. **Turnkey Integration**: All transactions are prepared for Turnkey signing

## 📁 Directory Structure

```
lib/contracts/
├── base-contract.ts       # Base class for all contracts
├── types.ts               # TypeScript interfaces
├── abi-types.ts           # ABI type generation utilities
├── abis/                  # Contract ABIs
│   ├── limit-order-abi.ts
│   └── dca-abi.ts
├── limit-order.ts         # Limit order contract service
├── dca.ts                 # DCA contract service
└── README.md              # This file
```

## 🚀 Quick Start

### 1. Add Your Contract ABI

Create a new file in `abis/` directory:

```typescript
// lib/contracts/abis/my-contract-abi.ts
import { Abi } from 'viem';

export const MY_CONTRACT_ABI: Abi = [
  // Paste your contract ABI here
] as const;

export const MY_CONTRACT_ADDRESSES = {
  polygon: '0xYourContractAddress',
  ethereum: '0xYourContractAddress',
  // Add more chains
} as const;
```

### 2. Create Contract Service

Extend `BaseContract`:

```typescript
// lib/contracts/my-contract.ts
import { Address } from 'viem';
import { BaseContract } from './base-contract';
import { ChainConfig } from '../chains/types';
import { ContractConfig, ContractTxRequest } from './types';
import { MY_CONTRACT_ABI, MY_CONTRACT_ADDRESSES } from './abis/my-contract-abi';

export class MyContract extends BaseContract {
  constructor(chain: ChainConfig) {
    const config: ContractConfig = {
      name: 'MyContract',
      abi: MY_CONTRACT_ABI,
      deployments: Object.entries(MY_CONTRACT_ADDRESSES).reduce(
        (acc, [chainId, address]) => {
          acc[chainId] = { address, chainId };
          return acc;
        },
        {} as Record<string, any>
      ),
    };

    super(config, chain);
  }

  // Add read functions
  async getMyData(param: bigint): Promise<string> {
    return await this.read<string>('getMyData', [param]);
  }

  // Add write functions
  async prepareMyTransaction(param: bigint): Promise<ContractTxRequest> {
    return await this.prepareWrite('myFunction', [param]);
  }
}
```

### 3. Use in Your Screen

```typescript
// app/my-feature/index.tsx
import { MyContract } from '~/lib/contracts/my-contract';
import { useChainStore } from '~/lib/stores';
import { useTurnkey } from '@turnkey/sdk-react-native';

export default function MyFeatureScreen() {
  const { currentChain } = useChainStore();
  const { user, signTransaction } = useTurnkey();
  const contract = new MyContract(currentChain);

  const handleTransaction = async () => {
    // 1. Read data (optional)
    const data = await contract.getMyData(123n);

    // 2. Prepare transaction
    const tx = await contract.prepareMyTransaction(456n);

    // 3. Sign with Turnkey
    const signedTx = await signTransaction(tx);

    // 4. Broadcast (implement this)
    // const hash = await broadcastTransaction(signedTx);
  };

  return (
    <View>
      {/* Your UI */}
    </View>
  );
}
```

## 📖 Base Contract Methods

### Read Functions

```typescript
// Read view/pure functions
const result = await contract.read<ReturnType>(
  'functionName',
  [arg1, arg2],
  { blockNumber: 12345n } // optional
);
```

### Write Functions

```typescript
// Prepare unsigned transaction
const tx = await contract.prepareWrite(
  'functionName',
  [arg1, arg2],
  {
    value: 1000000000000000000n, // optional ETH value
    gas: 100000n, // optional gas limit
  }
);

// Returns: { to, data, value?, gas? }
```

### Simulation

```typescript
// Test transaction before signing
const result = await contract.simulate(
  'functionName',
  [arg1, arg2],
  userAddress,
  { value: 1000000000000000000n }
);
```

### Events

```typescript
// Get contract events
const events = await contract.getEvents(
  'EventName',
  12345n, // from block
  12500n // to block (optional)
);
```

### Chain Switching

```typescript
// Switch to different chain
contract.switchChain(newChain);

// Check if deployed
if (contract.isDeployedOnCurrentChain()) {
  // Safe to use
}
```

## 🔧 ABI Type Generation

### Automatic Type Generation (Recommended)

Use wagmi CLI for production apps:

\`\`\`bash
npm install -D @wagmi/cli

# Create wagmi.config.ts
\`\`\`

```typescript
// wagmi.config.ts
import { defineConfig } from '@wagmi/cli';
import { react } from '@wagmi/cli/plugins';

export default defineConfig({
  out: 'lib/contracts/generated.ts',
  contracts: [
    {
      name: 'MyContract',
      abi: myContractAbi,
      address: {
        137: '0x...', // Polygon
        1: '0x...', // Ethereum
      },
    },
  ],
  plugins: [react()],
});
```

```bash
# Generate types
npx wagmi generate
```

### Manual Type Generation

Use the built-in utilities:

```typescript
import {
  generateContractInterface,
  generateEventTypes,
} from '~/lib/contracts/abi-types';

// Generate TypeScript interface
const interfaceCode = generateContractInterface('MyContract', abi);
console.log(interfaceCode);

// Generate event types
const eventTypes = generateEventTypes('MyContract', abi);
console.log(eventTypes);
```

## 💡 Example Contracts

### Limit Order Contract

```typescript
import { LimitOrderContract } from '~/lib/contracts';

const limitOrder = new LimitOrderContract(currentChain);

// Get active orders
const orders = await limitOrder.getActiveOrdersWithDetails(userAddress);

// Create new order
const tx = await limitOrder.prepareCreateOrder({
  tokenIn: '0x...',
  tokenOut: '0x...',
  amountIn: 1000000000000000000n,
  minAmountOut: 2000000000000000000n,
  targetPrice: 2000000n,
  expiration: BigInt(Date.now() / 1000 + 86400), // 24 hours
});
```

### DCA Contract

```typescript
import { DCAContract } from '~/lib/contracts';

const dca = new DCAContract(currentChain);

// Get user strategies
const strategies = await dca.getUserStrategiesWithDetails(userAddress);

// Create new strategy
const tx = await dca.prepareCreateStrategy({
  tokenIn: '0x...', // USDC
  tokenOut: '0x...', // ETH
  amountPerInterval: 100000000n, // 100 USDC
  interval: 86400n, // Daily
  maxExecutions: 30n, // 30 days
});
```

## 🎨 Screen Pattern

Create a screen for each contract:

```
app/defi/
├── limit-orders.tsx       # UI for limit orders
├── dca.tsx                # UI for DCA strategies
├── automations.tsx        # UI for general automation
└── marketplace.tsx        # UI for task marketplace
```

## 🔐 Security Best Practices

1. **Always simulate before signing**:

   ```typescript
   await contract.simulate('functionName', args, userAddress);
   ```

2. **Validate user inputs**:

   ```typescript
   if (amount <= 0) throw new Error('Invalid amount');
   ```

3. **Check contract deployment**:

   ```typescript
   if (!contract.isDeployedOnCurrentChain()) {
     Alert.alert('Contract not deployed on this chain');
     return;
   }
   ```

4. **Handle errors gracefully**:
   ```typescript
   try {
     await contract.prepareMyTransaction(args);
   } catch (error) {
     Alert.alert('Transaction failed', error.message);
   }
   ```

## 📝 Adding New Contracts

1. **Get your contract ABI** from deployment or Etherscan
2. **Create ABI file** in `abis/` directory
3. **Create contract service** extending `BaseContract`
4. **Build UI screen** for user interactions
5. **Export** from `index.ts`

## 🚦 Testing

```typescript
// Test read functions
const data = await contract.getMyData(123n);
console.log('Read result:', data);

// Test write functions (simulation)
const result = await contract.simulateMyTransaction(456n, userAddress);
console.log('Simulation result:', result);

// Test chain switching
contract.switchChain(polygonChain);
console.log('Current chain:', contract.getChain().name);
```

## 🔄 Updates

When you deploy a new version:

1. Update ABI in `abis/` directory
2. Update contract address in `ADDRESSES` constant
3. Run type generation (if using wagmi CLI)
4. Deploy app update

---

**Next Steps**: Deploy your contracts and add their addresses to the respective ABI files!
