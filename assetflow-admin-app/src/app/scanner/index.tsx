import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Button, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { ChevronLeft, QrCode } from 'lucide-react-native';
import { assetsApi } from '../../lib/api';

export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  if (!permission) {
    return <View style={styles.center}><Text style={styles.permissionText}>Requesting camera permission...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      // Find asset by scanned sku/id
      const allAssets = await assetsApi.getAll();
      const matched = allAssets.find(
        (a) => a.id === data || a.sku === data || a.serialNumber === data
      );

      if (matched) {
        Alert.alert(
          'Asset Scanned',
          `Name: ${matched.name}\nStatus: ${matched.status}`,
          [
            {
              text: 'View Details',
              onPress: () => {
                router.replace(`/(details)/asset-${matched.id}`);
              },
            },
            {
              text: 'Rescan',
              onPress: () => setScanned(false),
              style: 'cancel',
            },
          ]
        );
      } else {
        Alert.alert(
          'Unrecognized QR Code',
          `Scanned value: ${data}\nNo matching asset was found in inventory.`,
          [{ text: 'Rescan', onPress: () => setScanned(false) }]
        );
      }
    } catch (err: any) {
      Alert.alert('Scan Error', err.message || 'Failed to process barcode.');
      setScanned(false);
    }
  };

  // Mock test scan for emulators
  const triggerMockScan = () => {
    handleBarcodeScanned({ data: 'LAP-001' });
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <ChevronLeft size={20} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>QR Scanner</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Viewfinder */}
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.reticleContainer}>
            <View style={styles.reticleCornerTL} />
            <View style={styles.reticleCornerTR} />
            <View style={styles.reticleCornerBL} />
            <View style={styles.reticleCornerBR} />
            <QrCode size={40} color="rgba(16, 185, 129, 0.4)" style={styles.reticleIcon} />
          </View>
          <Text style={styles.scanText}>Position asset QR code inside the frame</Text>

          {/* Emulator mock tool */}
          <TouchableOpacity style={styles.mockBtn} onPress={triggerMockScan}>
            <Text style={styles.mockBtnText}>Simulate Test Scan</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 24 },
  permissionText: { color: '#94a3b8', fontSize: 15, textAlign: 'center', marginBottom: 20 },
  permissionBtn: { backgroundColor: '#10b981', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  permissionBtnText: { color: '#0f172a', fontWeight: '700', fontSize: 14 },

  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: 'rgba(15, 23, 42, 0.8)' },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  navTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc', letterSpacing: -0.3 },

  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  reticleContainer: { width: 220, height: 220, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  reticleCornerTL: { position: 'absolute', top: 0, left: 0, width: 24, height: 24, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#10b981' },
  reticleCornerTR: { position: 'absolute', top: 0, right: 0, width: 24, height: 24, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#10b981' },
  reticleCornerBL: { position: 'absolute', bottom: 0, left: 0, width: 24, height: 24, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#10b981' },
  reticleCornerBR: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#10b981' },
  reticleIcon: { position: 'absolute' },

  scanText: { color: '#94a3b8', fontSize: 13, marginTop: 24, fontWeight: '500' },
  mockBtn: { marginTop: 40, backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  mockBtnText: { color: '#10b981', fontSize: 12, fontWeight: '700' },
});
