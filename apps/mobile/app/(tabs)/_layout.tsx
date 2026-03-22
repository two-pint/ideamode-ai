import { Tabs, Redirect } from "expo-router";
import { Home, FolderKanban, Lightbulb, Search, UserRound } from "lucide-react-native";
import { useAuth } from "@/lib/auth-context";
import { renderLucide } from "@/lib/render-lucide";
import { headerScreenOptions, theme } from "@/lib/theme";

export default function TabsLayout() {
  const { token, user } = useAuth();

  if (!token || !user?.username) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        ...headerScreenOptions,
        tabBarActiveTintColor: theme.foreground,
        tabBarInactiveTintColor: theme.mutedForeground,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopWidth: 1,
          borderTopColor: theme.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => renderLucide(Home, { size, color }),
        }}
      />
      <Tabs.Screen
        name="brainstorms"
        options={{
          title: "Brainstorms",
          tabBarIcon: ({ color, size }) => renderLucide(FolderKanban, { size, color }),
        }}
      />
      <Tabs.Screen
        name="ideas"
        options={{
          title: "Ideas",
          tabBarIcon: ({ color, size }) => renderLucide(Lightbulb, { size, color }),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => renderLucide(Search, { size, color }),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => renderLucide(UserRound, { size, color }),
        }}
      />
    </Tabs>
  );
}
