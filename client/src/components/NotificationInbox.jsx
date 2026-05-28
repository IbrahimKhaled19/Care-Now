import { Inbox } from "@novu/react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const lightAppearance = {
  variables: {
    colorPrimary: "#0d9488",
    colorPrimaryForeground: "#ffffff",
    colorSecondary: "#f0f7f7",
    colorSecondaryForeground: "#2a3e3e",
    colorCounter: "#ef4444",
    colorCounterForeground: "#ffffff",
    colorBackground: "#ffffff",
    colorRing: "#0d9488",
    colorForeground: "#1a2e2e",
    colorNeutral: "#e0eded",
    colorShadow: "none",
    fontSize: "13px",
    borderRadius: "10px",
  },
  elements: {
    bellIcon: { color: "#5f8585", width: "20px", height: "20px" },
    inbox__notificationList__item: { borderBottom: "1px solid #f0f7f7" },
    inbox__notificationList__item__content__header__subject: { color: "#1a2e2e", fontWeight: "600", fontSize: "13px" },
    inbox__notificationList__item__content__header__timestamp: { color: "#9ca3af", fontSize: "11px" },
    inbox__notificationList__item__content__body: { color: "#5f8585", fontSize: "12px" },
    inbox__notificationList__item__unread_dot: { backgroundColor: "#0d9488" },
    popover__content: { borderRadius: "12px", border: "1px solid #e0eded", boxShadow: "none", width: "380px" },
    popover__content__header: { borderBottom: "1px solid #f0f7f7", padding: "14px 16px" },
    popover__content__header__title: { color: "#1a2e2e", fontWeight: "700", fontSize: "15px" },
  },
};

const darkAppearance = {
  variables: {
    colorPrimary: "#2dd4bf",
    colorPrimaryForeground: "#1a1f1f",
    colorSecondary: "#2a3333",
    colorSecondaryForeground: "#e0eded",
    colorCounter: "#ef4444",
    colorCounterForeground: "#ffffff",
    colorBackground: "#222a2a",
    colorRing: "#2dd4bf",
    colorForeground: "#e0eded",
    colorNeutral: "#3a5454",
    colorShadow: "0 2px 8px rgba(0,0,0,0.4)",
    fontSize: "13px",
    borderRadius: "10px",
  },
  elements: {
    bellIcon: { color: "#a8c5c5", width: "20px", height: "20px" },
    inbox__notificationList__item: { borderBottom: "1px solid #2a3e3e" },
    inbox__notificationList__item__content__header__subject: { color: "#e0eded", fontWeight: "600", fontSize: "13px" },
    inbox__notificationList__item__content__header__timestamp: { color: "#5f8585", fontSize: "11px" },
    inbox__notificationList__item__content__body: { color: "#a8c5c5", fontSize: "12px" },
    inbox__notificationList__item__unread_dot: { backgroundColor: "#2dd4bf" },
    popover__content: { borderRadius: "12px", border: "1px solid #3a5454", boxShadow: "0 4px 16px rgba(0,0,0,0.4)", width: "380px", background: "#222a2a" },
    popover__content__header: { borderBottom: "1px solid #2a3e3e", padding: "14px 16px" },
    popover__content__header__title: { color: "#e0eded", fontWeight: "700", fontSize: "15px" },
  },
};

export default function NotificationInbox({ onNavigate }) {
  const { user } = useUser();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const applicationIdentifier = import.meta.env.VITE_NOVU_APP_ID;

  if (!applicationIdentifier || !user) return null;

  const handleNavigate = (url) => {
    if (onNavigate) onNavigate();
    navigate(url);
  };

  return (
    <Inbox
      applicationIdentifier={applicationIdentifier}
      subscriberId={user.id}
      routerPush={(url) => handleNavigate(url)}
      onNotificationClick={(notification) => {
        const url = notification?.cta?.data?.url;
        if (url) handleNavigate(url);
      }}
      appearance={theme === "dark" ? darkAppearance : lightAppearance}
    />
  );
}
