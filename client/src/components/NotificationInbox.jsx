import { Inbox } from "@novu/react";
import { useUser } from "@clerk/clerk-react";

export default function NotificationInbox() {
  const { user } = useUser();
  const applicationIdentifier = import.meta.env.VITE_NOVU_APP_ID;

  if (!applicationIdentifier || !user) return null;

  return (
    <Inbox
      applicationIdentifier={applicationIdentifier}
      subscriberId={user.id}
      appearance={{
        variables: {
          colorPrimary: "#0d9488",
          colorPrimaryForeground: "#ffffff",
          colorSecondary: "#f0f7f7",
          colorSecondaryForeground: "#2a3e3e",
          colorCounter: "#0d9488",
          colorCounterForeground: "#ffffff",
          colorBackground: "#fefdfb",
          colorRing: "#0d9488",
          colorForeground: "#2a3e3e",
          colorNeutral: "#e0eded",
          colorShadow: "rgba(0, 0, 0, 0.05)",
          fontSize: "14px",
        },
        elements: {
          bellIcon: {
            color: "#5f8585",
          },
        },
      }}
    />
  );
}
