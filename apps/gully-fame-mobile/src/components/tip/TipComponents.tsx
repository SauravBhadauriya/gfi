import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  TextInput,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Svg, { Path, Circle, G, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scale, scaleVertical, getFontSize, wp, hp, spacing } from '../../utils/responsive';
import { sendSupportPayment, getWalletBalance } from '../../api/services/paymentIntegrationService';

const { width, height } = Dimensions.get('window');

// Coin Icon - Enhanced design
const CoinIcon = ({ size = 24, color = '#EC9A15' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill={color} />
    <Circle cx="12" cy="12" r="8" fill="none" stroke="#fff" strokeWidth="1" opacity="0.3" />
    <Path
      d="M12 7v10M8 11h8M8 13h8"
      stroke="#fff"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <Circle cx="12" cy="12" r="1.5" fill="#fff" />
  </Svg>
);

// UPI Icon
const UPIIcon = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 7h18M3 12h18M3 17h18"
      stroke="#666"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

// Card Icon
const CardIcon = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="6" width="20" height="12" rx="2" stroke="#666" strokeWidth="2" />
    <Path d="M2 10h20" stroke="#666" strokeWidth="2" />
  </Svg>
);

// QR Icon
const QRIcon = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="8" height="8" stroke="#666" strokeWidth="2" />
    <Rect x="13" y="3" width="8" height="8" stroke="#666" strokeWidth="2" />
    <Rect x="3" y="13" width="8" height="8" stroke="#666" strokeWidth="2" />
    <Rect x="15" y="15" width="2" height="2" fill="#666" />
  </Svg>
);

// Sparkle Animation Component
const SparkleAnimation = ({ visible }: { visible: boolean }) => {
  const sparkles = useRef(
    Array.from({ length: 8 }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      sparkles.forEach((sparkle, index) => {
        const angle = (index * 360) / 8;
        const radius = 60;
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;

        sparkle.translateX.setValue(0);
        sparkle.translateY.setValue(0);
        sparkle.scale.setValue(0);
        sparkle.opacity.setValue(1);

        Animated.parallel([
          Animated.timing(sparkle.scale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(sparkle.translateX, {
            toValue: x,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(sparkle.translateY, {
            toValue: y,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(sparkle.opacity, {
            toValue: 0,
            duration: 500,
            delay: 200,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.sparkleContainer} pointerEvents="none">
      {sparkles.map((sparkle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.sparkle,
            {
              transform: [
                { translateX: sparkle.translateX },
                { translateY: sparkle.translateY },
                { scale: sparkle.scale },
              ],
              opacity: sparkle.opacity,
            },
          ]}
        >
          <Text style={styles.sparkleText}>✨</Text>
        </Animated.View>
      ))}
    </View>
  );
};

// Success Popup Component
export const SuccessPopup = ({
  visible,
  onClose,
  message = '🎉 Support Sent Successfully!', // Updated copy text
}: {
  visible: boolean;
  onClose: () => void;
  message?: string;
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.successModalOverlay}>
        <Animated.View
          style={[
            styles.successModalContent,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <SparkleAnimation visible={visible} />
          <Text style={styles.successMessage}>{message}</Text>
          <TouchableOpacity style={styles.successButton} onPress={onClose}>
            <Text style={styles.successButtonText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Payment Method Sheet Component (for Fan users)
export const PaymentMethodSheet = ({
  visible,
  onClose,
  amount,
  onContinue,
}: {
  visible: boolean;
  onClose: () => void;
  amount: number;
  onContinue: (method: string) => void;
}) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [selectedMethod, setSelectedMethod] = useState<string>('');

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      slideAnim.setValue(height);
    }
  }, [visible]);

  const handleContinue = () => {
    if (selectedMethod) {
      onContinue(selectedMethod);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <Animated.View
            style={[
              styles.bottomSheet,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.bottomSheetHandle} />
            <Text style={styles.bottomSheetTitle}>Select Payment Method</Text>
            <Text style={styles.bottomSheetSubtitle}>Amount: ₹{amount}</Text>

            <View style={styles.paymentMethodsContainer}>
              <TouchableOpacity
                style={[
                  styles.paymentMethodOption,
                  selectedMethod === 'upi' && styles.paymentMethodSelected,
                ]}
                onPress={() => setSelectedMethod('upi')}
              >
                <UPIIcon size={32} />
                <Text style={styles.paymentMethodText}>UPI</Text>
                {selectedMethod === 'upi' && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedIndicatorText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentMethodOption,
                  selectedMethod === 'card' && styles.paymentMethodSelected,
                ]}
                onPress={() => setSelectedMethod('card')}
              >
                <CardIcon size={32} />
                <Text style={styles.paymentMethodText}>Card</Text>
                {selectedMethod === 'card' && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedIndicatorText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentMethodOption,
                  selectedMethod === 'qr' && styles.paymentMethodSelected,
                ]}
                onPress={() => setSelectedMethod('qr')}
              >
                <QRIcon size={32} />
                <Text style={styles.paymentMethodText}>QR Code</Text>
                {selectedMethod === 'qr' && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedIndicatorText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.continueButton,
                !selectedMethod && styles.continueButtonDisabled,
              ]}
              onPress={handleContinue}
              disabled={!selectedMethod}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

// Main Tip Popup Component (Serving as Support Component now)
export const TipPopup = ({
  visible,
  onClose,
  reelId,
  creatorId,
  onTipSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  reelId: number;
  creatorId?: string; // Backend creator user ID
  onTipSuccess: (amount: number) => void;
}) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [userRole, setUserRole] = useState<string>('');
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [coinBalance, setCoinBalance] = useState<number>(0); // Will be fetched from backend
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInsufficientCoins, setShowInsufficientCoins] = useState(false);

  // New States for Warning Modal
  const [showWarning, setShowWarning] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Participant coin amounts
  const coinAmounts = [50, 100, 200];
  // Fan money amounts
  const moneyAmounts = [10, 50, 100, 200];

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const role = await AsyncStorage.getItem('userRole');
        setUserRole(role || 'fan');
      } catch (error) {
        console.error('Error loading user role:', error);
        setUserRole('fan');
      }
    };
    loadUserRole();
  }, []);

  // Fetch real coin balance from backend
  useEffect(() => {
    const loadCoinBalance = async () => {
      try {
        const response = await getWalletBalance();
        if (response.success && response.data) {
          setCoinBalance(response.data.coins || 0);
          console.log('[TipPopup] Coin balance loaded:', response.data.coins);
        } else {
          console.warn('[TipPopup] Failed to load coin balance, defaulting to 0');
          setCoinBalance(0);
        }
      } catch (error) {
        console.error('[TipPopup] Error loading coin balance:', error);
        setCoinBalance(0);
      }
    };

    // Only fetch if participant user or when component becomes visible
    if (visible) {
      loadCoinBalance();
    }
  }, [visible]);

  // Check user preference for warning modal on mount
  useEffect(() => {
    const checkWarningPreference = async () => {
      const isHidden = await AsyncStorage.getItem('hideSupportWarning');
      if (isHidden === 'true') {
        setDontShowAgain(true);
      }
    };
    checkWarningPreference();
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      slideAnim.setValue(height);
      setSelectedAmount(0);
      setCustomAmount('');
      setShowPaymentMethod(false);
      setShowInsufficientCoins(false);
      setShowWarning(false);
    }
  }, [visible]);

  const isParticipant = userRole === 'participant' || userRole === 'participants';

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setSelectedAmount(numValue);
    } else {
      setSelectedAmount(0);
    }
  };

  // Intermediary Check function before finalizing support
  const handleConfirmTip = async () => {
    if (selectedAmount <= 0) return;

    if (isParticipant && selectedAmount > coinBalance) {
      setShowInsufficientCoins(true);
      return;
    }

    // Checking explicit storage value to respect "Do Not Show Again"
    const hideWarning = await AsyncStorage.getItem('hideSupportWarning');
    if (hideWarning === 'true') {
      executeSupportAction();
    } else {
      setShowWarning(true);
    }
  };

  // The actual execution wrapper logic - NOW CALLS REAL BACKEND
  const executeSupportAction = async () => {
    if (isParticipant) {
      setIsLoading(true);
      try {
        // Get current user ID
        const userId = await AsyncStorage.getItem('userId');
        
        if (!userId) {
          throw new Error('User ID not found. Please login again.');
        }

        if (!creatorId) {
          throw new Error('Creator information not available. Please try again.');
        }

        // Call real backend to send support/tip
        const response = await sendSupportPayment({
          recipientId: creatorId, // Use actual creator ID from reel data
          reelId: reelId,
          amount: selectedAmount,
          coins: selectedAmount,
          message: '',
        });

        if (response.success) {
          // ONLY show success AFTER backend confirms
          setIsLoading(false);
          setShowSuccess(true);
          onTipSuccess(selectedAmount);
          // Update local coin balance after backend confirmation
          setCoinBalance(coinBalance - selectedAmount);
          console.log('[TipPopup] Support sent successfully:', response.data);
        } else {
          setIsLoading(false);
          Alert.alert('Support Failed', response.message || 'Failed to send support. Please try again.');
          console.error('[TipPopup] Support failed:', response.error);
        }
      } catch (error: any) {
        setIsLoading(false);
        Alert.alert('Error', error.message || 'An error occurred while sending support.');
        console.error('[TipPopup] Support error:', error);
      }
    } else {
      setShowPaymentMethod(true);
    }
  };

  // Triggered when user confirms warning modal
  const handleWarningAgree = async () => {
    if (dontShowAgain) {
      await AsyncStorage.setItem('hideSupportWarning', 'true');
    } else {
      await AsyncStorage.removeItem('hideSupportWarning');
    }
    setShowWarning(false);
    executeSupportAction();
  };

  const handlePaymentContinue = async (method: string) => {
    setShowPaymentMethod(false);
    setIsLoading(true);
    try {
      // Get current user ID
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }

      if (!creatorId) {
        throw new Error('Creator information not available. Please try again.');
      }

      // Call real backend to send support/tip payment
      const response = await sendSupportPayment({
        recipientId: creatorId, // Use actual creator ID from reel data
        reelId: reelId,
        amount: selectedAmount,
        coins: 0, // Fan users pay in INR, not coins
        message: '',
      });

      if (response.success) {
        // ONLY show success AFTER backend confirms
        setIsLoading(false);
        setShowSuccess(true);
        onTipSuccess(selectedAmount);
        console.log('[TipPopup] Payment sent successfully:', response.data);
      } else {
        setIsLoading(false);
        Alert.alert('Payment Failed', response.message || 'Failed to process payment. Please try again.');
        console.error('[TipPopup] Payment failed:', response.error);
      }
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('Error', error.message || 'An error occurred while processing payment.');
      console.error('[TipPopup] Payment error:', error);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onClose();
  };

  const handleBuyCoins = () => {
    setShowInsufficientCoins(false);
    Alert.alert('Buy Coins', 'Redirecting to coin purchase...');
  };

  return (
    <>
      <Modal transparent visible={visible && !showPaymentMethod && !showSuccess && !showWarning} animationType="none" onRequestClose={onClose}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.bottomSheet,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.bottomSheetHandle} />
              
              {/* Updated Copy Texts */}
              <Text style={styles.bottomSheetTitle}>Show Your Support</Text>

              {isParticipant ? (
                <>
                  <View style={styles.balanceContainer}>
                    <CoinIcon size={20} />
                    <Text style={styles.balanceText}>
                      Available: {coinBalance} coins
                    </Text>
                  </View>

                  <View style={styles.amountsContainer}>
                    {coinAmounts.map((amount) => (
                      <TouchableOpacity
                        key={amount}
                        style={[
                          styles.amountButton,
                          selectedAmount === amount && styles.amountButtonSelected,
                        ]}
                        onPress={() => handleAmountSelect(amount)}
                      >
                        <CoinIcon size={18} color={selectedAmount === amount ? '#fff' : '#EC9A15'} />
                        <Text
                          style={[
                            styles.amountButtonText,
                            selectedAmount === amount &&
                              styles.amountButtonTextSelected,
                          ]}
                        >
                          {amount}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.customAmountContainer}>
                    <Text style={styles.customAmountLabel}>Custom Amount</Text>
                    <View style={styles.customAmountInputContainer}>
                      <CoinIcon size={16} color="#EC9A15" />
                      <TextInput
                        style={styles.customAmountInput}
                        placeholder="Enter amount"
                        placeholderTextColor="#666"
                        value={customAmount}
                        onChangeText={handleCustomAmountChange}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.amountsContainer}>
                    {moneyAmounts.map((amount) => (
                      <TouchableOpacity
                        key={amount}
                        style={[
                          styles.amountButton,
                          selectedAmount === amount && styles.amountButtonSelected,
                        ]}
                        onPress={() => handleAmountSelect(amount)}
                      >
                        <Text
                          style={[
                            styles.amountButtonText,
                            selectedAmount === amount &&
                              styles.amountButtonTextSelected,
                          ]}
                        >
                          ₹{amount}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.customAmountContainer}>
                    <Text style={styles.customAmountLabel}>Custom Amount</Text>
                    <View style={styles.customAmountInputContainer}>
                      <Text style={styles.currencySymbol}>₹</Text>
                      <TextInput
                        style={styles.customAmountInput}
                        placeholder="Enter amount"
                        placeholderTextColor="#666"
                        value={customAmount}
                        onChangeText={handleCustomAmountChange}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Updated Button Text to Confirm Support */}
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (selectedAmount <= 0 || isLoading) && styles.confirmButtonDisabled,
                ]}
                onPress={handleConfirmTip}
                disabled={selectedAmount <= 0 || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Support</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ⚠️ Added Dynamic Interstitial Warning Alert Modal with "Do not show again" checkbox */}
      <Modal transparent visible={showWarning} animationType="fade" onRequestClose={() => setShowWarning(false)}>
        <View style={styles.modalCenteredOverlay}>
          <View style={styles.warningAlertBox}>
            <Text style={styles.warningAlertTitle}>Confirm Action</Text>
            <Text style={styles.warningAlertText}>
              Are you sure you want to transfer {selectedAmount} {isParticipant ? 'coins' : 'INR'} to support this creator? This process cannot be reversed.
            </Text>

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setDontShowAgain(!dontShowAgain)} 
              style={styles.checkboxRow}
            >
              <View style={[styles.checkboxOutline, dontShowAgain && styles.checkboxChecked]}>
                {dontShowAgain && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Do not show this again</Text>
            </TouchableOpacity>

            <View style={styles.warningActionsRow}>
              <TouchableOpacity style={styles.warningCancelBtn} onPress={() => setShowWarning(false)}>
                <Text style={styles.warningCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.warningAgreeBtn} onPress={handleWarningAgree}>
                <Text style={styles.warningAgreeText}>Agree & Proceed</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Insufficient Coins Popup */}
      <Modal transparent visible={showInsufficientCoins} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.insufficientCoinsModal}>
            <Text style={styles.insufficientCoinsTitle}>Not enough coins</Text>
            <Text style={styles.insufficientCoinsText}>
              You need {selectedAmount} coins but only have {coinBalance} coins.
            </Text>
            <View style={styles.insufficientCoinsButtons}>
              <TouchableOpacity
                style={styles.buyCoinsButton}
                onPress={handleBuyCoins}
              >
                <Text style={styles.buyCoinsButtonText}>Buy Coins</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowInsufficientCoins(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Method Sheet */}
      <PaymentMethodSheet
        visible={showPaymentMethod}
        onClose={() => setShowPaymentMethod(false)}
        amount={selectedAmount}
        onContinue={handlePaymentContinue}
      />

      {/* Success Popup */}
      <SuccessPopup visible={showSuccess} onClose={handleSuccessClose} />
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCenteredOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheet: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    paddingTop: scale(10),
    paddingBottom: Platform.OS === 'ios' ? scale(34) : scale(20),
    paddingHorizontal: scale(18),
    maxHeight: hp(65),
  },
  bottomSheetHandle: {
    width: scale(36),
    height: scale(4),
    backgroundColor: '#666',
    borderRadius: scale(2),
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  bottomSheetTitle: {
    fontSize: getFontSize(20),
    fontWeight: '700',
    color: '#fff',
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  bottomSheetSubtitle: {
    fontSize: getFontSize(14),
    color: '#999',
    marginBottom: scale(18),
    textAlign: 'center',
    fontWeight: '500',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    paddingVertical: scale(10),
    paddingHorizontal: scale(14),
    borderRadius: scale(10),
    marginBottom: spacing.xl,
    gap: scale(6),
  },
  balanceText: {
    fontSize: getFontSize(14),
    color: '#fff',
    fontWeight: '600',
  },
  amountsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(10),
    marginBottom: spacing.xl,
    justifyContent: 'center',
  },
  amountButton: {
    backgroundColor: '#2a2a2a',
    paddingVertical: scale(12),
    paddingHorizontal: scale(18),
    borderRadius: scale(12),
    minWidth: scale(70),
    minHeight: scale(44),
    alignItems: 'center',
    borderWidth: scale(1.5),
    borderColor: '#333',
    flexDirection: 'row',
    gap: scale(6),
    justifyContent: 'center',
  },
  amountButtonSelected: {
    backgroundColor: '#EC9A15',
    borderColor: '#EC9A15',
  },
  amountButtonText: {
    fontSize: getFontSize(15),
    fontWeight: '600',
    color: '#fff',
  },
  amountButtonTextSelected: {
    color: '#fff',
  },
  customAmountContainer: {
    marginBottom: spacing.xl,
  },
  customAmountLabel: {
    fontSize: getFontSize(13),
    color: '#999',
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  customAmountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: scale(10),
    paddingVertical: scale(12),
    paddingHorizontal: scale(14),
    borderWidth: scale(1),
    borderColor: '#333',
    gap: spacing.sm,
    minHeight: scale(44),
  },
  customAmountInput: {
    flex: 1,
    fontSize: getFontSize(15),
    color: '#fff',
    padding: 0,
    minHeight: scale(20),
  },
  currencySymbol: {
    fontSize: getFontSize(15),
    color: '#EC9A15',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#EC9A15',
    paddingVertical: scale(14),
    borderRadius: scale(10),
    alignItems: 'center',
    marginTop: scale(4),
    minHeight: scale(50),
    shadowColor: '#EC9A15',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
    elevation: 5,
  },
  confirmButtonDisabled: {
    backgroundColor: '#444',
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmButtonText: {
    fontSize: getFontSize(16),
    fontWeight: '700',
    color: '#fff',
    letterSpacing: scale(0.5),
  },
  paymentMethodsContainer: {
    gap: scale(12),
    marginBottom: scale(24),
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingVertical: scale(14),
    paddingHorizontal: scale(14),
    borderRadius: scale(10),
    borderWidth: scale(1.5),
    borderColor: '#333',
    gap: scale(10),
    minHeight: scale(50),
  },
  paymentMethodSelected: {
    borderColor: '#EC9A15',
    backgroundColor: '#2a2a2a',
  },
  paymentMethodText: {
    fontSize: getFontSize(15),
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  selectedIndicator: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    backgroundColor: '#EC9A15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicatorText: {
    color: '#fff',
    fontSize: getFontSize(12),
    fontWeight: '700',
  },
  continueButton: {
    backgroundColor: '#EC9A15',
    paddingVertical: scale(14),
    borderRadius: scale(10),
    alignItems: 'center',
    marginTop: scale(4),
    minHeight: scale(50),
    shadowColor: '#EC9A15',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
    elevation: 5,
  },
  continueButtonDisabled: {
    backgroundColor: '#444',
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: getFontSize(16),
    fontWeight: '700',
    color: '#fff',
    letterSpacing: scale(0.5),
  },
  insufficientCoinsModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: scale(18),
    padding: scale(22),
    marginHorizontal: spacing.xl,
    alignItems: 'center',
    borderWidth: scale(1),
    borderColor: '#333',
  },
  insufficientCoinsTitle: {
    fontSize: getFontSize(18),
    fontWeight: '700',
    color: '#fff',
    marginBottom: scale(10),
  },
  insufficientCoinsText: {
    fontSize: getFontSize(14),
    color: '#999',
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: scale(20),
  },
  insufficientCoinsButtons: {
    flexDirection: 'row',
    gap: scale(12),
    width: '100%',
  },
  buyCoinsButton: {
    flex: 1,
    backgroundColor: '#EC9A15',
    paddingVertical: scale(12),
    borderRadius: scale(10),
    alignItems: 'center',
    minHeight: scale(44),
    shadowColor: '#EC9A15',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
    elevation: 5,
  },
  buyCoinsButtonText: {
    fontSize: getFontSize(15),
    fontWeight: '700',
    color: '#fff',
    letterSpacing: scale(0.5),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    paddingVertical: scale(12),
    borderRadius: scale(10),
    alignItems: 'center',
    minHeight: scale(44),
    borderWidth: scale(1),
    borderColor: '#333',
  },
  cancelButtonText: {
    fontSize: getFontSize(15),
    fontWeight: '600',
    color: '#fff',
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: scale(20),
    padding: scale(28),
    alignItems: 'center',
    minWidth: wp(70),
    borderWidth: scale(2),
    borderColor: '#EC9A15',
    shadowColor: '#EC9A15',
    shadowOffset: { width: 0, height: scale(8) },
    shadowOpacity: 0.4,
    shadowRadius: scale(16),
    elevation: 10,
  },
  successMessage: {
    fontSize: getFontSize(20),
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: spacing.xl,
    letterSpacing: scale(0.3),
  },
  successButton: {
    backgroundColor: '#EC9A15',
    paddingVertical: scale(12),
    paddingHorizontal: scale(28),
    borderRadius: scale(10),
    minHeight: scale(44),
    shadowColor: '#EC9A15',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
    elevation: 5,
  },
  successButtonText: {
    fontSize: getFontSize(15),
    fontWeight: '700',
    color: '#fff',
    letterSpacing: scale(0.5),
  },
  sparkleContainer: {
    position: 'absolute',
    width: scale(120),
    height: scale(120),
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkle: {
    position: 'absolute',
  },
  sparkleText: {
    fontSize: getFontSize(24),
  },
  
  // Warning Box Custom Styles
  warningAlertBox: {
    backgroundColor: '#1a1a1a',
    width: wp(85),
    borderRadius: scale(16),
    padding: scale(20),
    borderWidth: scale(1),
    borderColor: '#333',
  },
  warningAlertTitle: {
    fontSize: getFontSize(18),
    fontWeight: '700',
    color: '#fff',
    marginBottom: scale(12),
  },
  warningAlertText: {
    fontSize: getFontSize(14),
    color: '#bbb',
    lineHeight: scale(20),
    marginBottom: scale(16),
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(20),
    gap: scale(8),
  },
  checkboxOutline: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(4),
    borderWidth: scale(1.5),
    borderColor: '#EC9A15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#EC9A15',
  },
  checkmark: {
    color: '#fff',
    fontSize: getFontSize(12),
    fontWeight: '700',
  },
  checkboxLabel: {
    color: '#999',
    fontSize: getFontSize(14),
  },
  warningActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: scale(12),
  },
  warningCancelBtn: {
    paddingVertical: scale(10),
    paddingHorizontal: scale(16),
    borderRadius: scale(8),
  },
  warningCancelText: {
    color: '#999',
    fontSize: getFontSize(14),
    fontWeight: '600',
  },
  warningAgreeBtn: {
    backgroundColor: '#EC9A15',
    paddingVertical: scale(10),
    paddingHorizontal: scale(16),
    borderRadius: scale(8),
  },
  warningAgreeText: {
    color: '#fff',
    fontSize: getFontSize(14),
    fontWeight: '700',
  },
});