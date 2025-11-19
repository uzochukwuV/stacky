/**
 * ABI Type Generation Utilities
 *
 * This file provides utilities for working with contract ABIs and generating TypeScript types.
 * For full type generation from ABI files, you can use tools like:
 * - wagmi CLI: https://wagmi.sh/cli/getting-started
 * - abitype: https://github.com/wagmi-dev/abitype
 * - typechain: https://github.com/dethcrypto/TypeChain
 *
 * Example usage with wagmi CLI:
 * ```bash
 * npm install -D @wagmi/cli
 *
 * // wagmi.config.ts
 * import { defineConfig } from '@wagmi/cli'
 * import { react } from '@wagmi/cli/plugins'
 *
 * export default defineConfig({
 *   out: 'lib/contracts/generated.ts',
 *   contracts: [
 *     {
 *       name: 'LimitOrder',
 *       abi: limitOrderAbi,
 *       address: {
 *         137: '0x...' // Polygon
 *       }
 *     }
 *   ],
 *   plugins: [react()],
 * })
 * ```
 */

import { Abi, AbiFunction, AbiEvent, Address } from 'viem';

/**
 * Extract function signatures from ABI
 */
export function extractFunctionSignatures(abi: Abi): string[] {
  return abi
    .filter((item): item is AbiFunction => item.type === 'function')
    .map((func) => {
      const params = func.inputs.map((input) => `${input.type} ${input.name}`).join(', ');
      return `${func.name}(${params})`;
    });
}

/**
 * Extract event signatures from ABI
 */
export function extractEventSignatures(abi: Abi): string[] {
  return abi
    .filter((item): item is AbiEvent => item.type === 'event')
    .map((event) => {
      const params = event.inputs.map((input) => `${input.type} ${input.name}`).join(', ');
      return `${event.name}(${params})`;
    });
}

/**
 * Get read-only functions from ABI
 */
export function getReadFunctions(abi: Abi): AbiFunction[] {
  return abi.filter(
    (item): item is AbiFunction =>
      item.type === 'function' &&
      (item.stateMutability === 'view' || item.stateMutability === 'pure')
  );
}

/**
 * Get write functions from ABI
 */
export function getWriteFunctions(abi: Abi): AbiFunction[] {
  return abi.filter(
    (item): item is AbiFunction =>
      item.type === 'function' &&
      item.stateMutability !== 'view' &&
      item.stateMutability !== 'pure'
  );
}

/**
 * Generate TypeScript interface from ABI
 * This is a simplified version - for production use wagmi CLI
 */
export function generateContractInterface(contractName: string, abi: Abi): string {
  const readFunctions = getReadFunctions(abi);
  const writeFunctions = getWriteFunctions(abi);

  let interfaceCode = `
// Auto-generated from ABI
export interface ${contractName}Contract {
  // Read Functions
`;

  readFunctions.forEach((func) => {
    const params = func.inputs
      .map((input) => `${input.name}: ${mapSolidityType(input.type)}`)
      .join(', ');
    const returnType = func.outputs?.[0]
      ? mapSolidityType(func.outputs[0].type)
      : 'void';

    interfaceCode += `  ${func.name}(${params}): Promise<${returnType}>;\n`;
  });

  interfaceCode += `\n  // Write Functions\n`;

  writeFunctions.forEach((func) => {
    const params = func.inputs
      .map((input) => `${input.name}: ${mapSolidityType(input.type)}`)
      .join(', ');

    interfaceCode += `  ${func.name}(${params}): Promise<ContractTxRequest>;\n`;
  });

  interfaceCode += `}\n`;

  return interfaceCode;
}

/**
 * Map Solidity types to TypeScript types
 */
function mapSolidityType(solidityType: string): string {
  // Handle arrays
  if (solidityType.endsWith('[]')) {
    const baseType = solidityType.slice(0, -2);
    return `${mapSolidityType(baseType)}[]`;
  }

  // Handle fixed arrays
  const fixedArrayMatch = solidityType.match(/^(.+)\[(\d+)\]$/);
  if (fixedArrayMatch) {
    const baseType = fixedArrayMatch[1];
    return `${mapSolidityType(baseType)}[]`;
  }

  // Uint types
  if (solidityType.match(/^uint\d*$/)) {
    return 'bigint';
  }

  // Int types
  if (solidityType.match(/^int\d*$/)) {
    return 'bigint';
  }

  // Address
  if (solidityType === 'address') {
    return 'Address';
  }

  // Bool
  if (solidityType === 'bool') {
    return 'boolean';
  }

  // String
  if (solidityType === 'string') {
    return 'string';
  }

  // Bytes
  if (solidityType.match(/^bytes\d*$/)) {
    return '`0x${string}`';
  }

  // Tuple (struct)
  if (solidityType.startsWith('tuple')) {
    return 'any'; // In production, parse the tuple structure
  }

  return 'any';
}

/**
 * Example: Generate event types
 */
export function generateEventTypes(contractName: string, abi: Abi): string {
  const events = abi.filter((item): item is AbiEvent => item.type === 'event');

  let eventTypes = `
// Event types for ${contractName}
`;

  events.forEach((event) => {
    const params = event.inputs
      .map((input) => `  ${input.name}: ${mapSolidityType(input.type)};`)
      .join('\n');

    eventTypes += `
export interface ${event.name}Event {
${params}
}
`;
  });

  return eventTypes;
}
