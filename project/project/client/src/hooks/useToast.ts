import { toast } from 'sonner';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastOptions {
  duration?: number;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useToast() {
  const showToast = (type: ToastType, title: string, options?: ToastOptions) => {
    const commonOptions = {
      duration: options?.duration || 3000,
      description: options?.description,
      action: options?.action,
    };

    switch (type) {
      case 'success':
        return toast.success(title, commonOptions);
      case 'error':
        return toast.error(title, commonOptions);
      case 'warning':
        return toast(title, {
          ...commonOptions,
          icon: '⚠️',
        });
      case 'info':
        return toast.info(title, commonOptions);
      case 'loading':
        return toast.loading(title, commonOptions);
      default:
        return toast(title, commonOptions);
    }
  };

  return {
    success: (title: string, options?: ToastOptions) => showToast('success', title, options),
    error: (title: string, options?: ToastOptions) => showToast('error', title, options),
    warning: (title: string, options?: ToastOptions) => showToast('warning', title, options),
    info: (title: string, options?: ToastOptions) => showToast('info', title, options),
    loading: (title: string, options?: ToastOptions) => showToast('loading', title, options),
    dismiss: (toastId?: string | number) => toast.dismiss(toastId),
  };
}
