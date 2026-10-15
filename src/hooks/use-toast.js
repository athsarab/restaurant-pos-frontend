import { useState } from "react";

const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const toast = ({ title, description, duration = 3000 }) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { id, title, description };
    
    setToasts(prev => [...prev, newToast]);
    
    // Simple console log for toast feedback
    console.log(`✅ ${title}: ${description}`);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  };

  return { toast };
};

export { useToast };