// app/index.tsx
// Location: Root splash/redirect screen with app config check

import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/apiService';
import * as Application from 'expo-application';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import ForceUpdate from './force-update';
import Maintenance from './maintenance';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [configChecked, setConfigChecked] = useState(false);
  const [appConfig, setAppConfig] = useState<{
    maintenance: boolean;
    maintenanceMessage: string | null;
    forceUpdate: boolean;
    minVersion: string | null;
  } | null>(null);

  useEffect(() => {
    checkAppConfig();
  }, []);

  useEffect(() => {
    if (configChecked && !isLoading && !appConfig?.maintenance && !appConfig?.forceUpdate) {
      // Navigate based on authentication status
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, configChecked, appConfig]);

  const checkAppConfig = async () => {
    try {
      const response = await apiService.checkAppConfig();
      if (response.success && response.data) {
        setAppConfig(response.data);

        // Check force update
        if (response.data.forceUpdate && response.data.minVersion) {
          const currentVersion = Application.nativeApplicationVersion || '1.0.0';
          const needsUpdate = compareVersions(currentVersion, response.data.minVersion) < 0;
          if (!needsUpdate) {
            // Current version is OK, clear force update
            setAppConfig(prev => prev ? { ...prev, forceUpdate: false } : null);
          }
        }
      }
    } catch (error) {
      console.error('App config check failed:', error);
      // Continue with normal flow if config check fails
    } finally {
      setConfigChecked(true);
    }
  };

  const compareVersions = (v1: string, v2: string): number => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parts1[i] || 0;
      const num2 = parts2[i] || 0;
      if (num1 < num2) return -1;
      if (num1 > num2) return 1;
    }
    return 0;
  };

  // Show maintenance screen
  if (configChecked && appConfig?.maintenance) {
    return <Maintenance message={appConfig.maintenanceMessage || undefined} />;
  }

  // Show force update screen
  if (configChecked && appConfig?.forceUpdate) {
    return <ForceUpdate minVersion={appConfig.minVersion || undefined} />;
  }

  return (
    <View style={styles.container}>
      {/* Logo Container */}
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>K</Text>
        </View>
        <Text style={styles.appName}>KNOCKSTER</Text>
        <Text style={styles.subtitle}>Security</Text>
      </View>

      {/* Loading Indicator */}
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>
          {!configChecked ? 'Checking for updates...' : 'Loading...'}
        </Text>
      </View>

      {/* Version */}
      <Text style={styles.version}>v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  version: {
    position: 'absolute',
    bottom: 40,
    fontSize: 12,
    color: '#475569',
  },
});
