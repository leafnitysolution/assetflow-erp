import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { User, LogOut, Shield, MapPin, Mail } from 'lucide-react-native';

export default function AdminProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out of your administrator account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ]
    );
  };

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'AD';

  return (
    <View style={styles.root}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.title}>Account Settings</Text>
        <Text style={styles.subtitle}>Manage your session and administrator profile</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileSection}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarTextLarge}>{initials}</Text>
        </View>
        <Text style={styles.profileName}>{user?.name ?? 'Administrator'}</Text>
        <View style={styles.roleBadge}>
          <Shield size={12} color="#10b981" />
          <Text style={styles.roleText}>{user?.role?.replace('-', ' ') ?? 'Admin'}</Text>
        </View>
      </View>

      {/* Info List */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoIconWrap}>
            <Mail size={16} color="#94a3b8" />
          </View>
          <View style={styles.infoBody}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoValue}>{user?.email ?? 'admin@company.com'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.infoIconWrap}>
            <MapPin size={16} color="#94a3b8" />
          </View>
          <View style={styles.infoBody}>
            <Text style={styles.infoLabel}>Assigned Branch</Text>
            <Text style={styles.infoValue}>{user?.branch ?? 'Headquarters Office'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.infoIconWrap}>
            <User size={16} color="#94a3b8" />
          </View>
          <View style={styles.infoBody}>
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue}>{user?.department ?? 'IT Operations'}</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color="#ef4444" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Sign Out of Console</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a', paddingTop: 56 },
  header: { paddingHorizontal: 20, marginBottom: 28 },
  title: { fontSize: 22, fontWeight: '800', color: '#f8fafc', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },

  profileSection: { alignItems: 'center', marginBottom: 28 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarTextLarge: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  profileName: { fontSize: 20, fontWeight: '700', color: '#f8fafc', marginBottom: 6 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  roleText: { fontSize: 11, fontWeight: '700', color: '#10b981', textTransform: 'uppercase' },

  infoCard: { backgroundColor: '#1e293b', borderRadius: 20, marginHorizontal: 20, borderWidth: 1, borderColor: '#334155', padding: 8, marginBottom: 28 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12 },
  infoIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  infoBody: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: '600' },
  infoValue: { fontSize: 14, color: '#f8fafc', marginTop: 2, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#334155', marginHorizontal: 12 },

  actionsSection: { paddingHorizontal: 20 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', paddingVertical: 14, borderRadius: 14 },
  logoutIcon: { marginRight: 8 },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
});
