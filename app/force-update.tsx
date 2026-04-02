import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ForceUpdateProps {
  minVersion?: string;
}

export default function ForceUpdate({ minVersion }: ForceUpdateProps) {
  const handleUpdate = () => {
    // Open app store/play store based on platform
    const storeUrl = Platform.OS === 'ios'
      ? 'https://apps.apple.com/app/knockster-security' // Replace with actual App Store URL
      : 'https://play.google.com/store/apps/details?id=com.doutyacode.knocksterSecurity'; // Correct package name

    Linking.openURL(storeUrl);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="cloud-download-outline" size={100} color="#3B82F6" />
        <Text style={styles.title}>Update Required</Text>
        <Text style={styles.message}>
          A new version of Knockster Security is available. Please update to continue using the app.
        </Text>
        {minVersion && (
          <Text style={styles.version}>Minimum required version: {minVersion}</Text>
        )}
        <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
          <Text style={styles.updateButtonText}>Update Now</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 24,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  version: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 32,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
