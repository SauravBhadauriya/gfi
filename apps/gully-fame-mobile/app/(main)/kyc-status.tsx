

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { kycService } from "@/api/services/kycService";


type KYCStatusType = 'NOT_STARTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export default function KYCStatusScreen() {
  
  const [kycStatus, setKycStatus] = useState<KYCStatusType>('NOT_STARTED');
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingStatus, setIsFetchingStatus] = useState(true);

  // Load KYC status on screen focus
  useFocusEffect(
    React.useCallback(() => {
      fetchKYCStatus();
    }, [])
  );

  const fetchKYCStatus = async () => {
    try {
      setIsFetchingStatus(true);
      const response = await kycService.getKYCStatus();
      
      if (response.success && response.data) {
        const status = response.data.status;
        if (status === 'approved') {
          setKycStatus('APPROVED');
        } else if (status === 'pending' || status === 'under_review') {
          setKycStatus('PENDING');
        } else if (status === 'rejected') {
          setKycStatus('REJECTED');
        } else {
          setKycStatus('NOT_STARTED');
        }
      }
    } catch (error) {
      console.error("Error fetching KYC status:", error);
    } finally {
      setIsFetchingStatus(false);
    }
  };

  const handleSubmitKYC = async () => {
    if (!panNumber.trim() || !aadhaarNumber.trim()) {
      Alert.alert("Error", "Please fill all the document details.");
      return;
    }
    
    if (aadhaarNumber.replace(/\D/g, '').length !== 12) {
      Alert.alert("Error", "Aadhaar Number must be 12 digits.");
      return;
    }

    setIsLoading(true);
    
    try {
      // Submit KYC to real API endpoint
      const response = await kycService.submitKYC({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'other',
        address: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        documents: [
          {
            type: 'pan',
            documentNumber: panNumber,
          },
          {
            type: 'aadhar',
            documentNumber: aadhaarNumber,
          },
        ],
      });

      if (response.success) {
        setKycStatus('PENDING');
        Alert.alert("Success", "KYC Documents submitted successfully for review!");
        setPanNumber('');
        setAadhaarNumber('');
      } else {
        Alert.alert("Error", response.message || "Failed to submit KYC documents.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "An error occurred while submitting KYC.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingStatus) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#3C2610" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>KYC Verification</Text>
          <View style={styles.backButton} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#EC9A15" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3C2610" />

      {}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {}
        {kycStatus === 'APPROVED' && (
          <View style={[styles.statusCard, { borderColor: '#25D366' }]}>
            <Ionicons name="checkmark-circle" size={60} color="#25D366" />
            <Text style={styles.statusTitle}>KYC Verified Successfully!</Text>
            <Text style={styles.statusDesc}>
              Congratulations! Aapka account fully verified hai. Ab aap bina kisi limit ke apne rewards aur money wallet se withdraw kar sakte hain.
            </Text>
          </View>
        )}

        {}
        {kycStatus === 'PENDING' && (
          <View style={[styles.statusCard, { borderColor: '#EC9A15' }]}>
            <Ionicons name="time" size={60} color="#EC9A15" />
            <Text style={styles.statusTitle}>KYC Verification Pending</Text>
            <Text style={styles.statusDesc}>
              Humari team aapke documents ko review kar rahi hai. Isme aamtaur par 24-48 ghante ka samay lagta hai. Kirpa karke prateeksha karein.
            </Text>
          </View>
        )}

        {}
        {kycStatus === 'REJECTED' && (
          <View style={[styles.statusCard, { borderColor: '#ff4444' }]}>
            <Ionicons name="alert-circle" size={60} color="#ff4444" />
            <Text style={styles.statusTitle}>KYC Rejected</Text>
            <Text style={styles.statusDesc}>
              Aapke documents clear nahi the ya details mismatch ho rahi thi. Please sahi details ke sath dobara apply karein.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => setKycStatus('NOT_STARTED')}>
              <Text style={styles.retryButtonText}>Re-upload Documents</Text>
            </TouchableOpacity>
          </View>
        )}

        {}
        {kycStatus === 'NOT_STARTED' && (
          <View>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ⚠️ Wallet se cash withdraw karne ke liye KYC mandatory hai. Apne valid government documents hi upload karein.
              </Text>
            </View>

            {}
            <View style={styles.formCard}>
              <Text style={styles.cardHeading}>
                <FontAwesome5 name="id-card" size={18} color="#EC9A15" /> PAN Card Details
              </Text>
              <Text style={styles.label}>PAN Card Number</Text>
              <TextInput
                style={styles.input}
                placeholder="ABCDE1234F"
                placeholderTextColor="#666"
                value={panNumber}
                onChangeText={(text) => setPanNumber(text.toUpperCase())}
                maxLength={10}
                autoCapitalize="characters"
              />
            </View>

            {}
            <View style={styles.formCard}>
              <Text style={styles.cardHeading}>
                <FontAwesome5 name="fingerprint" size={18} color="#EC9A15" /> Aadhaar Card Details
              </Text>
              <Text style={styles.label}>12-Digit Aadhaar Number</Text>
              <TextInput
                style={styles.input}
                placeholder="0000 0000 0000"
                placeholderTextColor="#666"
                value={aadhaarNumber}
                onChangeText={(text) => setAadhaarNumber(text.replace(/\D/g, ''))}
                keyboardType="numeric"
                maxLength={12}
              />
            </View>

            {}
            <TouchableOpacity 
              style={[styles.submitButton, isLoading && styles.disabledButton]} 
              onPress={handleSubmitKYC}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Documents</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3C2610",
    paddingTop: Platform.OS === "android" ? 20 : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: "#252525",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    borderWidth: 1.5,
    marginTop: 20,
  },
  statusTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  statusDesc: {
    color: "#ccc",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: "#EC9A15",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 20,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  infoBox: {
    backgroundColor: "rgba(236, 154, 21, 0.15)",
    borderWidth: 1,
    borderColor: "#EC9A15",
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  infoText: {
    color: "#EC9A15",
    fontSize: 13,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: "#252525",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.1)",
  },
  cardHeading: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
    gap: 8,
  },
  label: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#EC9A15",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});