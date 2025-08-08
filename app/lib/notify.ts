'use client';

// Global notification bridge so non-React modules can trigger app toasts
export type AppNotificationType = 'success' | 'error' | 'warning' | 'info'

export interface AppNotificationOptions {
  duration?: number
  autoClose?: boolean
  action?: { label: string; onClick: () => void }
}

export type AppNotifyFn = (
  type: AppNotificationType,
  title: string,
  message?: string,
  options?: AppNotificationOptions
) => void

let notifyHandler: AppNotifyFn | null = null

export function setNotifyHandler(handler: AppNotifyFn | null) {
  notifyHandler = handler
}

export function notify(
  type: AppNotificationType,
  title: string,
  message?: string,
  options?: AppNotificationOptions
) {
  if (notifyHandler) {
    notifyHandler(type, title, message, options)
  }
}

export const notifySuccess = (
  title: string,
  message?: string,
  options?: AppNotificationOptions
) => notify('success', title, message, options)

export const notifyError = (
  title: string,
  message?: string,
  options?: AppNotificationOptions
) => notify('error', title, message, options)

export const notifyInfo = (
  title: string,
  message?: string,
  options?: AppNotificationOptions
) => notify('info', title, message, options)

export const notifyWarning = (
  title: string,
  message?: string,
  options?: AppNotificationOptions
) => notify('warning', title, message, options)
