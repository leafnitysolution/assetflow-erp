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
import { ChevronLeft, QrCode, Ticket, Box, UserPlus, Settings, CornerDownLeft } from 'lucide-react-native';
import { assetsApi, ticketsApi } from '../../lib/api';

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  available:   { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' },
  assigned:    { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' },
  maintenance: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
  repair:      { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
  retired:     { bg: 'rgba(148, 163, 184, 0.1)', text: '#94a3b8' },
  lost:        { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
  damaged:     { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
};

export default function AdminAssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [asset, setAsset] = useState<any>(null);
  const [linkedTickets, setLinkedTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [a, tickets] = await Promise.all([
        assetsApi.getById(id!),
        ticketsApi.getAll(),
      ]);
      setAsset(a);
      setLinkedTickets(tickets.filter((t: any) => t.assetId === a.id));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load asset details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAssign = () => {
    Alert.prompt(
      'Assign Asset',
      'Enter the User ID to assign this asset:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Assign',
          onPress: async (userId?: string) => {
            if (!userId) return;
            setLoading(true);
            try {
              await assetsApi.assign(asset.id, userId);
              Alert.alert('Success', 'Asset assigned successfully.');
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to assign asset.');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReturn = () => {
    Alert.alert(
      'Return Asset',
      'Are you sure you want to log return of this asset to inventory?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Return',
          onPress: async () => {
            setLoading(true);
            try {
              await assetsApi.return(asset.id);
              Alert.alert('Success', 'Asset returned successfully.');
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to return asset.');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRepair = () => {
    Alert.alert(
      'Send for Repair',
      'Mark this asset as in maintenance/repair status?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setLoading(true);
            try {
              // Set asset status to maintenance/repair
              await assetsApi.update(asset.id, { status: 'maintenance' });
              Alert.alert('Success', 'Asset status set to maintenance.');
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to update status.');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!asset) return null;

  const st = STATUS_COLOR[asset.status] ?? STATUS_COLOR.available;
  const statusLabel = asset.status?.charAt(0).toUpperCase() + asset.status?.slice(1);

  const details = [
    { label: 'Category', value: asset.category?.replace('_', ' ') || '—' },
    { label: 'Serial No.', value: asset.serialNumber || '—' },
    { label: 'Branch', value: asset.branch || '—' },
    { label: 'Department', value: asset.department || '—' },
    { label: 'Assigned To', value: asset.assignedToName || 'Unassigned', isUser: !!asset.assignedToName },
    { label: 'Purchase Date', value: asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—' },
    { label: 'Warranty Until', value: asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—' },
  ];

  return (
    <View style={styles.root}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <ChevronLeft size={20} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Asset Profile</Text>
        <TouchableOpacity style={styles.navBtn}>
          <QrCode size={20} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Box size={48} color="#10b981" />
          </View>
          <Text style={styles.heroName}>{asset.name}</Text>
          <View style={styles.heroRow}>
            <Text style={styles.heroCode}>#{asset.sku || asset.id?.slice(0, 8)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
              <Text style={[styles.statusText, { color: st.text }]}>{statusLabel}</Text>
            </View>
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.actionGrid}>
          {asset.status === 'available' && (
            <TouchableOpacity style={[styles.actionCell, { borderColor: '#3b82f6' }]} onPress={handleAssign}>
              <UserPlus size={18} color="#3b82f6" />
              <Text style={[styles.actionCellText, { color: '#3b82f6' }]}>Assign</Text>
            </TouchableOpacity>
          )}

          {asset.status === 'assigned' && (
            <TouchableOpacity style={[styles.actionCell, { borderColor: '#10b981' }]} onPress={handleReturn}>
              <CornerDownLeft size={18} color="#10b981" />
              <Text style={[styles.actionCellText, { color: '#10b981' }]}>Return</Text>
            </TouchableOpacity>
          )}

          {asset.status !== 'maintenance' && asset.status !== 'repair' && (
            <TouchableOpacity style={[styles.actionCell, { borderColor: '#f59e0b' }]} onPress={handleRepair}>
              <Settings size={18} color="#f59e0b" />
              <Text style={[styles.actionCellText, { color: '#f59e0b' }]}>Send Repair</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Details Card */}
        <View style={styles.detailCard}>
          <View style={styles.detailCardHeader}>
            <Text style={styles.detailCardTitle}>Asset Specs & Info</Text>
          </View>
          {details.map((d, i) => (
            <View key={i} style={[styles.detailRow, i < details.length - 1 && styles.detailRowBorder]}>
              <Text style={styles.detailLabel}>{d.label}</Text>
              <Text style={styles.detailValue}>{d.value}</Text>
            </View>
          ))}
        </View>

        {/* Linked Tickets */}
        {linkedTickets.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Linked Tickets</Text>
            {linkedTickets.map((t: any) => (
              <TouchableOpacity
                key={t.id}
                style={styles.ticketRow}
                onPress={() => router.push(`/(details)/ticket-${t.id}`)}
              >
                <View style={styles.ticketIcon}>
                  <Ticket size={16} color="#10b981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ticketTitle} numberOfLines={1}>{t.title}</Text>
                  <Text style={styles.ticketCode}>{t.ticketNumber || `TKT-${t.id?.slice(0, 4)}`}</Text>
                </View>
                <Text style={styles.ticketStatus}>{t.status}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 16 },

  heroCard: { backgroundColor: '#1e293b', borderRadius: 24, padding: 24, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#334155' },
  heroIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', marginBottom: 4, borderWidth: 1, borderColor: '#334155' },
  heroName: { fontSize: 24, fontWeight: '800', color: '#f8fafc', letterSpacing: -0.5, textAlign: 'center' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroCode: { fontSize: 14, fontWeight: '600', color: '#10b981' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },

  actionGrid: { flexDirection: 'row', gap: 10, marginVertical: 8 },
  actionCell: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, backgroundColor: '#1e293b' },
  actionCellText: { fontSize: 13, fontWeight: '700' },

  detailCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#334155' },
  detailCardHeader: { marginBottom: 16 },
  detailCardTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, gap: 12 },
  detailRowBorder: { marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#334155' },
  detailLabel: { fontSize: 14, color: '#94a3b8' },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#f8fafc', textAlign: 'right', flex: 1 },

  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc', paddingLeft: 4 },
  ticketRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1e293b', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#334155' },
  ticketIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(16, 185, 129, 0.08)', justifyContent: 'center', alignItems: 'center' },
  ticketTitle: { fontSize: 14, fontWeight: '600', color: '#f8fafc' },
  ticketCode: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  ticketStatus: { fontSize: 11, fontWeight: '600', color: '#f59e0b', textTransform: 'capitalize' },
});
