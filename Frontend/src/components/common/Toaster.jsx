
import { Toaster as HotToaster, toast } from 'react-hot-toast';

export const Toaster = () => {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#1a1a1a',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb',
          fontSize: '14px',
          maxWidth: '400px',
        },
        success: {
          style: {
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
          },
          iconTheme: {
            primary: '#22c55e',
            secondary: '#fff',
          },
        },
        error: {
          style: {
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
  );
};

// Export toast for easy access
export { toast };