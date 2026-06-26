import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, User, Box, Mail, MapPin } from 'lucide-react-native';
import { usersApi, assetsApi } from '../../lib/api';

export default function AdminUserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [member, setMember] = useState<any>(null);
  const [assignedAssets, setAssignedAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [userData, allAssets] = await Promise.all([
          usersApi.getById(id!),
          assetsApi.getAll(),
        ]);
        setMember(userData);
        setAssignedAssets(allAssets.filter((a: any) => a.assignedTo === userData.id || a.assignedToName === userData.name));
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to load user details.');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!member) return null;

  const initials = member.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U';

  return (
    <View style={styles.root}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <ChevronLeft size={20} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Member Inventory</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarTextLarge}>{initials}</Text>
          </View>
          <Text style={styles.profileName}>{member.name}</Text>
          <Text style={styles.profileEmail}>
            <Mail size={12} color="#94a3b8" /> {member.email}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <MapPin size={11} color="#10b981" />
              <Text style={styles.metaText}>{member.branch || 'Main Branch'}</Text>
            </View>
            <View style={[styles.metaBadge, { backgroundColor: 'rgba(59, 130, 246, 0.08)' }]}>
              <User size={11} color="#3b82f6" />
              <Text style={[styles.metaText, { color: '#3b82f6' }]}>{member.department || 'Staff'}</Text>
            </View>
          </View>
        </View>

        {/* Assigned Assets Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assigned Assets ({assignedAssets.length})</Text>
          <View style={styles.listContainer}>
            {assignedAssets.length > 0 ? (
              assignedAssets.map((asset) => (
                <TouchableOpacity
                  key={asset.id}
                  style={styles.assetCard}
                  onPress={() => router.push(`/(details)/asset-${asset.id}`)}
                >
                  <View style={styles.assetIconWrap}>
                    <Box size={16} color="#10b981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.assetName} numberOfLines={1}>{asset.name}</Text>
                    <Text style={styles.assetCategory}>{asset.category} · SN: {asset.serialNumber || 'N/A'}</Text>
                  </View>
                  <Text style={styles.assetSku}>#{asset.sku || asset.id?.slice(0, 4)}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No assets currently assigned to this user.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  navTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc', letterSpacing: -0.3 },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 20 },

  profileCard: { backgroundColor: '#1e293b', borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  avatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(59, 130, 246, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarTextLarge: { fontSize: 24, fontWeight: '800', color: '#3b82f6' },
  profileName: { fontSize: 20, fontWeight: '700', color: '#f8fafc', marginBottom: 6 },
  profileEmail: { fontSize: 13, color: '#94a3b8', marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaRow: { flexDirection: 'row', gap: 8 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  metaText: { fontSize: 11, fontWeight: '600', color: '#10b981' },

  section: {},
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc', marginBottom: 12, paddingLeft: 4 },
  listContainer: { gap: 10 },
  assetCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1e293b', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#334155' },
  assetIconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(16, 185, 129, 0.08)', justifyContent: 'center', alignItems: 'center' },
  assetName: { fontSize: 14, fontWeight: '600', color: '#f8fafc' },
  assetCategory: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  assetSku: { fontSize: 12, color: '#10b981', fontWeight: '600' },

  emptyContainer: { padding: 32, alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 14, borderStyle: 'dashed', borderWidth: 1, borderColor: '#334155' },
  emptyText: { color: '#94a3b8', fontSize: 13 },
});
