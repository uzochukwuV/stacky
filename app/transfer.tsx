import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { STACKS_THEME } from '~/lib/constants';
import { router } from 'expo-router';

// Mock data
const mockTokens = [
  { id: '1', symbol: 'STX', name: 'Stacks', balance: 1245.67, logo: 'https://cryptologos.cc/logos/stacks-stx-logo.png' },
  { id: '2', symbol: 'ALEX', name: 'ALEX Lab', balance: 5678.9, logo: 'https://cryptologos.cc/logos/alex-lab-alex-logo.png' },
  { id: '3', symbol: 'USDA', name: 'USDA', balance: 644.76, logo: 'https://cryptologos.cc/logos/usda-usda-logo.png' },
];

export default function TransferScreen() {
  const [selectedToken, setSelectedToken] = useState(mockTokens[0]);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const estimatedFee = 0.00042; // Mock fee in STX
  
  const handleSelectToken = (token: any) => {
    setSelectedToken(token);
    setShowTokenSelector(false);
  };
  
  const handleScanQR = () => {
    // Implement QR scanner functionality
    console.log('Scan QR code');
  };
  
  const handleMaxAmount = () => {
    setAmount(selectedToken.balance.toString());
  };
  
  const handleConfirmTransfer = () => {
    // Show confirmation modal
    setShowConfirmation(true);
  };
  
  const handleSubmitTransfer = () => {
    // Submit transfer to blockchain
    console.log('Transfer submitted');
    // Reset form and navigate back
    setAmount('');
    setRecipient('');
    setShowConfirmation(false);
    router.back();
  };

  return (
    <SafeAreaView style={{ 
      flex: 1, 
      backgroundColor: STACKS_THEME.colors.background.primary,
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: STACKS_THEME.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: STACKS_THEME.colors.border.default,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: STACKS_THEME.spacing.md }}>
          <Ionicons name="arrow-back" size={24} color={STACKS_THEME.colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ 
          color: STACKS_THEME.colors.text.primary, 
          fontFamily: 'Inter_600SemiBold',
          fontSize: 18,
        }}>
          Send {selectedToken.symbol}
        </Text>
      </View>
      
      <ScrollView style={{ flex: 1, padding: STACKS_THEME.spacing.md }}>
        {/* Token Selector */}
        <Text style={{ 
          color: STACKS_THEME.colors.text.secondary, 
          fontFamily: 'Inter_500Medium',
          marginBottom: STACKS_THEME.spacing.sm,
        }}>
          Select Token
        </Text>
        <TouchableOpacity 
          onPress={() => setShowTokenSelector(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: STACKS_THEME.colors.background.card,
            borderRadius: STACKS_THEME.borderRadius.md,
            padding: STACKS_THEME.spacing.md,
            marginBottom: STACKS_THEME.spacing.lg,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image 
              source={{ uri: selectedToken.logo }} 
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
                {selectedToken.symbol}
              </Text>
              <Text style={{ 
                color: STACKS_THEME.colors.text.secondary,
                fontFamily: 'Inter_400Regular',
                fontSize: 12,
              }}>
                Balance: {selectedToken.balance.toLocaleString()} {selectedToken.symbol}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-down" size={20} color={STACKS_THEME.colors.text.secondary} />
        </TouchableOpacity>
        
        {/* Recipient Address */}
        <Text style={{ 
          color: STACKS_THEME.colors.text.secondary, 
          fontFamily: 'Inter_500Medium',
          marginBottom: STACKS_THEME.spacing.sm,
        }}>
          Recipient Address
        </Text>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: STACKS_THEME.colors.background.card,
          borderRadius: STACKS_THEME.borderRadius.md,
          padding: STACKS_THEME.spacing.sm,
          marginBottom: STACKS_THEME.spacing.lg,
        }}>
          <TextInput
            value={recipient}
            onChangeText={setRecipient}
            placeholder="Enter STX address"
            placeholderTextColor={STACKS_THEME.colors.text.tertiary}
            style={{
              flex: 1,
              color: STACKS_THEME.colors.text.primary,
              fontFamily: 'Inter_400Regular',
              padding: STACKS_THEME.spacing.sm,
            }}
          />
          <TouchableOpacity 
            onPress={handleScanQR}
            style={{
              backgroundColor: STACKS_THEME.colors.background.secondary,
              borderRadius: STACKS_THEME.borderRadius.sm,
              padding: STACKS_THEME.spacing.sm,
            }}
          >
            <Ionicons name="qr-code-outline" size={24} color={STACKS_THEME.colors.primary.default} />
          </TouchableOpacity>
        </View>
        
        {/* Amount */}
        <Text style={{ 
          color: STACKS_THEME.colors.text.secondary, 
          fontFamily: 'Inter_500Medium',
          marginBottom: STACKS_THEME.spacing.sm,
        }}>
          Amount
        </Text>
        <View style={{
          backgroundColor: STACKS_THEME.colors.background.card,
          borderRadius: STACKS_THEME.borderRadius.md,
          padding: STACKS_THEME.spacing.md,
          marginBottom: STACKS_THEME.spacing.lg,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: STACKS_THEME.spacing.md,
          }}>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={STACKS_THEME.colors.text.tertiary}
              keyboardType="numeric"
              style={{
                color: STACKS_THEME.colors.text.primary,
                fontFamily: 'Inter_600SemiBold',
                fontSize: 24,
              }}
            />
            <TouchableOpacity 
              onPress={handleMaxAmount}
              style={{
                backgroundColor: `${STACKS_THEME.colors.primary.default}20`,
                borderRadius: STACKS_THEME.borderRadius.sm,
                paddingHorizontal: STACKS_THEME.spacing.md,
                paddingVertical: STACKS_THEME.spacing.xs,
              }}
            >
              <Text style={{ 
                color: STACKS_THEME.colors.primary.default, 
                fontFamily: 'Inter_500Medium',
              }}>
                MAX
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={{ 
            color: STACKS_THEME.colors.text.secondary,
            fontFamily: 'Inter_400Regular',
          }}>
            Available: {selectedToken.balance.toLocaleString()} {selectedToken.symbol}
          </Text>
        </View>
        
        {/* Fee */}
        <View style={{
          backgroundColor: STACKS_THEME.colors.background.card,
          borderRadius: STACKS_THEME.borderRadius.md,
          padding: STACKS_THEME.spacing.md,
          marginBottom: STACKS_THEME.spacing.lg,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Text style={{ 
              color: STACKS_THEME.colors.text.secondary, 
              fontFamily: 'Inter_400Regular',
            }}>
              Estimated Network Fee
            </Text>
            <Text style={{ 
              color: STACKS_THEME.colors.text.primary, 
              fontFamily: 'Inter_500Medium',
            }}>
              {estimatedFee} STX
            </Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Confirm Button */}
      <View style={{
        padding: STACKS_THEME.spacing.md,
        borderTopWidth: 1,
        borderTopColor: STACKS_THEME.colors.border.default,
      }}>
        <TouchableOpacity 
          onPress={handleConfirmTransfer}
          disabled={!amount || !recipient}
          style={{
            backgroundColor: amount && recipient ? STACKS_THEME.colors.primary.default : STACKS_THEME.colors.background.card,
            borderRadius: STACKS_THEME.borderRadius.lg,
            padding: STACKS_THEME.spacing.md,
            alignItems: 'center',
          }}
        >
          <Text style={{ 
            color: amount && recipient ? STACKS_THEME.colors.text.primary : STACKS_THEME.colors.text.tertiary, 
            fontFamily: 'Inter_600SemiBold',
            fontSize: 16,
          }}>
            Confirm Transfer
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
                }}
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
              Transaction Summary
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
                <Text style={{ color: STACKS_THEME.colors.text.secondary }}>Sending</Text>
                <Text style={{ color: STACKS_THEME.colors.text.primary, fontFamily: 'Inter_600SemiBold' }}>
                  {amount} {selectedToken.symbol}
                </Text>
              </View>
              
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: STACKS_THEME.spacing.md,
              }}>
                <Text style={{ color: STACKS_THEME.colors.text.secondary }}>To</Text>
                <Text style={{ 
                  color: STACKS_THEME.colors.text.primary, 
                  fontFamily: 'Inter_400Regular',
                  maxWidth: '60%',
                }}>
                  {recipient.substring(0, 10)}...{recipient.substring(recipient.length - 10)}
                </Text>
              </View>
              
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}>
                <Text style={{ color: STACKS_THEME.colors.text.secondary }}>Network Fee</Text>
                <Text style={{ color: STACKS_THEME.colors.text.primary }}>
                  {estimatedFee} STX
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
                onPress={handleSubmitTransfer}
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
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}