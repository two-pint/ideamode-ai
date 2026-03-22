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
        placeholderTextColor="#a1a1aa"
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
  container: { flex: 1, backgroundColor: "#fafafa", padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#18181b",
  },
  error: { color: "#b91c1c", marginTop: 8 },
  list: { flex: 1, marginTop: 12 },
  heading: { fontSize: 12, fontWeight: "600", color: "#71717a", marginBottom: 8, textTransform: "uppercase" },
  empty: { color: "#71717a", marginTop: 8 },
  row: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 12,
    marginBottom: 8,
  },
  title: { fontSize: 16, fontWeight: "600", color: "#18181b" },
  preview: { fontSize: 13, color: "#52525b", marginTop: 4 },
  meta: { fontSize: 12, color: "#a1a1aa", marginTop: 4 },
});
