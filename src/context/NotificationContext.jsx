import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';

const NotificationContext = createContext();

// Ikon za Notifications
const TypeIcon = ({ type }) => {
  if (type === 'success') return <FaCheckCircle className="text-green-400 mt-0.5" />;
  if (type === 'error') return <FaExclamationCircle className="text-red-400 mt-0.5" />;
  return <FaInfoCircle className="text-blue-400 mt-0.5" />;
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  // Kuongeza notification mpya kwa useCallback ili kuzuia re-renders
  const addNotification = useCallback((message, type = 'success') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);

    // Futa notification baada ya sekunde 3
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      {/* Toast Container - Independent Layer (Hailazimishi App.jsx ku-rerender) */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="bg-[#0b0f19] border border-white/10 shadow-2xl rounded-xl p-4 min-w-[280px] pointer-events-auto flex items-start gap-3"
            >
              <TypeIcon type={n.type} />
              <p className="text-white text-sm font-medium leading-snug">{n.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
