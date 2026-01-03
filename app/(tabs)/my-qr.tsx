// Location: app/(tabs)/my-qr.tsx
// Guard's QR code for L3/L4 verification

import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/apiService';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useRef } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;
const POLLING_INTERVAL = 3000; // Poll every 3 seconds

interface PendingL3Scan {
  invitationId: string;
  guestName: string;
  guestPhone: string;
  employeeName: string;
  scannedAt: string;
  securityLevel: number;
}

interface PendingL4Otp {
  invitationId: string;
  guestName: string;
  guestPhone: string;
  employeeName: string;
  expiresAt: string;
  generatedAt: string;
  securityLevel: number;
}

export default function MyQRScreen() {
  const { guard } = useAuth();
  const [qrData, setQrData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showL3Modal, setShowL3Modal] = useState(false);
  const [showL4Modal, setShowL4Modal] = useState(false);
  const [l3ScanData, setL3ScanData] = useState<PendingL3Scan | null>(null);
  const [l4OtpData, setL4OtpData] = useState<PendingL4Otp | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadQRCode();
    startPolling();

    return () => {
      stopPolling();
    };
  }, []);

  const loadQRCode = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getGuardQR();
      if (response.success && response.data) {
        setQrData(response.data.qrCode);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load QR code');
      console.error('QR load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = () => {
    // Initial check
    checkPendingActions();

    // Poll every 3 seconds
    pollingIntervalRef.current = setInterval(() => {
      checkPendingActions();
    }, POLLING_INTERVAL);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const checkPendingActions = async () => {
    try {
      const response = await apiService.checkPendingActions();

      if (response.success && response.data) {
        const { hasL3Scans, hasL4Otps, pendingL3Scans, pendingL4Otps } = response.data;

        // Show L3 success popup
        if (hasL3Scans && pendingL3Scans.length > 0 && !showL3Modal) {
          setL3ScanData(pendingL3Scans[0]);
          setShowL3Modal(true);
        }

        // Show L4 OTP input popup
        if (hasL4Otps && pendingL4Otps.length > 0 && !showL4Modal) {
          setL4OtpData(pendingL4Otps[0]);
          setShowL4Modal(true);
        }
      }
    } catch (error) {
      // Silently fail to not disturb user with polling errors
      console.error('Polling error:', error);
    }
  };

  const handleL3Acknowledge = () => {
    setShowL3Modal(false);
    setL3ScanData(null);
  };

  const handleVerifyOtp = async () => {
    if (!otpInput || !l4OtpData) return;

    try {
      setIsVerifyingOtp(true);
      const response = await apiService.verifyOtp({
        invitationId: l4OtpData.invitationId,
        otpCode: otpInput,
      });

      if (response.success) {
        Alert.alert(
          'Access Granted',
          `${l4OtpData.guestName} has been granted access (Level 4)`,
          [{ text: 'OK', onPress: () => {
            setShowL4Modal(false);
            setL4OtpData(null);
            setOtpInput('');
          }}]
        );
      } else {
        Alert.alert('Error', response.error || 'Invalid OTP code');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify OTP');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleCancelL4 = () => {
    setShowL4Modal(false);
    setL4OtpData(null);
    setOtpInput('');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Generating QR code...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My QR Code</Text>
        <Text style={styles.headerSubtitle}>For L3/L4 guest verification</Text>
      </View>

      {/* Profile Info */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color="#3B82F6" />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{guard?.username}</Text>
          <Text style={styles.profileOrg}>
            {guard?.organization?.name || 'No Organization'}
          </Text>
          <View style={styles.shiftInfo}>
            <Ionicons name="time-outline" size={14} color="#64748B" />
            <Text style={styles.shiftText}>
              {guard?.shiftStartTime && guard?.shiftEndTime
                ? `${guard.shiftStartTime} - ${guard.shiftEndTime}`
                : 'No shift assigned'}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                guard?.status === 'active' ? '#10B98120' : '#EF444420',
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: guard?.status === 'active' ? '#10B981' : '#EF4444',
              },
            ]}
          >
            {guard?.status === 'active' ? 'On Duty' : 'Off Duty'}
          </Text>
        </View>
      </View>

      {/* QR Code */}
      <View style={styles.qrContainer}>
        <View style={styles.qrCard}>
          {qrData ? (
            <QRCode
              value={qrData}
              size={SCREEN_WIDTH - 100}
              backgroundColor="#FFFFFF"
              color="#000000"
            />
          ) : (
            <View style={styles.qrPlaceholder}>
              <Ionicons name="qr-code" size={120} color="#334155" />
              <Text style={styles.qrPlaceholderText}>QR code unavailable</Text>
            </View>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
          <Text style={styles.instructionsText}>
            Guest scans this code for L3/L4 access verification
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={loadQRCode}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={20} color="#3B82F6" />
          <Text style={styles.actionButtonText}>Refresh QR</Text>
        </TouchableOpacity>
      </View>

      {/* L3 Success Modal */}
      <Modal
        visible={showL3Modal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleL3Acknowledge}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              </View>
              <Text style={styles.modalTitle}>Access Granted</Text>
              <Text style={styles.modalSubtitle}>Level 3 Verification</Text>
            </View>

            {l3ScanData && (
              <View style={styles.modalBody}>
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Guest</Text>
                    <Text style={styles.infoValue}>{l3ScanData.guestName}</Text>
                    <Text style={styles.infoPhone}>{l3ScanData.guestPhone}</Text>
                  </View>
                </View>

                <View style={styles.infoDivider} />

                <View style={styles.infoRow}>
                  <Ionicons name="briefcase-outline" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Visiting</Text>
                    <Text style={styles.infoValue}>{l3ScanData.employeeName}</Text>
                  </View>
                </View>

                <View style={styles.infoDivider} />

                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Scanned At</Text>
                    <Text style={styles.infoValue}>{l3ScanData.scannedAt}</Text>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleL3Acknowledge}
              activeOpacity={0.7}
            >
              <Text style={styles.modalButtonText}>Acknowledge</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* L4 OTP Input Modal */}
      <Modal
        visible={showL4Modal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelL4}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={[styles.successIcon, { backgroundColor: '#F59E0B20' }]}>
                <Ionicons name="key" size={48} color="#F59E0B" />
              </View>
              <Text style={styles.modalTitle}>Verify OTP</Text>
              <Text style={styles.modalSubtitle}>Level 4 Verification</Text>
            </View>

            {l4OtpData && (
              <View style={styles.modalBody}>
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Guest</Text>
                    <Text style={styles.infoValue}>{l4OtpData.guestName}</Text>
                    <Text style={styles.infoPhone}>{l4OtpData.guestPhone}</Text>
                  </View>
                </View>

                <View style={styles.infoDivider} />

                <View style={styles.infoRow}>
                  <Ionicons name="briefcase-outline" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Visiting</Text>
                    <Text style={styles.infoValue}>{l4OtpData.employeeName}</Text>
                  </View>
                </View>

                <View style={styles.infoDivider} />

                <Text style={styles.otpLabel}>Enter OTP shown on guest's phone:</Text>
                <TextInput
                  style={styles.otpInput}
                  value={otpInput}
                  onChangeText={setOtpInput}
                  placeholder="000000"
                  placeholderTextColor="#64748B"
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus={true}
                />
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelL4}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.verifyButton, isVerifyingOtp && styles.disabledButton]}
                onPress={handleVerifyOtp}
                activeOpacity={0.7}
                disabled={isVerifyingOtp || otpInput.length !== 6}
              >
                {isVerifyingOtp ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalButtonText}>Verify OTP</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  profileCard: {
    marginHorizontal: 24,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F620',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileOrg: {
    fontSize: 13,
    color: '#64748B',
  },
  shiftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  shiftText: {
    fontSize: 12,
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  qrContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  qrPlaceholder: {
    width: SCREEN_WIDTH - 100,
    height: SCREEN_WIDTH - 100,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  qrPlaceholderText: {
    fontSize: 14,
    color: '#64748B',
  },
  instructionsCard: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  instructionsText: {
    flex: 1,
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B98120',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  modalBody: {
    marginBottom: 24,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoPhone: {
    fontSize: 13,
    color: '#94A3B8',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#334155',
  },
  otpLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    marginBottom: 8,
  },
  otpInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 8,
  },
  modalButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#334155',
  },
  cancelButtonText: {
    color: '#94A3B8',
  },
  verifyButton: {
    flex: 1,
    backgroundColor: '#10B981',
  },
  disabledButton: {
    opacity: 0.5,
  },
});