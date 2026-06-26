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
import { Search, Ticket, AlertCircle } from 'lucide-react-native';
import { ticketsApi } from '../../lib/api';

export default function TicketsListScreen() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadTickets = async () => {
    try {
      const data = await ticketsApi.getAll();
      setTickets(data);
      setFilteredTickets(data);
    } catch (_) {
      // Fallback mocks
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    let list = [...tickets];
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title?.toLowerCase().includes(term) ||
          t.ticketNumber?.toLowerCase().includes(term) ||
          t.description?.toLowerCase().includes(term)
      );
    }
    if (selectedFilter !== 'all') {
      list = list.filter((t) => t.status === selectedFilter);
    }
    setFilteredTickets(list);
  }, [search, selectedFilter, tickets]);

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'critical':
        return '#ef4444'; // Crimson
      case 'medium':
        return '#f59e0b'; // Amber
      default:
        return '#3b82f6'; // Blue
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
        <Text style={styles.title}>Maintenance Tickets</Text>
        <Text style={styles.subtitle}>Review and resolve service requests</Text>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, ticket number..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Quick Status Filters */}
      <View style={styles.filterRow}>
        {['all', 'open', 'in-progress', 'resolved'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, selectedFilter === f && styles.filterTabActive]}
            onPress={() => setSelectedFilter(f)}
          >
            <Text style={[styles.filterTabText, selectedFilter === f && styles.filterTabTextActive]}>
              {f === 'in-progress' ? 'Active' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredTickets}
        keyExtractor={(item, index) => item.id || index.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push(`/(details)/ticket-${item.id}`)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <View style={styles.ticketIcon}>
                  <Ticket size={16} color="#10b981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitleText} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.cardSubtitleText}>
                    {item.ticketNumber || `TKT-${item.id?.slice(0, 4)}`} · {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </View>
              <View style={[styles.priorityBadge, { borderColor: getPriorityColor(item.priority) }]}>
                <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                  {item.priority}
                </Text>
              </View>
            </View>
            <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AlertCircle size={24} color="#64748b" style={{ marginBottom: 8 }} />
            <Text style={styles.emptyText}>No tickets match your filters.</Text>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 10 },
  ticketIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(16, 185, 129, 0.08)', justifyContent: 'center', alignItems: 'center' },
  cardTitleText: { fontSize: 15, fontWeight: '700', color: '#f8fafc' },
  cardSubtitleText: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  priorityText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  cardDesc: { fontSize: 13, color: '#94a3b8', lineHeight: 18 },

  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 13 },
});
