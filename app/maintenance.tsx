import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface MaintenanceProps {
  message?: string;
}

export default function Maintenance({ message }: MaintenanceProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="construct-outline" size={100} color="#F59E0B" />
        <Text style={styles.title}>Under Maintenance</Text>
        <Text style={styles.message}>
          {message || 'We are currently performing scheduled maintenance. Please check back later.'}
        </Text>
        <Text style={styles.subtext}>We apologize for any inconvenience.</Text>
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
  subtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
