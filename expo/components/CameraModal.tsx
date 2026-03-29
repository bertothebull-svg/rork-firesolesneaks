import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { X, FlipHorizontal, Camera as CameraIcon } from 'lucide-react-native';
import { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants/styles';

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (uri: string) => void;
}

export default function CameraModal({ visible, onClose, onCapture }: CameraModalProps) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading camera...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  const handleRequestPermission = async () => {
    console.log('[Camera] Requesting camera permission...');
    setIsRequestingPermission(true);
    try {
      const result = await requestPermission();
      console.log('[Camera] Permission result:', result);
      if (!result.granted) {
        console.log('[Camera] Permission denied by user');
      }
    } catch (error) {
      console.error('[Camera] Error requesting permission:', error);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.container}>
          <View style={styles.permissionContainer}>
            <CameraIcon size={64} color={COLORS.textSecondary} />
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionText}>
              We need your permission to access the camera to take photos of your wardrobe items.
            </Text>
            <TouchableOpacity 
              style={styles.permissionButton} 
              onPress={handleRequestPermission}
              disabled={isRequestingPermission}
            >
              {isRequestingPermission ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.permissionButtonText}>Grant Permission</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      console.log('[Camera] Taking picture...');
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo && photo.uri) {
        console.log('[Camera] Photo captured:', photo.uri);
        onCapture(photo.uri);
        onClose();
      }
    } catch (error) {
      console.error('[Camera] Error taking picture:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.container}>
          <View style={styles.permissionContainer}>
            <CameraIcon size={64} color={COLORS.textSecondary} />
            <Text style={styles.permissionTitle}>Camera Not Available</Text>
            <Text style={styles.permissionText}>
              The camera feature is not available on web. Please use the photo library option instead.
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={onClose}>
              <Text style={styles.permissionButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Take Photo</Text>
            <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
              <FlipHorizontal size={28} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.controls}>
            <View style={styles.captureButtonContainer}>
              <TouchableOpacity 
                style={styles.captureButton} 
                onPress={takePicture}
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <ActivityIndicator size="large" color="#FFF" />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: COLORS.background,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.text,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  cancelButton: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  flipButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  captureButtonContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: '#FFF',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
  },
});
