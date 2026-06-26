import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Filter, Box } from 'lucide-react-native';
import { assetsApi } from '../../lib/api';

export default function AssetsCatalogueScreen() {
  const [assets, setAssets] = useState<any[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadAssets = async () => {
    try {
      const data = await assetsApi.getAll();
      setAssets(data);
      setFilteredAssets(data);
    } catch (_) {
      // Fallback mocks if server has no assets
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  useEffect(() => {
    let list = [...assets];
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name?.toLowerCase().includes(term) ||
          a.serialNumber?.toLowerCase().includes(term) ||
          a.category?.toLowerCase().includes(term)
      );
    }
    if (selectedFilter !== 'all') {
      list = list.filter((a) => a.status === selectedFilter);
    }
    setFilteredAssets(list);
  }, [search, selectedFilter, assets]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available':
      case 'assigned':
        return '#10b981'; // Emerald
      case 'maintenance':
      case 'repair':
      case 'under-maintenance':
        return '#f59e0b'; // Amber
      case 'damaged':
      case 'lost':
        return '#ef4444'; // Crimson
      default:
        return '#94a3b8';
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.title}>Asset Catalogue</Text>
        <Text style={styles.subtitle}>Browse and manage inventory items</Text>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, serial, category..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Quick Status Filters */}
      <View style={styles.filterRow}>
        {['all', 'available', 'maintenance', 'damaged'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, selectedFilter === f && styles.filterTabActive]}
            onPress={() => setSelectedFilter(f)}
          >
            <Text style={[styles.filterTabText, selectedFilter === f && styles.filterTabTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredAssets}
        keyExtractor={(item, index) => item.id || index.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push(`/(details)/asset-${item.id}`)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <View style={styles.boxIcon}>
                  <Box size={16} color="#10b981" />
                </View>
                <View>
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.cardCategory}>{item.category} · SN: {item.serialNumber || 'N/A'}</Text>
                </View>
              </View>
              <View style={[styles.statusIndicator, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {item.status}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No assets match your filters.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a', paddingTop: 56 },
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },

  header: { paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#f8fafc', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },

  searchContainer: { paddingHorizontal: 20, marginBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#334155' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 44, color: '#f8fafc', fontSize: 14 },

  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  filterTab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  filterTabActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  filterTabText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  filterTabTextActive: { color: '#0f172a' },

  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  boxIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(16, 185, 129, 0.08)', justifyContent: 'center', alignItems: 'center' },
  cardName: { fontSize: 15, fontWeight: '700', color: '#f8fafc' },
  cardCategory: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  statusIndicator: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },

  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 13 },
});
