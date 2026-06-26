import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Box,
  Ticket,
  MapPin,
  QrCode,
  Users,
  Settings,
  ClipboardList,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { assetsApi, ticketsApi, usersApi } from '../../lib/api';

export default function AdminDashboardScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [assets, setAssets] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [a, t, u] = await Promise.all([
        assetsApi.getAll(),
        ticketsApi.getAll(),
        usersApi.getAll(),
      ]);
      setAssets(a);
      setTickets(t);
      setUsers(u);
    } catch (_) {
      // fallback mock values if backend is loading
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in-progress' || t.status === 'assigned').length;
  const maintenanceAssets = assets.filter(a => a.status === 'maintenance' || a.status === 'under-maintenance' || a.status === 'repair').length;
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'AD';

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Administrator Console</Text>
          <Text style={styles.name}>{user?.name ?? 'Admin User'}</Text>
          <View style={styles.branchBadge}>
            <MapPin size={11} color="#10b981" />
            <Text style={styles.branchText}>{user?.branch ?? 'Headquarters'}</Text>
          </View>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>

      {/* Metrics Grid */}
      <View style={styles.statGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <Box size={16} color="#10b981" />
          </View>
          <Text style={styles.statNum}>{assets.length.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Assets</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
            <Settings size={16} color="#f59e0b" />
          </View>
          <Text style={styles.statNum}>{maintenanceAssets}</Text>
          <Text style={styles.statLabel}>In Repair</Text>
        </View>
      </View>

      <View style={styles.statGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Ticket size={16} color="#ef4444" />
          </View>
          <Text style={styles.statNum}>{openTickets}</Text>
          <Text style={styles.statLabel}>Pending Tickets</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
            <Users size={16} color="#3b82f6" />
          </View>
          <Text style={styles.statNum}>{users.length}</Text>
          <Text style={styles.statLabel}>Active Members</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/scanner')}>
            <View style={[styles.actionIconWrap, { backgroundColor: '#10b981' }]}>
              <QrCode size={20} color="#0f172a" />
            </View>
            <Text style={styles.actionLabel}>Scan Asset</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/audit')}>
            <View style={[styles.actionIconWrap, { backgroundColor: '#3b82f6' }]}>
              <ClipboardList size={20} color="#0f172a" />
            </View>
            <Text style={styles.actionLabel}>Start Audit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Alerts / Tickets */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Tickets</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/tickets')}>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityCard}>
          {tickets.length > 0 ? (
            tickets.slice(0, 3).map((item, i) => (
              <TouchableOpacity
                key={item.id || i}
                onPress={() => router.push(`/(details)/ticket-${item.id}`)}
              >
                <View style={styles.activityRow}>
                  <View style={[styles.activityIcon, { backgroundColor: item.status === 'resolved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                    <Ticket size={15} color={item.status === 'resolved' ? '#10b981' : '#ef4444'} />
                  </View>
                  <View style={styles.activityBody}>
                    <Text style={styles.activityTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.activitySub} numberOfLines={1}>
                      {item.ticketNumber || `TKT-${item.id?.slice(0, 4)}`} · {item.priority?.toUpperCase()} Priority
                    </Text>
                  </View>
                  <Text style={styles.activityStatus}>{item.status}</Text>
                </View>
                {i < 2 && i < tickets.length - 1 && <View style={styles.divider} />}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No pending maintenance tickets.</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  container: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 100 },
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting: { fontSize: 13, color: '#94a3b8', marginBottom: 2 },
  name: { fontSize: 22, fontWeight: '800', color: '#f8fafc', letterSpacing: -0.5, marginBottom: 6 },
  branchBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  branchText: { fontSize: 11, fontWeight: '600', color: '#10b981' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#0f172a' },

  statGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155', gap: 6 },
  statIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '800', color: '#f8fafc', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, color: '#94a3b8' },

  section: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc' },
  viewAll: { fontSize: 13, fontWeight: '600', color: '#10b981' },

  actionsGrid: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155', alignItems: 'center', gap: 10 },
  actionIconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 13, fontWeight: '600', color: '#f8fafc' },

  activityCard: { backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155', padding: 8 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  activityIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  activityBody: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: '600', color: '#f8fafc' },
  activitySub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  activityStatus: { fontSize: 11, fontWeight: '600', color: '#f59e0b', textTransform: 'capitalize', flexShrink: 0 },
  divider: { height: 1, backgroundColor: '#334155', marginHorizontal: 8 },

  emptyContainer: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 13 },
});
