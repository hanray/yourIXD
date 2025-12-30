import { useEffect, type CSSProperties } from "react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast = ({ message, type, onClose, duration = 3000 }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6";
  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";

  return (
    <div style={{ ...toastContainer, background: bgColor }} role="alert">
      <span style={toastIcon}>{icon}</span>
      <span style={toastMessage}>{message}</span>
    </div>
  );
};

const toastContainer: CSSProperties = {
  position: "fixed",
  bottom: 24,
  right: 24,
  padding: "14px 18px",
  borderRadius: 12,
  color: "white",
  fontWeight: 600,
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  gap: 10,
  boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
  animation: "slideInUp 0.3s ease-out",
  zIndex: 10000,
  maxWidth: 400
};

const toastIcon: CSSProperties = {
  fontSize: 18,
  fontWeight: 700
};

const toastMessage: CSSProperties = {
  flex: 1
};
