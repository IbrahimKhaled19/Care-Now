import { Inbox } from "@novu/react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export default function NotificationInbox({ onNavigate }) {
  const { user } = useUser();
  const navigate = useNavigate();
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
        if (url) {
          handleNavigate(url);
        }
      }}
      appearance={{
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
          bellIcon: {
            color: "#5f8585",
            width: "20px",
            height: "20px",
          },
          inbox__notificationList__item: {
            borderBottom: "1px solid #f0f7f7",
          },
          inbox__notificationList__item__content__header__subject: {
            color: "#1a2e2e",
            fontWeight: "600",
            fontSize: "13px",
          },
          inbox__notificationList__item__content__header__timestamp: {
            color: "#9ca3af",
            fontSize: "11px",
          },
          inbox__notificationList__item__content__body: {
            color: "#5f8585",
            fontSize: "12px",
          },
          inbox__notificationList__item__unread_dot: {
            backgroundColor: "#0d9488",
          },
          popover__content: {
            borderRadius: "12px",
            border: "1px solid #e0eded",
            boxShadow: "none",
            width: "380px",
          },
          popover__content__header: {
            borderBottom: "1px solid #f0f7f7",
            padding: "14px 16px",
          },
          popover__content__header__title: {
            color: "#1a2e2e",
            fontWeight: "700",
            fontSize: "15px",
          },
        },
      }}
    />
  );
}
