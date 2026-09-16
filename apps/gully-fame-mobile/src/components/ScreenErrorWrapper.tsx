/**
 * Screen Error Wrapper
 * Provides consistent error handling and fallback UI for screens
 */

import React, { ReactNode } from 'react';
import { View, SafeAreaView } from 'react-native';
import { EmptyStateFallback } from './ErrorFallbacks';

interface ScreenErrorWrapperProps {
  error?: Error | null;
  isLoading?: boolean;
  isEmpty?: boolean;
  children: ReactNode;
  onRetry?: () => void;
  onHome?: () => void;
  emptyStateProps?: {
    emoji?: string;
    title?: string;
    message?: string;
    actionLabel?: string;
  }
  fallbackUI?: ReactNode;
}

export const ScreenErrorWrapper: React.FC<ScreenErrorWrapperProps> = ({
  error,
  isLoading = false,
  isEmpty = false,
  children,
  onRetry,
  onHome,
  emptyStateProps = {},
  fallbackUI,
}) => {
  // Show error state
  if (error && !fallbackUI) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <EmptyStateFallback
            emoji="⚠️"
            title="Error"
            message={error.message || 'An error occurred'}
            actionLabel="Try Again"
            onAction={onRetry}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Show custom fallback UI
  if (error && fallbackUI) {
    return <SafeAreaView style={{ flex: 1 }}>{fallbackUI}</SafeAreaView>;
  }

  // Show empty state
  if (isEmpty && !isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <EmptyStateFallback
            emoji={emptyStateProps.emoji || '📭'}
            title={emptyStateProps.title || 'No Data'}
            message={emptyStateProps.message || 'No content available'}
            actionLabel={emptyStateProps.actionLabel || 'Refresh'}
            onAction={onRetry}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Show normal content
  return <>{children}</>;
};

export default ScreenErrorWrapper;
