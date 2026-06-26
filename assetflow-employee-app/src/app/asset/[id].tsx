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
import { ChevronLeft, QrCode, Ticket, Laptop, Box } from 'lucide-react-native';
import { assetsApi, ticketsApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  available:   { bg: '#00bc7d15', text: '#00bc7d' },
  assigned:    { bg: '#3b82f615', text: '#60a5fa' },
  maintenance: { bg: '#fe9a0015', text: '#fe9a00' },
  retired:     { bg: '#71717a20', text: '#a1a1a1' },
  lost:        { bg: '#ff205615', text: '#ff2056' },
  damaged:     { bg: '#ef444415', text: '#f87171' },
};

const TICKET_STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  open:          { bg: '#ff205615', text: '#ff2056' },
  'in-progress': { bg: '#fe9a0015', text: '#fe9a00' },
  resolved:      { bg: '#00bc7d15', text: '#00bc7d' },
};

export default function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [asset, setAsset] = useState<any>(null);
  const [linkedTickets, setLinkedTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [a, tickets] = await Promise.all([assetsApi.getById(id!), ticketsApi.getAll()]);
        setAsset(a);
        setLinkedTickets(tickets.filter((t: any) => t.assetId === a.id));
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to load asset');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00bc7d" /></View>;
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
    { label: 'Last Scanned', value: asset.lastScannedAt ? new Date(asset.lastScannedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' },
  ];

  return (
    <View style={styles.root}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <ChevronLeft size={20} color="#fafafa" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Asset Detail</Text>
        <TouchableOpacity style={styles.navBtn}>
          <QrCode size={20} color="#fafafa" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Box size={52} color="#00bc7d" />
          </View>
          <Text style={styles.heroName}>{asset.name}</Text>
          <View style={styles.heroRow}>
            <Text style={styles.heroCode}>#{asset.sku || asset.serialNumber?.slice(0, 8) || asset.id?.slice(0, 8)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
              <Text style={[styles.statusText, { color: st.text }]}>{statusLabel}</Text>
            </View>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.detailCard}>
          <View style={styles.detailCardHeader}>
            <Text style={styles.detailCardTitle}>Details</Text>
            <View style={styles.assetInfoBadge}><Text style={styles.assetInfoText}>Asset Info</Text></View>
          </View>
          {details.map((d, i) => (
            <View key={i} style={[styles.detailRow, i < details.length - 1 && styles.detailRowBorder]}>
              <Text style={styles.detailLabel}>{d.label}</Text>
              {d.isUser ? (
                <View style={styles.userRow}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {d.value.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.detailValue}>{d.value}</Text>
                </View>
              ) : (
                <Text style={styles.detailValue}>{d.value}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Linked Tickets */}
        {linkedTickets.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Linked Tickets</Text>
              <Text style={styles.sectionBadge}>{linkedTickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length} Open</Text>
            </View>
            {linkedTickets.map((t: any) => {
              const tst = TICKET_STATUS_COLOR[t.status] ?? TICKET_STATUS_COLOR.open;
              return (
                <TouchableOpacity key={t.id} style={styles.ticketRow} onPress={() => router.push(`/ticket/${t.id}`)}>
                  <View style={[styles.ticketIcon, { backgroundColor: tst.bg }]}>
                    <Ticket size={18} color={tst.text} />
                  </View>
                  <View style={styles.ticketInfo}>
                    <Text style={styles.ticketTitle} numberOfLines={1}>{t.title}</Text>
                    <Text style={styles.ticketCode}>{t.ticketNumber || `#TKT-${t.id?.slice(0, 4)}`} · {t.type}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: tst.bg }]}>
                    <Text style={[styles.statusText, { color: tst.text }]}>{t.status.charAt(0).toUpperCase() + t.status.slice(1).replace('-', ' ')}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryAction} onPress={() => router.push({ pathname: '/create-ticket', params: { assetId: asset.id, assetName: asset.name } })}>
            <Text style={styles.primaryActionText}>Create Ticket</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09090b' },
  center: { flex: 1, backgroundColor: '#09090b', justifyContent: 'center', alignItems: 'center' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#262626', justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 18, fontWeight: '700', color: '#fafafa', letterSpacing: -0.3 },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 16 },

  heroCard: { backgroundColor: '#171717', borderRadius: 24, padding: 24, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  heroIcon: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#262626', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  heroName: { fontSize: 26, fontWeight: '800', color: '#fafafa', letterSpacing: -0.5, textAlign: 'center' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroCode: { fontSize: 14, fontWeight: '600', color: '#00bc7d' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },

  detailCard: { backgroundColor: '#171717', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  detailCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  detailCardTitle: { fontSize: 16, fontWeight: '700', color: '#fafafa' },
  assetInfoBadge: { backgroundColor: '#262626', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  assetInfoText: { fontSize: 11, color: '#a1a1a1', fontWeight: '500' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, gap: 12 },
  detailRowBorder: { marginBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  detailLabel: { fontSize: 14, color: '#a1a1a1' },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#fafafa', textAlign: 'right', flex: 1 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ad46ff30', justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { fontSize: 11, fontWeight: '700', color: '#ad46ff' },

  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fafafa' },
  sectionBadge: { fontSize: 13, fontWeight: '600', color: '#00bc7d' },
  ticketRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#171717', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  ticketIcon: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  ticketInfo: { flex: 1 },
  ticketTitle: { fontSize: 14, fontWeight: '600', color: '#fafafa' },
  ticketCode: { fontSize: 11, color: '#a1a1a1', marginTop: 2 },

  actions: { gap: 10 },
  primaryAction: { backgroundColor: '#e5e5e5', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  primaryActionText: { fontSize: 15, fontWeight: '700', color: '#09090b' },
  outlineAction: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  outlineActionText: { fontSize: 15, fontWeight: '600', color: '#fafafa' },
});
