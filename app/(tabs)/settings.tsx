import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView, Modal, SafeAreaView, Alert } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { STACKS_THEME } from '../../lib/constants';
import { StatusBar } from 'expo-status-bar';

const SettingsScreen = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState('mainnet');
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Mock seed phrase
  const seedPhrase = "valley alien library bread worry brother bundle hammer loyal barely dune brave";

  const handleNetworkChange = (network: string) => {
    setSelectedNetwork(network);
    setShowNetworkModal(false);
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout? Make sure you have backed up your wallet.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: () => {
            // Logout logic would go here
          }
        }
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      "Clear Cache",
      "This will clear all cached data. Your wallet and settings will not be affected.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Clear", 
          onPress: () => {
            // Clear cache logic would go here
            Alert.alert("Success", "Cache cleared successfully");
          }
        }
      ]
    );
  };

  const renderSettingItem = (icon: any , title: string, subtitle: string, rightElement: any) => (
    <View style={{ 
      flexDirection: 'row', 
      alignItems: 'center', 
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: STACKS_THEME.colors.border.default
    }}>
      <View style={{ 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        backgroundColor: STACKS_THEME.colors.background.card,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
      }}>
        {icon}
      </View>
      
      <View style={{ flex: 1 }}>
        <Text style={{ color: STACKS_THEME.colors.text.primary, fontWeight: '600', fontFamily: 'Inter_600SemiBold' }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ color: STACKS_THEME.colors.text.secondary, fontSize: 12, marginTop: 2, fontFamily: 'Inter_400Regular' }}>
            {subtitle}
          </Text>
        )}
      </View>
      
      {rightElement}
    </View>
  );

  const renderNetworkModal = () => (
    <Modal
      visible={showNetworkModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowNetworkModal(false)}
    >
      <View style={{ 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: 'flex-end' 
      }}>
        <View style={{ 
          backgroundColor: STACKS_THEME.colors.background.primary, 
          borderTopLeftRadius: 20, 
          borderTopRightRadius: 20, 
          padding: 16
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: STACKS_THEME.colors.text.primary, fontWeight: '600', fontSize: 18, fontFamily: 'Inter_600SemiBold' }}>
              Select Network
            </Text>
            <TouchableOpacity onPress={() => setShowNetworkModal(false)}>
              <Ionicons name="close" size={24} color={STACKS_THEME.colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            onPress={() => handleNetworkChange('mainnet')}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: STACKS_THEME.colors.border.default
            }}
          >
            <View style={{ 
              width: 24, 
              height: 24, 
              borderRadius: 12, 
              backgroundColor: '#5AC8FA',
              marginRight: 12
            }} />
            <Text style={{ color: STACKS_THEME.colors.text.primary, flex: 1, fontFamily: 'Inter_400Regular' }}>Mainnet</Text>
            {selectedNetwork === 'mainnet' && (
              <Ionicons name="checkmark" size={24} color={STACKS_THEME.colors.primary.default} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => handleNetworkChange('testnet')}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              paddingVertical: 16
            }}
          >
            <View style={{ 
              width: 24, 
              height: 24, 
              borderRadius: 12, 
              backgroundColor: '#FF9500',
              marginRight: 12
            }} />
            <Text style={{ color: STACKS_THEME.colors.text.primary, flex: 1, fontFamily: 'Inter_400Regular' }}>Testnet</Text>
            {selectedNetwork === 'testnet' && (
              <Ionicons name="checkmark" size={24} color={STACKS_THEME.colors.primary.default} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderBackupModal = () => (
    <Modal
      visible={showBackupModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowBackupModal(false)}
    >
      <View style={{ 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16
      }}>
        <View style={{ 
          backgroundColor: STACKS_THEME.colors.background.primary, 
          borderRadius: 20, 
          padding: 24,
          width: '90%',
          maxWidth: 400
        }}>
          <Text style={{ 
            color: STACKS_THEME.colors.text.primary, 
            fontWeight: '600', 
            fontSize: 20, 
            marginBottom: 16,
            textAlign: 'center',
            fontFamily: 'Inter_600SemiBold'
          }}>
            Backup Seed Phrase
          </Text>
          
          <Text style={{ 
            color: STACKS_THEME.colors.text.secondary, 
            marginBottom: 16,
            textAlign: 'center',
            fontFamily: 'Inter_400Regular'
          }}>
            Write down these 12 words in order and keep them in a safe place. Anyone with this seed phrase can access your wallet.
          </Text>
          
          <View style={{ 
            backgroundColor: STACKS_THEME.colors.background.card, 
            borderRadius: 16, 
            padding: 16, 
            marginBottom: 24,
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {seedPhrase.split(' ').map((word, index) => (
              <View 
                key={index}
                style={{ 
                  backgroundColor: STACKS_THEME.colors.background.secondary, 
                  borderRadius: 8, 
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  margin: 4
                }}
              >
                <Text style={{ color: STACKS_THEME.colors.text.primary, fontFamily: 'Inter_400Regular' }}>
                  {index + 1}. {word}
                </Text>
              </View>
            ))}
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity 
              onPress={() => setShowBackupModal(false)}
              style={{ 
                backgroundColor: STACKS_THEME.colors.background.card, 
                borderRadius: 16, 
                padding: 12, 
                width: '48%',
                alignItems: 'center'
              }}
            >
              <Text style={{ color: STACKS_THEME.colors.text.secondary, fontWeight: '500', fontFamily: 'Inter_500Medium' }}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => {
                // Copy to clipboard logic would go here
                setShowBackupModal(false);
                Alert.alert("Copied", "Seed phrase copied to clipboard");
              }}
              style={{ 
                backgroundColor: STACKS_THEME.colors.primary.default, 
                borderRadius: 16, 
                padding: 12, 
                width: '48%',
                alignItems: 'center'
              }}
            >
              <Text style={{ color: STACKS_THEME.colors.text.primary, fontWeight: '600', fontFamily: 'Inter_600SemiBold' }}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: STACKS_THEME.colors.background.primary }}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={{ padding: 16 }}>
        <Text style={{ color: STACKS_THEME.colors.text.primary, fontSize: 24, fontWeight: '700', fontFamily: 'Inter_700Bold' }}>
          Settings
        </Text>
        <Text style={{ color: STACKS_THEME.colors.text.secondary, marginTop: 4, fontFamily: 'Inter_400Regular' }}>
          Manage your wallet preferences
        </Text>
      </View>
      
      <ScrollView style={{ padding: 16 }}>
        {/* Network Section */}
        <Text style={{ 
          color: STACKS_THEME.colors.text.secondary, 
          marginBottom: 8, 
          fontWeight: '600',
          textTransform: 'uppercase',
          fontSize: 12,
          fontFamily: 'Inter_600SemiBold'
        }}>
          Network
        </Text>
        
        <View style={{ 
          backgroundColor: STACKS_THEME.colors.background.card, 
          borderRadius: 16, 
          padding: 16, 
          marginBottom: 24 
        }}>
          {renderSettingItem(
            <Ionicons name="globe" size={20} color={STACKS_THEME.colors.primary.default} />,
            "Network",
            `Currently on ${selectedNetwork}`,
            <TouchableOpacity onPress={() => setShowNetworkModal(true)}>
              <Text style={{ color: STACKS_THEME.colors.primary.default, fontFamily: 'Inter_500Medium' }}>Change</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Wallet Section */}
        <Text style={{ 
          color: STACKS_THEME.colors.text.secondary, 
          marginBottom: 8, 
          fontWeight: '600',
          textTransform: 'uppercase',
          fontSize: 12,
          fontFamily: 'Inter_600SemiBold'
        }}>
          Wallet
        </Text>
        
        <View style={{ 
          backgroundColor: STACKS_THEME.colors.background.card, 
          borderRadius: 16, 
          padding: 16, 
          marginBottom: 24 
        }}>
          {renderSettingItem(
            <Ionicons name="key" size={20} color="#FF9500" />,
            "Backup Seed Phrase",
            "Secure your wallet with a backup",
            <TouchableOpacity onPress={() => setShowBackupModal(true)}>
              <Text style={{ color: STACKS_THEME.colors.primary.default, fontFamily: 'Inter_500Medium' }}>View</Text>
            </TouchableOpacity>
          )}
          
          {renderSettingItem(
            <Ionicons name="wallet" size={20} color="#5AC8FA" />,
            "Export Private Key",
            "Export your wallet's private key",
            <TouchableOpacity>
              <Text style={{ color: STACKS_THEME.colors.primary.default, fontFamily: 'Inter_500Medium' }}>Export</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Security Section */}
        <Text style={{ 
          color: STACKS_THEME.colors.text.secondary, 
          marginBottom: 8, 
          fontWeight: '600',
          textTransform: 'uppercase',
          fontSize: 12,
          fontFamily: 'Inter_600SemiBold'
        }}>
          Security
        </Text>
        
        <View style={{ 
          backgroundColor: STACKS_THEME.colors.background.card, 
          borderRadius: 16, 
          padding: 16, 
          marginBottom: 24 
        }}>
          {renderSettingItem(
            <Ionicons name="finger-print" size={20} color="#4CD964" />,
            "Biometric Authentication",
            "Use Face ID or Touch ID for transactions",
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: STACKS_THEME.colors.border.default, true: STACKS_THEME.colors.primary.default }}
              thumbColor={STACKS_THEME.colors.text.primary}
            />
          )}
          
          {renderSettingItem(
            <Ionicons name="lock-closed" size={20} color="#FF2D55" />,
            "Auto-Lock",
            "Lock wallet after 5 minutes of inactivity",
            <Switch
              value={true}
              trackColor={{ false: STACKS_THEME.colors.border.default, true: STACKS_THEME.colors.primary.default }}
              thumbColor={STACKS_THEME.colors.text.primary}
            />
          )}
        </View>
        
        {/* Preferences Section */}
        <Text style={{ 
          color: STACKS_THEME.colors.text.secondary, 
          marginBottom: 8, 
          fontWeight: '600',
          textTransform: 'uppercase',
          fontSize: 12,
          fontFamily: 'Inter_600SemiBold'
        }}>
          Preferences
        </Text>
        
        <View style={{ 
          backgroundColor: STACKS_THEME.colors.background.card, 
          borderRadius: 16, 
          padding: 16, 
          marginBottom: 24 
        }}>
          {renderSettingItem(
            <Ionicons name="notifications" size={20} color="#5856D6" />,
            "Notifications",
            "Receive alerts for transactions",
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: STACKS_THEME.colors.border.default, true: STACKS_THEME.colors.primary.default }}
              thumbColor={STACKS_THEME.colors.text.primary}
            />
          )}
          
          {renderSettingItem(
            <Ionicons name="moon" size={20} color="#9D4EDD" />,
            "Dark Mode",
            "Use dark theme",
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: STACKS_THEME.colors.border.default, true: STACKS_THEME.colors.primary.default }}
              thumbColor={STACKS_THEME.colors.text.primary}
            />
          )}
        </View>
        
        {/* Other Section */}
        <Text style={{ 
          color: STACKS_THEME.colors.text.secondary, 
          marginBottom: 8, 
          fontWeight: '600',
          textTransform: 'uppercase',
          fontSize: 12,
          fontFamily: 'Inter_600SemiBold'
        }}>
          Other
        </Text>
        
        <View style={{ 
          backgroundColor: STACKS_THEME.colors.background.card, 
          borderRadius: 16, 
          padding: 16, 
          marginBottom: 24 
        }}>
          {renderSettingItem(
            <Ionicons name="trash-bin" size={20} color="#FF3B30" />,
            "Clear Cache",
            "Free up storage space",
            <TouchableOpacity onPress={handleClearCache}>
              <Text style={{ color: STACKS_THEME.colors.primary.default, fontFamily: 'Inter_500Medium' }}>Clear</Text>
            </TouchableOpacity>
          )}
          
          {renderSettingItem(
            <FontAwesome5 name="discord" size={20} color="#7289DA" />,
            "Join Discord Community",
            "Get help and connect with users",
            <Ionicons name="open-outline" size={20} color={STACKS_THEME.colors.primary.default} />
          )}
          
          {renderSettingItem(
            <Ionicons name="information-circle" size={20} color="#5AC8FA" />,
            "About",
            "Version 1.0.0",
            <Ionicons name="chevron-forward" size={20} color={STACKS_THEME.colors.text.secondary} />
          )}
        </View>
        
        {/* Logout Button */}
        <TouchableOpacity 
          onPress={handleLogout}
          style={{ 
            backgroundColor: 'rgba(255, 59, 48, 0.1)', 
            borderRadius: 16, 
            padding: 16, 
            alignItems: 'center',
            marginBottom: 32
          }}
        >
          <Text style={{ color: '#FF3B30', fontWeight: '600', fontFamily: 'Inter_600SemiBold' }}>
            Logout
          </Text>
        </TouchableOpacity>
      </ScrollView>
      
      {renderNetworkModal()}
      {renderBackupModal()}
    </SafeAreaView>
  );
};

export default SettingsScreen;