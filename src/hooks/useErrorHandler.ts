import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ErrorContext {
  source?: string;
  userId?: string;
  action?: string;
  [key: string]: unknown;
}

export const useErrorHandler = () => {
  const { toast } = useToast();

  const sanitizeError = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Ralat tidak diketahui berlaku';
  };

  const logError = useCallback((
    error: unknown,
    context?: ErrorContext
  ) => {
    const errorMessage = sanitizeError(error);
    const timestamp = new Date().toISOString();
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${timestamp}] Error:`, {
        message: errorMessage,
        context,
        fullError: error,
      });
    }

    // In production, send to error tracking service (e.g., Sentry)
    // logToErrorService({ message: errorMessage, context, timestamp });

    return errorMessage;
  }, []);

  const handleError = useCallback((
    error: unknown,
    context?: ErrorContext & { userFacingMessage?: string; showToast?: boolean }
  ) => {
    const errorMessage = logError(error, context);
    
    if (context?.showToast !== false) {
      toast({
        title: 'Ralat',
        description: context?.userFacingMessage || errorMessage,
        variant: 'destructive',
      });
    }

    return errorMessage;
  }, [logError, toast]);

  const handleNetworkError = useCallback((
    error: unknown,
    retryCount: number = 0
  ) => {
    const errorMessage = sanitizeError(error);
    
    if (retryCount >= 3) {
      handleError(error, {
        source: 'network',
        userFacingMessage: 'Sambungan rangkaian gagal. Sila semak koneksi anda dan cuba lagi.',
        showToast: true,
      });
    }

    return errorMessage;
  }, [handleError]);

  const handleValidationError = useCallback((
    errors: Record<string, string>
  ) => {
    const errorList = Object.entries(errors)
      .map(([field, message]) => `${field}: ${message}`)
      .join('\n');

    toast({
      title: 'Ralat Validasi',
      description: errorList,
      variant: 'destructive',
    });

    return errors;
  }, [toast]);

  return {
    handleError,
    handleNetworkError,
    handleValidationError,
    logError,
    sanitizeError,
  };
};
