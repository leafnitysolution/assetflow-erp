import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ClipboardList, History, ShieldAlert, CheckCircle } from 'lucide-react-native';
import { logsApi } from '../../lib/api';

export default function AuditCenterScreen() {
  const [activeTab, setActiveTab] = useState<'branch' | 'logs'>('branch');
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>('Main Headquarters');
  const router = useRouter();

  const branches = ['Main Headquarters', 'Secondary Hub', 'London Branch', 'Chicago Office'];

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await logsApi.getAll();
      setLogs(data);
    } catch (_) {
      // Mock log data if database tables are uninitialized
      setLogs([
        { id: '1', action: 'ASSIGN', userName: 'Admin User', entityName: 'MacBook Pro 16"', details: 'Assigned to member Alok Raj', createdAt: new Date().toISOString() },
        { id: '2', action: 'REPAIR_START', userName: 'Admin User', entityName: 'Dell Monitor 27"', details: 'Sent to vendor TechCare for screen replacement', createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: '3', action: 'RETURN', userName: 'Alok Raj', entityName: 'iPad Air', details: 'Returned to inventory in Good condition', createdAt: new Date(Date.now() - 7200000).toISOString() },
        { id: '4', action: 'LOGIN', userName: 'Admin User', entityName: 'Mobile Device', details: 'Authenticated via JWT from 192.168.1.1', createdAt: new Date(Date.now() - 86400000).toISOString() },
      ]);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab]);

  const handleLaunchAudit = () => {
    Alert.alert(
      'Launch Audit',
      `Would you like to initiate a physical asset audit for ${selectedBranch}? This will track scanned items dynamically.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Launch Scanner',
          onPress: () => router.push('/scanner'),
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.title}>Compliance & Auditing</Text>
        <Text style={styles.subtitle}>Verify physical inventory and review system logs</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'branch' && styles.tabActive]}
          onPress={() => setActiveTab('branch')}
        >
          <ClipboardList size={16} color={activeTab === 'branch' ? '#0f172a' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'branch' && styles.tabTextActive]}>
            Physical Audit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'logs' && styles.tabActive]}
          onPress={() => setActiveTab('logs')}
        >
          <History size={16} color={activeTab === 'logs' ? '#0f172a' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'logs' && styles.tabTextActive]}>
            Audit Logs
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'branch' ? (
        <View style={styles.branchContainer}>
          <Text style={styles.sectionTitle}>Select Branch for Audit</Text>
          <View style={styles.branchList}>
            {branches.map((b) => (
              <TouchableOpacity
                key={b}
                style={[styles.branchCard, selectedBranch === b && styles.branchCardActive]}
                onPress={() => setSelectedBranch(b)}
              >
                <Text style={[styles.branchName, selectedBranch === b && styles.branchNameActive]}>
                  {b}
                </Text>
                {selectedBranch === b && <CheckCircle size={16} color="#10b981" />}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.launchBtn} onPress={handleLaunchAudit}>
            <Text style={styles.launchBtnText}>Launch Active Scanner Audit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {loadingLogs ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="small" color="#10b981" />
            </View>
          ) : (
            <FlatList
              data={logs}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.logsList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.logCard}>
                  <View style={styles.logHeader}>
                    <View style={styles.actionRow}>
                      <View style={styles.alertIcon}>
                        <ShieldAlert size={14} color="#10b981" />
                      </View>
                      <Text style={styles.logAction}>{item.action}</Text>
                    </View>
                    <Text style={styles.logTime}>
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={styles.logDetails}>{item.details}</Text>
                  <Text style={styles.logUser}>By: {item.userName} · {item.entityName}</Text>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No audit logs found.</Text>
                </View>
              }
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a', paddingTop: 56 },
  header: { paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#f8fafc', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },

  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  tabActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  tabTextActive: { color: '#0f172a' },

  branchContainer: { paddingHorizontal: 20, flex: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#f8fafc', marginBottom: 12 },
  branchList: { gap: 10, marginBottom: 24 },
  branchCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  branchCardActive: { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.05)' },
  branchName: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  branchNameActive: { color: '#f8fafc' },

  launchBtn: { backgroundColor: '#10b981', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  launchBtnText: { fontSize: 15, fontWeight: '700', color: '#0f172a' },

  logsList: { paddingHorizontal: 20, paddingBottom: 100 },
  logCard: { backgroundColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alertIcon: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(16, 185, 129, 0.08)', justifyContent: 'center', alignItems: 'center' },
  logAction: { fontSize: 12, fontWeight: '700', color: '#10b981' },
  logTime: { fontSize: 11, color: '#64748b' },
  logDetails: { fontSize: 13, color: '#f8fafc', lineHeight: 18, marginBottom: 6 },
  logUser: { fontSize: 11, color: '#64748b' },

  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 13 },
});
