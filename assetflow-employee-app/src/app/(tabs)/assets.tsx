import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Filter, Box, ChevronRight } from 'lucide-react-native';
import { assetsApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const CATEGORIES = ['All', 'IT Equipment', 'Furniture', 'Vehicles', 'Tools', 'Equipment', 'Other'];

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  available:   { bg: '#00bc7d15', text: '#00bc7d' },
  assigned:    { bg: '#3b82f615', text: '#60a5fa' },
  maintenance: { bg: '#fe9a0015', text: '#fe9a00' },
  retired:     { bg: '#ff205615', text: '#ff2056' },
  lost:        { bg: '#71717a20', text: '#a1a1a1' },
  damaged:     { bg: '#ef444415', text: '#f87171' },
};

const ICON_COLORS = ['#00bc7d', '#fe9a00', '#ff2056', '#60a5fa', '#ad46ff', '#22d3ee'];

export default function AssetsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [assets, setAssets] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await assetsApi.getAll();
      setAssets(data);
      applyFilters(data, search, category);
    } catch (_) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const applyFilters = (data: any[], q: string, cat: string) => {
    let result = data;
    if (cat !== 'All') {
      result = result.filter(a =>
        a.category?.toLowerCase().replace('_', ' ') === cat.toLowerCase()
      );
    }
    if (q.trim()) {
      const lower = q.toLowerCase();
      result = result.filter(
        a =>
          a.name?.toLowerCase().includes(lower) ||
          a.serialNumber?.toLowerCase().includes(lower) ||
          a.sku?.toLowerCase().includes(lower)
      );
    }
    setFiltered(result);
  };

  const onSearch = (text: string) => {
    setSearch(text);
    applyFilters(assets, text, category);
  };

  const onCategory = (cat: string) => {
    setCategory(cat);
    applyFilters(assets, search, cat);
  };

  const onRefresh = () => { setRefreshing(true); load(); };

  const statusLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ');

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const st = STATUS_COLOR[item.status] ?? STATUS_COLOR.available;
    const ic = ICON_COLORS[index % ICON_COLORS.length];
    return (
      <TouchableOpacity
        style={styles.assetCard}
        onPress={() => router.push(`/asset/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={[styles.assetIcon, { backgroundColor: ic + '18' }]}>
          <Box size={20} color={ic} />
        </View>
        <View style={styles.assetBody}>
          <View style={styles.assetRow}>
            <View style={styles.assetInfo}>
              <Text style={styles.assetName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.assetCode}>#{item.sku || item.serialNumber || item.id?.slice(0, 8)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
              <Text style={[styles.statusText, { color: st.text }]}>{statusLabel(item.status)}</Text>
            </View>
          </View>
          <View style={styles.assetMeta}>
            <Text style={styles.assetMetaText} numberOfLines={1}>
              {item.department || 'General'} · {item.branch || 'Main'}
            </Text>
            <ChevronRight size={14} color="#525252" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.subtitle}>Assets</Text>
          <Text style={styles.title}>Asset Inventory</Text>
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Filter size={16} color="#fafafa" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Search size={16} color="#a1a1a1" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search assets…"
          placeholderTextColor="#525252"
          value={search}
          onChangeText={onSearch}
        />
      </View>

      {/* Category chips */}
      <FlatList
        data={CATEGORIES}
        keyExtractor={(i) => i}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.chips}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, category === item && styles.chipActive]}
            onPress={() => onCategory(item)}
          >
            <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#00bc7d" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00bc7d" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No assets found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09090b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  subtitle: { fontSize: 13, color: '#a1a1a1', marginBottom: 2 },
  title: { fontSize: 28, fontWeight: '800', color: '#fafafa', letterSpacing: -0.5 },
  filterBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#262626', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#171717', marginHorizontal: 20, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, color: '#fafafa' },
  chips: { paddingHorizontal: 20, gap: 8, paddingBottom: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#262626' },
  chipActive: { backgroundColor: '#00bc7d' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#a1a1a1' },
  chipTextActive: { color: '#09090b' },
  list: { paddingHorizontal: 20, paddingBottom: 100, gap: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { color: '#525252', fontSize: 15 },
  assetCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#171717', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  assetIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  assetBody: { flex: 1 },
  assetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  assetInfo: { flex: 1 },
  assetName: { fontSize: 15, fontWeight: '700', color: '#fafafa' },
  assetCode: { fontSize: 12, color: '#a1a1a1', marginTop: 1 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  assetMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  assetMetaText: { fontSize: 13, color: '#a1a1a1', flex: 1 },
});
