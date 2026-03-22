import { Stack } from "expo-router";
import { AuthProvider } from "@/lib/auth-context";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#fafafa" },
          headerTintColor: "#18181b",
          headerTitleStyle: { fontWeight: "600" },
        }}
      />
    </AuthProvider>
  );
}
