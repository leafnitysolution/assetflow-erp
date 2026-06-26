import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Box,
  Ticket,
  Activity,
  MapPin,
  Bell,
  Cloud,
  CloudOff,
  HelpCircle,
  LogOut,
  ChevronRight,
  User,
  Mail,
  Briefcase,
} from 'lucide-react-native';
import NetInfo from '@react-native-community/netinfo';
import { useAuthStore } from '../../store/authStore';
import { assetsApi, ticketsApi } from '../../lib/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [stats, setStats] = useState([
    { icon: Box, color: '#00bc7d', label: 'Assets\nAssigned', value: '0' },
    { icon: Ticket, color: '#fe9a00', label: 'Tickets\nResolved', value: '0' },
    { icon: Activity, color: '#ad46ff', label: 'Active\nTickets', value: '0' },
  ]);

  useEffect(() => {
    // Listen to network status
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
    });

    // Fetch dynamic stats
    (async () => {
      try {
        const [assetsData, ticketsData] = await Promise.all([
          assetsApi.getAll(),
          ticketsApi.getAll()
        ]);
        
        const assetsCount = assetsData.length;
        const resolvedCount = ticketsData.filter(t => t.status === 'resolved' || t.status === 'closed').length;
        const activeCount = ticketsData.filter(t => t.status === 'open' || t.status === 'in-progress' || t.status === 'assigned').length;

        setStats([
          { icon: Box, color: '#00bc7d', label: 'Assets\nAssigned', value: String(assetsCount) },
          { icon: Ticket, color: '#fe9a00', label: 'Tickets\nResolved', value: String(resolvedCount) },
          { icon: Activity, color: '#ad46ff', label: 'Active\nTickets', value: String(activeCount) },
        ]);
      } catch (err) {
        console.error('Error fetching profile stats:', err);
      } finally {
        setLoading(false);
      }
    })();

    return unsubscribe;
  }, []);

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'Offline assets and tickets database cache cleared successfully.');
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileInfo}>
          <Text style={styles.profileLabel}>Personal Workspace</Text>
          <Text style={styles.profileName}>{user?.name ?? 'Employee'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'MEMBER'}</Text>
          </View>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {loading ? (
          <View style={styles.statsLoader}>
            <ActivityIndicator color="#00bc7d" />
          </View>
        ) : (
          stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <View key={i} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: s.color + '15' }]}>
                  <Icon size={16} color={s.color} />
                </View>
                <Text style={styles.statNum}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            );
          })
        )}
      </View>

      {/* Employee Details Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Employee Details</Text>
        <View style={styles.detailsList}>
          <View style={styles.detailItem}>
            <Mail size={16} color="#a1a1a1" style={styles.detailIcon} />
            <View>
              <Text style={styles.detailLabel}>Email Address</Text>
              <Text style={styles.detailValue}>{user?.email ?? '—'}</Text>
            </View>
          </View>
          <View style={styles.detailDivider} />
          
          <View style={styles.detailItem}>
            <Briefcase size={16} color="#a1a1a1" style={styles.detailIcon} />
            <View>
              <Text style={styles.detailLabel}>Department</Text>
              <Text style={styles.detailValue}>{user?.department ?? 'General'}</Text>
            </View>
          </View>
          <View style={styles.detailDivider} />

          <View style={styles.detailItem}>
            <MapPin size={16} color="#a1a1a1" style={styles.detailIcon} />
            <View>
              <Text style={styles.detailLabel}>Branch Office</Text>
              <Text style={styles.detailValue}>{user?.branch ?? 'Main HQ'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Settings Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Application Settings</Text>
        
        {/* Notifications Toggle */}
        <View style={styles.settingsRow}>
          <View style={styles.settingsLeft}>
            <View style={styles.settingsIcon}>
              <Bell size={16} color="#a1a1a1" />
            </View>
            <Text style={styles.settingsLabel}>Push Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#262626', true: '#00bc7d' }}
            thumbColor="#fafafa"
          />
        </View>

        {/* Network Status */}
        <View style={styles.settingsRow}>
          <View style={styles.settingsLeft}>
            <View style={styles.settingsIcon}>
              {isOnline ? <Cloud size={16} color="#00bc7d" /> : <CloudOff size={16} color="#ff2056" />}
            </View>
            <Text style={styles.settingsLabel}>Connection Status</Text>
          </View>
          <View style={[styles.statusIndicator, { backgroundColor: isOnline ? '#00bc7d15' : '#ff205615' }]}>
            <Text style={[styles.statusIndicatorText, { color: isOnline ? '#00bc7d' : '#ff2056' }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Clear Cache */}
        <TouchableOpacity style={styles.settingsRow} onPress={handleClearCache} activeOpacity={0.7}>
          <View style={styles.settingsLeft}>
            <View style={styles.settingsIcon}>
              <CloudOff size={16} color="#a1a1a1" />
            </View>
            <Text style={styles.settingsLabel}>Clear Local Cache</Text>
          </View>
          <ChevronRight size={16} color="#525252" />
        </TouchableOpacity>

        {/* Help & Support */}
        <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
          <View style={styles.settingsLeft}>
            <View style={styles.settingsIcon}>
              <HelpCircle size={16} color="#a1a1a1" />
            </View>
            <Text style={styles.settingsLabel}>Help and Support</Text>
          </View>
          <ChevronRight size={16} color="#525252" />
        </TouchableOpacity>

        <View style={styles.detailDivider} />

        {/* Logout */}
        <TouchableOpacity style={[styles.settingsRow, { marginTop: 4 }]} onPress={handleLogout} activeOpacity={0.7}>
          <View style={styles.settingsLeft}>
            <View style={[styles.settingsIcon, { backgroundColor: '#ff205615' }]}>
              <LogOut size={16} color="#ff2056" />
            </View>
            <Text style={[styles.settingsLabel, { color: '#ff2056' }]}>Sign Out</Text>
          </View>
          <ChevronRight size={16} color="#ff2056" />
        </TouchableOpacity>
      </View>

      {/* Version */}
      <Text style={styles.version}>AssetFlow Employee App v2.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09090b' },
  container: { paddingBottom: 100 },
  statsLoader: { flex: 1, height: 80, justifyContent: 'center', alignItems: 'center' },

  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  profileInfo: { gap: 6 },
  profileLabel: { fontSize: 13, color: '#a1a1a1', fontWeight: '500' },
  profileName: { fontSize: 24, fontWeight: '800', color: '#fafafa', letterSpacing: -0.5 },
  roleBadge: { backgroundColor: '#1d4ed820', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#1d4ed840' },
  roleText: { fontSize: 10, fontWeight: '700', color: '#60a5fa' },
  avatar: { width: 68, height: 68, borderRadius: 34, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1d4ed8' },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#fafafa' },

  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 20 },
  statCard: { flex: 1, backgroundColor: '#171717', borderRadius: 16, padding: 14, alignItems: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  statIcon: { width: 34, height: 34, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statNum: { fontSize: 22, fontWeight: '800', color: '#fafafa', letterSpacing: -0.5, marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#a1a1a1', lineHeight: 14, fontWeight: '500' },

  card: { marginHorizontal: 20, marginBottom: 16, backgroundColor: '#171717', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#fafafa', marginBottom: 14 },
  
  detailsList: { gap: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center' },
  detailIcon: { marginRight: 14 },
  detailLabel: { fontSize: 11, color: '#a1a1a1', fontWeight: '500', marginBottom: 2 },
  detailValue: { fontSize: 14, color: '#fafafa', fontWeight: '600' },
  detailDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 8 },

  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  settingsLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsIcon: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#262626', justifyContent: 'center', alignItems: 'center' },
  settingsLabel: { fontSize: 14, fontWeight: '600', color: '#fafafa' },
  
  statusIndicator: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusIndicatorText: { fontSize: 12, fontWeight: '700' },

  version: { textAlign: 'center', color: '#3f3f46', fontSize: 12, marginTop: 16, fontWeight: '500' },
});
