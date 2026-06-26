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
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { assetsApi, ticketsApi } from '../../lib/api';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [assets, setAssets] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [a, t] = await Promise.all([assetsApi.getAll(), ticketsApi.getAll()]);
      setAssets(a);
      setTickets(t);
    } catch (_) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning,';
    if (h < 18) return 'Good afternoon,';
    return 'Good evening,';
  };

  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in-progress' || t.status === 'assigned').length;
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U';

  const recentActivity = tickets.length > 0
    ? tickets.slice(0, 5).map((t, idx) => ({
        icon: Ticket,
        color: t.status === 'resolved' ? '#00bc7d' : t.status === 'in-progress' ? '#fe9a00' : '#ff2056',
        bg: t.status === 'resolved' ? '#00bc7d15' : t.status === 'in-progress' ? '#fe9a0015' : '#ff205615',
        title: t.title,
        sub: `Status: ${t.status.charAt(0).toUpperCase() + t.status.slice(1).replace('-', ' ')} · ${t.ticketNumber || `#TKT-${t.id?.slice(0, 4)}`}`,
        time: new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        id: t.id
      }))
    : [
        {
          icon: Box,
          color: '#00bc7d',
          bg: '#00bc7d15',
          title: 'Welcome to AssetFlow!',
          sub: 'Your assigned assets and tickets will appear here.',
          time: 'Now',
          id: 'welcome'
        }
      ];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00bc7d" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00bc7d" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.name}>{user?.name ?? 'User'}</Text>
          <View style={styles.branchBadge}>
            <MapPin size={11} color="#00bc7d" />
            <Text style={styles.branchText}>{user?.branch ?? 'Main Office'}</Text>
          </View>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>

      {/* Stat Cards */}
      <View style={styles.statGrid}>
        <View style={[styles.statCard, { borderColor: 'rgba(255,255,255,0.06)' }]}>
          <View style={[styles.statIcon, { backgroundColor: '#00bc7d15' }]}>
            <Box size={16} color="#00bc7d" />
          </View>
          <Text style={styles.statNum}>{assets.length.toLocaleString()}</Text>
          <Text style={styles.statLabel}>My Assets</Text>
        </View>
        <View style={[styles.statCard, { borderColor: 'rgba(255,255,255,0.06)' }]}>
          <View style={styles.statIconRow}>
            <View style={[styles.statIcon, { backgroundColor: '#fe9a0015' }]}>
              <Ticket size={16} color="#fe9a00" />
            </View>
            {openTickets > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{openTickets}</Text>
              </View>
            )}
          </View>
          <Text style={styles.statNum}>{openTickets}</Text>
          <Text style={styles.statLabel}>My Open Tickets</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionPill} onPress={() => router.push('/create-ticket')}>
            <Ticket size={15} color="#09090b" />
            <Text style={styles.actionPillText}>New Ticket</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/tickets')}>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.activityCard}>
          {recentActivity.map((item, i) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity 
                key={item.id || i}
                onPress={() => item.id !== 'welcome' && router.push(`/ticket/${item.id}`)}
                activeOpacity={item.id === 'welcome' ? 1 : 0.7}
              >
                <View style={styles.activityRow}>
                  <View style={[styles.activityIcon, { backgroundColor: item.bg }]}>
                    <Icon size={15} color={item.color} />
                  </View>
                  <View style={styles.activityBody}>
                    <Text style={styles.activityTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.activitySub} numberOfLines={1}>{item.sub}</Text>
                  </View>
                  <Text style={styles.activityTime}>{item.time}</Text>
                </View>
                {i < recentActivity.length - 1 && <View style={styles.divider} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09090b' },
  container: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 100 },
  center: { flex: 1, backgroundColor: '#09090b', justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting: { fontSize: 14, color: '#a1a1a1', marginBottom: 2 },
  name: { fontSize: 22, fontWeight: '800', color: '#fafafa', letterSpacing: -0.5, marginBottom: 6 },
  branchBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#00bc7d10', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  branchText: { fontSize: 12, fontWeight: '600', color: '#00bc7d' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1d4ed8', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#fafafa' },

  statGrid: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  statCard: { flex: 1, minWidth: '44%', backgroundColor: '#171717', borderRadius: 16, padding: 16, borderWidth: 1, gap: 6 },
  statIconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statNum: { fontSize: 26, fontWeight: '800', color: '#fafafa', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, color: '#a1a1a1' },
  badge: { backgroundColor: '#ff2056', borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fafafa', marginBottom: 12 },
  viewAll: { fontSize: 13, fontWeight: '600', color: '#00bc7d' },

  actionsRow: { flexDirection: 'row', gap: 10 },
  actionPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#e5e5e5', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  actionPillOutline: { backgroundColor: '#262626', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  actionPillText: { fontSize: 14, fontWeight: '600', color: '#09090b' },

  activityCard: { backgroundColor: '#171717', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 8 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 },
  activityIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  activityBody: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: '600', color: '#fafafa' },
  activitySub: { fontSize: 12, color: '#a1a1a1', marginTop: 1 },
  activityTime: { fontSize: 12, color: '#a1a1a1', flexShrink: 0 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 8 },
});
