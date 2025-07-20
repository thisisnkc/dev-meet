// src/components/ui/toast.tsx
import * as React from "react";
import {
  ToastProvider as RadixToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
} from "@radix-ui/react-toast";

export interface ToastMessage {
  title: string;
  description?: string;
  duration?: number;
}

const ToastContext = React.createContext<
  | {
      showToast: (msg: ToastMessage) => void;
    }
  | undefined
>(undefined);

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState<ToastMessage | null>(null);

  const showToast = (msg: ToastMessage) => {
    setMessage(msg);
    setOpen(false);
    setTimeout(() => setOpen(true), 10); // Ensure close before reopen
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <RadixToastProvider swipeDirection="right">
        {children}
        <Toast
          open={open}
          onOpenChange={setOpen}
          duration={message?.duration || 3000}
        >
          <ToastTitle>{message?.title}</ToastTitle>
          {message?.description && (
            <ToastDescription>{message.description}</ToastDescription>
          )}
        </Toast>
        <ToastViewport className="fixed bottom-4 right-4 z-[100]" />
      </RadixToastProvider>
    </ToastContext.Provider>
  );
};

export default ToastProvider;

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
