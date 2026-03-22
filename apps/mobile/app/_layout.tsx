import { Stack } from "expo-router";
import { AuthProvider } from "@/lib/auth-context";
import { headerScreenOptions } from "@/lib/theme";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={headerScreenOptions} />
    </AuthProvider>
  );
}
