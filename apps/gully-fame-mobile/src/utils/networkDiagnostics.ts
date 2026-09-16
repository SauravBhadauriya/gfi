/**
 * Network Diagnostics Utility
 * 
 * Helps diagnose NoRouteToHostException and other network connectivity issues
 * in the Gully Fame mobile app.
 */

import * as NetInfo from '@react-native-community/netinfo';

export interface NetworkDiagnostics {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  details: string;
  recommendations: string[];
}

/**
 * Perform comprehensive network diagnostics
 */
export async function diagnoseNetworkIssue(): Promise<NetworkDiagnostics> {
  try {
    const state = await NetInfo.fetch();

    const isConnected = state.isConnected === true;
    const isInternetReachable = state.isInternetReachable;
    const connectionType = state.type || 'UNKNOWN';

    const diagnostics: NetworkDiagnostics = {
      isConnected,
      isInternetReachable,
      type: connectionType,
      details: '',
      recommendations: [],
    };

    console.log('[networkDiagnostics] Network State:', {
      isConnected,
      isInternetReachable,
      type: connectionType,
      details: state.details,
    });

    // Analyze connectivity
    if (!isConnected) {
      diagnostics.details = 'Device is NOT connected to any network';
      diagnostics.recommendations.push('✓ Enable WiFi or mobile data');
      diagnostics.recommendations.push('✓ Check airplane mode is OFF');
      diagnostics.recommendations.push('✓ Restart the device');
    } else if (isInternetReachable === false) {
      diagnostics.details = 'Device is connected but CANNOT reach the internet';
      diagnostics.recommendations.push('✓ Check WiFi/mobile data signal strength');
      diagnostics.recommendations.push('✓ Try a different WiFi network');
      diagnostics.recommendations.push('✓ Check if your ISP is working');
    } else if (isInternetReachable === null) {
      diagnostics.details = 'Internet reachability status is UNKNOWN';
      diagnostics.recommendations.push('✓ Wait a moment and retry');
    } else {
      diagnostics.details = `Device has internet connectivity (${connectionType})`;
      diagnostics.recommendations.push('✓ Network appears OK - issue may be backend-specific');
      diagnostics.recommendations.push('✓ Check if the backend API server is running');
      diagnostics.recommendations.push('✓ Verify you can reach the API URL in a web browser');
    }

    return diagnostics;
  } catch (error) {
    console.error('[networkDiagnostics] Error checking network:', error);
    return {
      isConnected: false,
      isInternetReachable: null,
      type: 'ERROR',
      details: 'Failed to check network status: ' + String(error),
      recommendations: ['✓ Try again in a moment', '✓ Restart the app'],
    };
  }
}

/**
 * Test connectivity to a specific URL
 */
export async function testUrlConnectivity(url: string): Promise<{
  url: string;
  reachable: boolean;
  statusCode?: number;
  error?: string;
  duration: number;
}> {
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      timeout: 10000, // 10 second timeout
    });

    const duration = Date.now() - startTime;

    const result = {
      url,
      reachable: response.ok,
      statusCode: response.status,
      duration,
    };

    console.log('[networkDiagnostics] URL Connectivity Test:', result);
    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;

    const result = {
      url,
      reachable: false,
      error: error.message || String(error),
      duration,
    };

    console.error('[networkDiagnostics] URL Connectivity Test Failed:', result);
    return result;
  }
}

/**
 * Generate a human-readable diagnostic report
 */
export function generateDiagnosticReport(
  diagnostics: NetworkDiagnostics,
  apiUrl: string
): string {
  let report = '╔════════════════════════════════════════════════════════════╗\n';
  report += '║          NETWORK DIAGNOSTICS REPORT                          ║\n';
  report += '╚════════════════════════════════════════════════════════════╝\n\n';

  report += `📡 CONNECTION STATUS\n`;
  report += `   Connected: ${diagnostics.isConnected ? '✅ YES' : '❌ NO'}\n`;
  report += `   Internet: ${
    diagnostics.isInternetReachable === true
      ? '✅ YES'
      : diagnostics.isInternetReachable === false
        ? '❌ NO'
        : '❓ UNKNOWN'
  }\n`;
  report += `   Type: ${diagnostics.type}\n`;
  report += `   Details: ${diagnostics.details}\n\n`;

  report += `🔗 API CONFIGURATION\n`;
  report += `   URL: ${apiUrl}\n\n`;

  report += `💡 RECOMMENDATIONS\n`;
  diagnostics.recommendations.forEach((rec) => {
    report += `   ${rec}\n`;
  });

  report += '\n';
  report += `🔍 TROUBLESHOOTING STEPS\n`;
  report += `   1. Check if device/emulator has internet connectivity\n`;
  report += `   2. Verify backend API server is running and accessible\n`;
  report += `   3. Ensure .env file has correct EXPO_PUBLIC_API_BASE_URL\n`;
  report += `   4. For Android emulator, use: http://10.0.2.2:3000 (or your port)\n`;
  report += `   5. For real device, use your machine's local IP\n`;
  report += `   6. Check firewall/VPN settings blocking the connection\n`;

  return report;
}
