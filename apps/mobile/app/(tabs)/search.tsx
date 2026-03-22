import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ApiError, MAX_SEARCH_QUERY_LENGTH, searchApi, type GlobalSearchResultItem } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { theme } from "@/lib/theme";

const DEBOUNCE_MS = 350;

export default function SearchTab() {
  const { token } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<GlobalSearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const runSearch = useCallback(async () => {
    if (!token || debounced.length === 0) {
      setResults([]);
      return;
    }
    if (debounced.length > MAX_SEARCH_QUERY_LENGTH) {
      setError(`Query too long (max ${MAX_SEARCH_QUERY_LENGTH})`);
      setResults([]);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await searchApi.search(token, debounced, { limit: 40 });
      setResults(res.results);
    } catch (e) {
      setResults([]);
      if (e instanceof ApiError) setError(e.message);
      else setError("Search failed");
    } finally {
      setLoading(false);
    }
  }, [token, debounced]);

  useEffect(() => {
    void runSearch();
  }, [runSearch]);

  const grouped = useMemo(() => {
    const b = results.filter((r) => r.type === "brainstorm");
    const i = results.filter((r) => r.type === "idea");
    return { b, i };
  }, [results]);

  function openItem(item: GlobalSearchResultItem) {
    if (item.type === "brainstorm") {
      router.push(`/brainstorm/${item.owner_username}/${item.slug}`);
    } else {
      router.push(`/idea/${item.owner_username}/${item.slug}`);
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search brainstorms and ideas…"
        placeholderTextColor={theme.subtleForeground}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator style={{ marginTop: 16 }} /> : null}
      <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
        {!loading && debounced.length > 0 && results.length === 0 && !error ? (
          <Text style={styles.empty}>No matches.</Text>
        ) : null}
        {grouped.b.length > 0 ? <Text style={styles.heading}>Brainstorms</Text> : null}
        {grouped.b.map((item) => (
          <Pressable key={`b-${item.id}`} style={styles.row} onPress={() => openItem(item)}>
            <Text style={styles.title}>{item.title}</Text>
            {item.description_preview ? (
              <Text style={styles.preview} numberOfLines={2}>
                {item.description_preview}
              </Text>
            ) : null}
            <Text style={styles.meta}>@{item.owner_username}</Text>
          </Pressable>
        ))}
        {grouped.i.length > 0 ? <Text style={[styles.heading, { marginTop: 16 }]}>Ideas</Text> : null}
        {grouped.i.map((item) => (
          <Pressable key={`i-${item.id}`} style={styles.row} onPress={() => openItem(item)}>
            <Text style={styles.title}>{item.title}</Text>
            {item.description_preview ? (
              <Text style={styles.preview} numberOfLines={2}>
                {item.description_preview}
              </Text>
            ) : null}
            <Text style={styles.meta}>@{item.owner_username}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: theme.input,
    borderRadius: theme.radius.md,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.card,
    color: theme.foreground,
  },
  error: { color: theme.destructive, marginTop: 8, fontSize: 14 },
  list: { flex: 1, marginTop: 12 },
  heading: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.mutedForeground,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  empty: { color: theme.mutedForeground, marginTop: 8 },
  row: {
    backgroundColor: theme.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    marginBottom: 8,
  },
  title: { fontSize: 16, fontWeight: "600", color: theme.foreground },
  preview: { fontSize: 13, color: theme.mutedForeground, marginTop: 4 },
  meta: { fontSize: 12, color: theme.subtleForeground, marginTop: 4 },
});
