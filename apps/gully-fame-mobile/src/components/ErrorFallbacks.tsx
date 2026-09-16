/**
 * Error Fallback UI Components
 * Used for specific error scenarios (network, permission, loading)
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';

/**
 * Network Error Fallback
 */
export const NetworkErrorFallback = ({
  message = 'No internet connection',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text style={styles.emoji}>📡</Text>
      <Text style={styles.title}>Connection Error</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  </SafeAreaView>
);

/**
 * Permission Error Fallback
 */
export const PermissionErrorFallback = ({
  permission = 'Camera',
  message = 'Permission required to proceed',
  onRetry,
}: {
  permission?: string;
  message?: string;
  onRetry?: () => void;
}) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text style={styles.emoji}>🔒</Text>
      <Text style={styles.title}>{permission} Permission</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.subtitle}>
        Please enable {permission.toLowerCase()} access in Settings
      </Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  </SafeAreaView>
);

/**
 * Loading Error Fallback
 */
export const LoadingErrorFallback = ({ message = 'Loading...' }) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={[styles.message, { marginTop: 16 }]}>{message}</Text>
    </View>
  </SafeAreaView>
);

/**
 * Empty State Fallback
 */
export const EmptyStateFallback = ({
  emoji = '📭',
  title = 'No Data',
  message = 'No content available',
  actionLabel = 'Refresh',
  onAction,
}: {
  emoji?: string;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onAction && (
        <TouchableOpacity style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  </SafeAreaView>
);

/**
 * Server Error Fallback
 */
export const ServerErrorFallback = ({
  statusCode = 500,
  message = 'Server error occurred',
  onRetry,
}: {
  statusCode?: number;
  message?: string;
  onRetry?: () => void;
}) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text style={styles.emoji}>⚙️</Text>
      <Text style={styles.title}>Server Error ({statusCode})</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.subtitle}>
        Please try again later or contact support if the problem persists
      </Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  </SafeAreaView>
);

/**
 * Timeout Error Fallback
 */
export const TimeoutErrorFallback = ({
  message = 'Request timed out',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text style={styles.emoji}>⏱️</Text>
      <Text style={styles.title}>Request Timeout</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.subtitle}>
        The request took too long. Please check your connection and try again.
      </Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  </SafeAreaView>
);

/**
 * Not Found Fallback (404)
 */
export const NotFoundFallback = ({
  message = 'The page you are looking for does not exist',
  onHome,
}: {
  message?: string;
  onHome?: () => void;
}) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text style={styles.emoji}>🔍</Text>
      <Text style={styles.title}>Not Found</Text>
      <Text style={styles.message}>{message}</Text>
      {onHome && (
        <TouchableOpacity style={styles.button} onPress={onHome}>
          <Text style={styles.buttonText}>Go Home</Text>
        </TouchableOpacity>
      )}
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  button: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default {
  NetworkErrorFallback,
  PermissionErrorFallback,
  LoadingErrorFallback,
  EmptyStateFallback,
  ServerErrorFallback,
  TimeoutErrorFallback,
  NotFoundFallback,
};
