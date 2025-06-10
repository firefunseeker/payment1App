// QR Scanner Page
import { StyleSheet, Text } from 'react-native';
import { useEffect, useState } from 'react';
import { Camera, BarCodeScanner} from 'expo-camera';

export const QRScannerPage = () => {
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  if (hasPermission === null) return <Text>Requesting for camera permission</Text>;
  if (hasPermission === false) return <Text>No access to camera</Text>;

  return (
    <Camera
      style={{ flex: 1 }}
      onBarCodeScanned={({ data }) => alert(`Scanned: ${data}`)}
      barCodeScannerSettings={{
        barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
      }}
    />
  );
};

// Styles (shared)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 15,
    borderRadius: 8,
  },
  text: {
    marginTop: 10,
  },
});

export default QRScannerPage;