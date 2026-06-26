import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { ticketsApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const FILTERS = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];

const PRIORITY_COLOR: Record<string, string> = {
  urgent: '#ff2056',
  high:   '#ff2056',
  medium: '#fe9a00',
  low:    '#00bc7d',
};

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  open:        { bg: '#ff205615', text: '#ff2056' },
  'in-progress': { bg: '#fe9a0015', text: '#fe9a00' },
  resolved:    { bg: '#00bc7d15', text: '#00bc7d' },
  closed:      { bg: '#71717a20', text: '#a1a1a1' },
  assigned:    { bg: '#3b82f615', text: '#60a5fa' },
};

export default function TicketsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await ticketsApi.getAll();
      setTickets(data);
      applyFilter(data, activeFilter);
    } catch (_) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const applyFilter = (data: any[], f: string) => {
    if (f === 'All') { setFiltered(data); return; }
    const key = f.toLowerCase().replace(' ', '-');
    setFiltered(data.filter(t => t.status === key || t.status === f.toLowerCase()));
  };

  const onFilter = (f: string) => {
    setActiveFilter(f);
    applyFilter(tickets, f);
  };

  const onRefresh = () => { setRefreshing(true); load(); };

  const initials = (name: string) =>
    name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? '??';

  const renderItem = ({ item }: { item: any }) => {
    const st = STATUS_COLOR[item.status] ?? STATUS_COLOR.open;
    const prColor = PRIORITY_COLOR[item.priority] ?? '#a1a1a1';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/ticket/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={[styles.priorityBar, { backgroundColor: prColor }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.cardCode}>{item.ticketNumber || `#TKT-${item.id?.slice(0, 4)}`}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
              <Text style={[styles.statusText, { color: st.text }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('-', ' ')}
              </Text>
            </View>
          </View>
          <View style={styles.cardMeta}>
            <View style={styles.cardUser}>
              <View style={styles.cardAvatar}>
                <Text style={styles.cardAvatarText}>{initials(item.assignedToName || item.createdByName || 'U')}</Text>
              </View>
              <View>
                <Text style={styles.cardUserName}>{item.assignedToName || item.createdByName || 'Unassigned'}</Text>
                <Text style={styles.cardUserSub} numberOfLines={1}>
                  {item.assetName || 'No Asset'} · {item.branch || 'Main'}
                </Text>
              </View>
            </View>
            <Text style={styles.cardTime}>
              {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </Text>
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
          <Text style={styles.subtitle}>Tickets</Text>
          <Text style={styles.title}>Tickets</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => router.push('/create-ticket')}>
          <Plus size={16} color="#09090b" />
          <Text style={styles.newBtnText}>New Ticket</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <FlatList
        data={FILTERS}
        keyExtractor={(i) => i}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.chips}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, activeFilter === item && styles.chipActive]}
            onPress={() => onFilter(item)}
          >
            <Text style={[styles.chipText, activeFilter === item && styles.chipTextActive]}>{item}</Text>
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
              <Text style={styles.emptyText}>No tickets found</Text>
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
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#e5e5e5', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  newBtnText: { fontSize: 14, fontWeight: '700', color: '#09090b' },
  chips: { paddingHorizontal: 20, gap: 8, paddingBottom: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#262626' },
  chipActive: { backgroundColor: '#00bc7d' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#a1a1a1' },
  chipTextActive: { color: '#09090b' },
  list: { paddingHorizontal: 20, paddingBottom: 100, gap: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { color: '#525252', fontSize: 15 },

  card: { flexDirection: 'row', backgroundColor: '#171717', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  priorityBar: { width: 4, borderRadius: 2 },
  cardBody: { flex: 1, padding: 14, gap: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#fafafa' },
  cardCode: { fontSize: 12, color: '#a1a1a1', marginTop: 2 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardUser: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#262626', justifyContent: 'center', alignItems: 'center' },
  cardAvatarText: { fontSize: 11, fontWeight: '700', color: '#fafafa' },
  cardUserName: { fontSize: 13, fontWeight: '600', color: '#fafafa' },
  cardUserSub: { fontSize: 11, color: '#a1a1a1' },
  cardTime: { fontSize: 11, color: '#a1a1a1' },
});
