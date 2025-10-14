import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { STACKS_THEME } from '~/lib/constants';

// Mock data
const mockTokens = [
  { id: '1', symbol: 'STX', name: 'Stacks', balance: 1245.67, logo: 'https://cryptologos.cc/logos/stacks-stx-logo.png' },
  { id: '2', symbol: 'ALEX', name: 'ALEX Lab', balance: 5678.9, logo: 'https://cryptologos.cc/logos/alex-lab-alex-logo.png' },
  { id: '3', symbol: 'USDA', name: 'USDA', balance: 644.76, logo: 'https://cryptologos.cc/logos/usda-usda-logo.png' },
];

export default function SwapScreen() {
  const [tokenIn, setTokenIn] = useState(mockTokens[0]);
  const [tokenOut, setTokenOut] = useState(mockTokens[2]);
  const [amountIn, setAmountIn] = useState('');
  const [slippageTolerance, setSlippageTolerance] = useState('0.5');
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [selectingTokenIn, setSelectingTokenIn] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Mock exchange rate
  const exchangeRate = tokenIn.symbol === 'STX' && tokenOut.symbol === 'USDA' 
    ? 0.78 
    : tokenIn.symbol === 'USDA' && tokenOut.symbol === 'STX'
    ? 1.28
    : 2.5;
  
  const estimatedAmountOut = amountIn ? (parseFloat(amountIn) * exchangeRate).toFixed(6) : '0';
  const priceImpact = '0.05'; // Mock price impact percentage
  
  const handleSelectToken = (token: any) => {
    if (selectingTokenIn) {
      // Don't allow selecting the same token
      if (token.id === tokenOut.id) return;
      setTokenIn(token);
    } else {
      // Don't allow selecting the same token
      if (token.id === tokenIn.id) return;
      setTokenOut(token);
    }
    setShowTokenSelector(false);
  };
  
  const handleOpenTokenSelector = (isTokenIn: any) => {
    setSelectingTokenIn(isTokenIn);
    setShowTokenSelector(true);
  };
  
  const handleSwapTokens = () => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
    setAmountIn('');
  };
  
  const handleMaxAmount = () => {
    setAmountIn(tokenIn.balance.toString());
  };
  
  const handleConfirmSwap = () => {
    setShowConfirmation(true);
  };
  
  const handleSubmitSwap = () => {
    // Submit swap to blockchain
    console.log('Swap submitted');
    // Reset form
    setAmountIn('');
    setShowConfirmation(false);
  };

  return (
    <SafeAreaView style={{ 
      flex: 1, 
      backgroundColor: STACKS_THEME.colors.background.primary,
    }}>
      <ScrollView style={{ flex: 1, padding: STACKS_THEME.spacing.md }}>
        <Text style={{ 
          color: STACKS_THEME.colors.text.primary, 
          fontFamily: 'Inter_700Bold',
          fontSize: 24,
          marginBottom: STACKS_THEME.spacing.lg,
          textAlign: 'center',
        }}>
          Swap Tokens
        </Text>
        
        {/* Token In */}
        <View style={{
          backgroundColor: STACKS_THEME.colors.background.card,
          borderRadius: STACKS_THEME.borderRadius.lg,
          padding: STACKS_THEME.spacing.md,
          marginBottom: STACKS_THEME.spacing.sm,
        }}>
          <Text style={{ 
            color: STACKS_THEME.colors.text.secondary, 
            fontFamily: 'Inter_400Regular',
            marginBottom: STACKS_THEME.spacing.sm,
          }}>
            You Pay
          </Text>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <TextInput
              value={amountIn}
              onChangeText={setAmountIn}
              placeholder="0.00"
              placeholderTextColor={STACKS_THEME.colors.text.tertiary}
              keyboardType="numeric"
              style={{
                color: STACKS_THEME.colors.text.primary,
                fontFamily: 'Inter_600SemiBold',
                fontSize: 24,
                flex: 1,
              }}
            />
            
            <TouchableOpacity 
              onPress={() => handleOpenTokenSelector(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: STACKS_THEME.colors.background.secondary,
                borderRadius: STACKS_THEME.borderRadius.md,
                padding: STACKS_THEME.spacing.sm,
              }}
            >
              <Image 
                source={{ uri: tokenIn.logo }} 
                style={{ 
                  width: 24, 
                  height: 24, 
                  borderRadius: STACKS_THEME.borderRadius.full,
                  marginRight: STACKS_THEME.spacing.sm,
                }} 
              />
              <Text style={{ 
                color: STACKS_THEME.colors.text.primary, 
                fontFamily: 'Inter_600SemiBold',
                marginRight: STACKS_THEME.spacing.sm,
              }}>
                {tokenIn.symbol}
              </Text>
              <Ionicons name="chevron-down" size={16} color={STACKS_THEME.colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: STACKS_THEME.spacing.sm,
          }}>
            <Text style={{ 
              color: STACKS_THEME.colors.text.secondary,
              fontFamily: 'Inter_400Regular',
              fontSize: 12,
            }}>
              Balance: {tokenIn.balance.toLocaleString()} {tokenIn.symbol}
            </Text>
            
            <TouchableOpacity 
              onPress={handleMaxAmount}
              style={{
                backgroundColor: `${STACKS_THEME.colors.primary.default}20`,
                borderRadius: STACKS_THEME.borderRadius.sm,
                paddingHorizontal: STACKS_THEME.spacing.sm,
                paddingVertical: STACKS_THEME.spacing.xs,
              }}
            >
              <Text style={{ 
                color: STACKS_THEME.colors.primary.default, 
                fontFamily: 'Inter_500Medium',
                fontSize: 12,
              }}>
                MAX
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Swap Button */}
        <View style={{
          alignItems: 'center',
          marginVertical: STACKS_THEME.spacing.sm,
        }}>
          <TouchableOpacity 
            onPress={handleSwapTokens}
            style={{
              backgroundColor: STACKS_THEME.colors.background.card,
              borderRadius: STACKS_THEME.borderRadius.full,
              padding: STACKS_THEME.spacing.sm,
            }}
          >
            <Ionicons name="swap-vertical" size={24} color={STACKS_THEME.colors.primary.default} />
          </TouchableOpacity>
        </View>
        
        {/* Token Out */}
        <View style={{
          backgroundColor: STACKS_THEME.colors.background.card,
          borderRadius: STACKS_THEME.borderRadius.lg,
          padding: STACKS_THEME.spacing.md,
          marginBottom: STACKS_THEME.spacing.lg,
        }}>
          <Text style={{ 
            color: STACKS_THEME.colors.text.secondary, 
            fontFamily: 'Inter_400Regular',
            marginBottom: STACKS_THEME.spacing.sm,
          }}>
            You Receive (Estimated)
          </Text>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Text style={{
              color: STACKS_THEME.colors.text.primary,
              fontFamily: 'Inter_600SemiBold',
              fontSize: 24,
              flex: 1,
            }}>
              {estimatedAmountOut}
            </Text>
            
            <TouchableOpacity 
              onPress={() => handleOpenTokenSelector(false)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: STACKS_THEME.colors.background.secondary,
                borderRadius: STACKS_THEME.borderRadius.md,
                padding: STACKS_THEME.spacing.sm,
              }}
            >
              <Image 
                source={{ uri: tokenOut.logo }} 
                style={{ 
                  width: 24, 
                  height: 24, 
                  borderRadius: STACKS_THEME.borderRadius.full,
                  marginRight: STACKS_THEME.spacing.sm,
                }} 
              />
              <Text style={{ 
                color: STACKS_THEME.colors.text.primary, 
                fontFamily: 'Inter_600SemiBold',
                marginRight: STACKS_THEME.spacing.sm,
              }}>
                {tokenOut.symbol}
              </Text>
              <Ionicons name="chevron-down" size={16} color={STACKS_THEME.colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={{ 
            color: STACKS_THEME.colors.text.secondary,
            fontFamily: 'Inter_400Regular',
            fontSize: 12,
            marginTop: STACKS_THEME.spacing.sm,
          }}>
            Balance: {tokenOut.balance.toLocaleString()} {tokenOut.symbol}
          </Text>
        </View>
        
        {/* Exchange Rate */}
        <View style={{
          backgroundColor: STACKS_THEME.colors.background.card,
          borderRadius: STACKS_THEME.borderRadius.lg,
          padding: STACKS_THEME.spacing.md,
          marginBottom: STACKS_THEME.spacing.lg,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: STACKS_THEME.spacing.md,
          }}>
            <Text style={{ color: STACKS_THEME.colors.text.secondary }}>Exchange Rate</Text>
            <Text style={{ 
              color: STACKS_THEME.colors.text.primary, 
              fontFamily: 'Inter_500Medium',
            }}>
              1 {tokenIn.symbol} = {exchangeRate} {tokenOut.symbol}
            </Text>
          </View>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: STACKS_THEME.spacing.md,
          }}>
            <Text style={{ color: STACKS_THEME.colors.text.secondary }}>Price Impact</Text>
            <Text style={{ 
              color: parseFloat(priceImpact) > 1 ? STACKS_THEME.colors.warning : STACKS_THEME.colors.success, 
              fontFamily: 'Inter_500Medium',
            }}>
              {priceImpact}%
            </Text>
          </View>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Text style={{ color: STACKS_THEME.colors.text.secondary }}>Slippage Tolerance</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {['0.1', '0.5', '1.0'].map((value) => (
                <TouchableOpacity 
                  key={value}
                  onPress={() => setSlippageTolerance(value)}
                  style={{
                    backgroundColor: slippageTolerance === value 
                      ? STACKS_THEME.colors.primary.default 
                      : STACKS_THEME.colors.background.secondary,
                    borderRadius: STACKS_THEME.borderRadius.sm,
                    paddingHorizontal: STACKS_THEME.spacing.sm,
                    paddingVertical: STACKS_THEME.spacing.xs,
                    marginLeft: STACKS_THEME.spacing.xs,
                  }}
                >
                  <Text style={{ 
                    color: slippageTolerance === value 
                      ? STACKS_THEME.colors.text.primary 
                      : STACKS_THEME.colors.text.secondary, 
                    fontFamily: 'Inter_500Medium',
                    fontSize: 12,
                  }}>
                    {value}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Swap Button */}
      <View style={{
        padding: STACKS_THEME.spacing.md,
        borderTopWidth: 1,
        borderTopColor: STACKS_THEME.colors.border.default,
      }}>
        <TouchableOpacity 
          onPress={handleConfirmSwap}
          disabled={!amountIn || parseFloat(amountIn) <= 0}
          style={{
            backgroundColor: amountIn && parseFloat(amountIn) > 0 
              ? STACKS_THEME.colors.primary.default 
              : STACKS_THEME.colors.background.card,
            borderRadius: STACKS_THEME.borderRadius.lg,
            padding: STACKS_THEME.spacing.md,
            alignItems: 'center',
          }}
        >
          <Text style={{ 
            color: amountIn && parseFloat(amountIn) > 0 
              ? STACKS_THEME.colors.text.primary 
              : STACKS_THEME.colors.text.tertiary, 
            fontFamily: 'Inter_600SemiBold',
            fontSize: 16,
          }}>
            Swap Now
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Token Selector Modal */}
      {showTokenSelector && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: STACKS_THEME.colors.background.secondary,
            borderTopLeftRadius: STACKS_THEME.borderRadius.lg,
            borderTopRightRadius: STACKS_THEME.borderRadius.lg,
            padding: STACKS_THEME.spacing.md,
            maxHeight: '70%',
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: STACKS_THEME.spacing.md,
            }}>
              <Text style={{ 
                color: STACKS_THEME.colors.text.primary, 
                fontFamily: 'Inter_600SemiBold',
                fontSize: 18,
              }}>
                Select Token
              </Text>
              <TouchableOpacity onPress={() => setShowTokenSelector(false)}>
                <Ionicons name="close" size={24} color={STACKS_THEME.colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              {mockTokens.map(token => (
                <TouchableOpacity 
                  key={token.id}
                  onPress={() => handleSelectToken(token)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: STACKS_THEME.spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: STACKS_THEME.colors.border.default,
                    opacity: (selectingTokenIn && token.id === tokenOut.id) || 
                           (!selectingTokenIn && token.id === tokenIn.id) 
                           ? 0.5 : 1,
                  }}
                  disabled={(selectingTokenIn && token.id === tokenOut.id) || 
                          (!selectingTokenIn && token.id === tokenIn.id)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image 
                      source={{ uri: token.logo }} 
                      style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: STACKS_THEME.borderRadius.full,
                        marginRight: STACKS_THEME.spacing.md,
                      }} 
                    />
                    <View>
                      <Text style={{ 
                        color: STACKS_THEME.colors.text.primary, 
                        fontFamily: 'Inter_600SemiBold',
                      }}>
                        {token.symbol}
                      </Text>
                      <Text style={{ 
                        color: STACKS_THEME.colors.text.secondary,
                        fontFamily: 'Inter_400Regular',
                        fontSize: 12,
                      }}>
                        {token.name}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ 
                    color: STACKS_THEME.colors.text.primary, 
                    fontFamily: 'Inter_500Medium',
                  }}>
                    {token.balance.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
      
      {/* Confirmation Modal */}
      {showConfirmation && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: STACKS_THEME.spacing.lg,
        }}>
          <View style={{
            backgroundColor: STACKS_THEME.colors.background.secondary,
            borderRadius: STACKS_THEME.borderRadius.lg,
            padding: STACKS_THEME.spacing.lg,
            width: '100%',
          }}>
            <Text style={{ 
              color: STACKS_THEME.colors.text.primary, 
              fontFamily: 'Inter_600SemiBold',
              fontSize: 20,
              textAlign: 'center',
              marginBottom: STACKS_THEME.spacing.lg,
            }}>
              Confirm Swap
            </Text>
            
            <View style={{
              backgroundColor: STACKS_THEME.colors.background.card,
              borderRadius: STACKS_THEME.borderRadius.md,
              padding: STACKS_THEME.spacing.md,
              marginBottom: STACKS_THEME.spacing.lg,
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: STACKS_THEME.spacing.md,
              }}>
                <Text style={{ color: STACKS_THEME.colors.text.secondary }}>From</Text>
                <Text style={{ color: STACKS_THEME.colors.text.primary, fontFamily: 'Inter_600SemiBold' }}>
                  {amountIn} {tokenIn.symbol}
                </Text>
              </View>
              
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: STACKS_THEME.spacing.md,
              }}>
                <Text style={{ color: STACKS_THEME.colors.text.secondary }}>To (estimated)</Text>
                <Text style={{ color: STACKS_THEME.colors.text.primary, fontFamily: 'Inter_600SemiBold' }}>
                  {estimatedAmountOut} {tokenOut.symbol}
                </Text>
              </View>
              
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: STACKS_THEME.spacing.md,
              }}>
                <Text style={{ color: STACKS_THEME.colors.text.secondary }}>Rate</Text>
                <Text style={{ color: STACKS_THEME.colors.text.primary }}>
                  1 {tokenIn.symbol} = {exchangeRate} {tokenOut.symbol}
                </Text>
              </View>
              
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}>
                <Text style={{ color: STACKS_THEME.colors.text.secondary }}>Slippage Tolerance</Text>
                <Text style={{ color: STACKS_THEME.colors.text.primary }}>
                  {slippageTolerance}%
                </Text>
              </View>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity 
                onPress={() => setShowConfirmation(false)}
                style={{
                  backgroundColor: STACKS_THEME.colors.background.card,
                  borderRadius: STACKS_THEME.borderRadius.lg,
                  padding: STACKS_THEME.spacing.md,
                  flex: 1,
                  marginRight: STACKS_THEME.spacing.sm,
                  alignItems: 'center',
                }}
              >
                <Text style={{ 
                  color: STACKS_THEME.colors.text.primary, 
                  fontFamily: 'Inter_500Medium',
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleSubmitSwap}
                style={{
                  backgroundColor: STACKS_THEME.colors.primary.default,
                  borderRadius: STACKS_THEME.borderRadius.lg,
                  padding: STACKS_THEME.spacing.md,
                  flex: 1,
                  marginLeft: STACKS_THEME.spacing.sm,
                  alignItems: 'center',
                }}
              >
                <Text style={{ 
                  color: STACKS_THEME.colors.text.primary, 
                  fontFamily: 'Inter_600SemiBold',
                }}>
                  Confirm Swap
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}