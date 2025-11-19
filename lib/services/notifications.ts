import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const PUSH_TOKEN_KEY = '@push_token';
const NOTIFICATIONS_ENABLED_KEY = '@notifications_enabled';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export enum NotificationType {
  LIMIT_ORDER_EXECUTED = 'limit_order_executed',
  LIMIT_ORDER_EXPIRED = 'limit_order_expired',
  LIMIT_ORDER_FAILED = 'limit_order_failed',
  DCA_EXECUTED = 'dca_executed',
  DCA_FAILED = 'dca_failed',
  DCA_COMPLETED = 'dca_completed',
  PRICE_ALERT = 'price_alert',
  TRANSACTION_CONFIRMED = 'transaction_confirmed',
  TRANSACTION_FAILED = 'transaction_failed',
}

export interface NotificationData {
  type: NotificationType;
  orderId?: string;
  strategyId?: string;
  transactionHash?: string;
  amount?: string;
  token?: string;
  price?: string;
  chainId?: string;
  [key: string]: any;
}

/**
 * Register for push notifications
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.log('[Notifications] Must use physical device for push notifications');
      return null;
    }

    // Check existing permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted');
      return null;
    }

    // Get push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.error('[Notifications] No project ID configured');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('[Notifications] Push token:', token.data);

    // Save token
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token.data);

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('automation', {
        name: 'DeFi Automation',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF0080',
      });
    }

    return token.data;
  } catch (error) {
    console.error('[Notifications] Registration failed:', error);
    return null;
  }
}

/**
 * Get stored push token
 */
export async function getPushToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('[Notifications] Failed to get token:', error);
    return null;
  }
}

/**
 * Check if notifications are enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    if (enabled === null) return true; // Default to enabled
    return enabled === 'true';
  } catch (error) {
    console.error('[Notifications] Failed to check enabled state:', error);
    return true;
  }
}

/**
 * Enable/disable notifications
 */
export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled.toString());
  } catch (error) {
    console.error('[Notifications] Failed to set enabled state:', error);
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: NotificationData,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string> {
  const enabled = await areNotificationsEnabled();
  if (!enabled) {
    console.log('[Notifications] Notifications disabled, skipping');
    return '';
  }

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: trigger || null, // null = immediate
    });

    return notificationId;
  } catch (error) {
    console.error('[Notifications] Failed to schedule notification:', error);
    return '';
  }
}

/**
 * Send notification for limit order execution
 */
export async function notifyLimitOrderExecuted(params: {
  orderId: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  price: string;
  transactionHash: string;
}): Promise<void> {
  await scheduleLocalNotification(
    'Limit Order Executed! 🎯',
    `Swapped ${params.amountIn} ${params.tokenIn} for ${params.amountOut} ${params.tokenOut} at ${params.price}`,
    {
      type: NotificationType.LIMIT_ORDER_EXECUTED,
      orderId: params.orderId,
      transactionHash: params.transactionHash,
      amount: params.amountOut,
      token: params.tokenOut,
      price: params.price,
    }
  );
}

/**
 * Send notification for limit order expiration
 */
export async function notifyLimitOrderExpired(params: {
  orderId: string;
  tokenIn: string;
  tokenOut: string;
  targetPrice: string;
}): Promise<void> {
  await scheduleLocalNotification(
    'Limit Order Expired ⏰',
    `Your ${params.tokenIn} → ${params.tokenOut} order expired without execution`,
    {
      type: NotificationType.LIMIT_ORDER_EXPIRED,
      orderId: params.orderId,
      price: params.targetPrice,
    }
  );
}

/**
 * Send notification for DCA execution
 */
export async function notifyDCAExecuted(params: {
  strategyId: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  executionNumber: number;
  remainingExecutions: number;
  transactionHash: string;
}): Promise<void> {
  await scheduleLocalNotification(
    'DCA Strategy Executed 📊',
    `Bought ${params.amountOut} ${params.tokenOut} with ${params.amountIn} ${params.tokenIn}. ${params.remainingExecutions} executions remaining.`,
    {
      type: NotificationType.DCA_EXECUTED,
      strategyId: params.strategyId,
      transactionHash: params.transactionHash,
      amount: params.amountOut,
      token: params.tokenOut,
    }
  );
}

/**
 * Send notification for DCA completion
 */
export async function notifyDCACompleted(params: {
  strategyId: string;
  tokenIn: string;
  tokenOut: string;
  totalAmountIn: string;
  totalAmountOut: string;
  totalExecutions: number;
}): Promise<void> {
  await scheduleLocalNotification(
    'DCA Strategy Completed! 🎉',
    `Finished all ${params.totalExecutions} purchases. Total: ${params.totalAmountOut} ${params.tokenOut} from ${params.totalAmountIn} ${params.tokenIn}`,
    {
      type: NotificationType.DCA_COMPLETED,
      strategyId: params.strategyId,
      amount: params.totalAmountOut,
      token: params.tokenOut,
    }
  );
}

/**
 * Send notification for price alert
 */
export async function notifyPriceAlert(params: {
  token: string;
  currentPrice: string;
  targetPrice: string;
  direction: 'above' | 'below';
}): Promise<void> {
  const emoji = params.direction === 'above' ? '🚀' : '📉';
  await scheduleLocalNotification(
    `Price Alert ${emoji}`,
    `${params.token} is now ${params.direction} your target of $${params.targetPrice} (Current: $${params.currentPrice})`,
    {
      type: NotificationType.PRICE_ALERT,
      token: params.token,
      price: params.currentPrice,
    }
  );
}

/**
 * Send notification for transaction confirmation
 */
export async function notifyTransactionConfirmed(params: {
  transactionHash: string;
  type: string;
  amount?: string;
  token?: string;
}): Promise<void> {
  const message = params.amount && params.token
    ? `${params.type} of ${params.amount} ${params.token} confirmed`
    : `${params.type} transaction confirmed`;

  await scheduleLocalNotification(
    'Transaction Confirmed ✅',
    message,
    {
      type: NotificationType.TRANSACTION_CONFIRMED,
      transactionHash: params.transactionHash,
    }
  );
}

/**
 * Send notification for transaction failure
 */
export async function notifyTransactionFailed(params: {
  transactionHash?: string;
  type: string;
  reason?: string;
}): Promise<void> {
  const message = params.reason
    ? `${params.type} failed: ${params.reason}`
    : `${params.type} transaction failed`;

  await scheduleLocalNotification(
    'Transaction Failed ❌',
    message,
    {
      type: NotificationType.TRANSACTION_FAILED,
      transactionHash: params.transactionHash,
    }
  );
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('[Notifications] Failed to cancel notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('[Notifications] Failed to cancel all notifications:', error);
  }
}

/**
 * Get notification history (last 30 days)
 */
export async function getNotificationHistory(): Promise<Notifications.Notification[]> {
  try {
    const notifications = await Notifications.getPresentedNotificationsAsync();
    return notifications;
  } catch (error) {
    console.error('[Notifications] Failed to get history:', error);
    return [];
  }
}

/**
 * Add notification listener
 */
export function addNotificationListener(
  handler: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(handler);
}

/**
 * Add notification response listener (when user taps notification)
 */
export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

/**
 * Remove notification listeners
 */
export function removeNotificationSubscription(
  subscription: Notifications.Subscription
): void {
  subscription.remove();
}
