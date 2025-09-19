import { BleClient, ScanResult } from "@capacitor-community/bluetooth-le";

export interface StudentDevice {
  id: string;
  name: string;
  deviceId: string;
  rssi?: number;
  timestamp: Date;
}

// Demo mapping of device UUIDs to student names
const STUDENT_MAPPING: Record<string, string> = {
  "12:34:56:78:90:AB": "Emma Johnson",
  "AA:BB:CC:DD:EE:FF": "Liam Smith", 
  "11:22:33:44:55:66": "Olivia Davis",
  "77:88:99:00:11:22": "Noah Wilson",
  "FF:EE:DD:CC:BB:AA": "Ava Brown",
  "33:44:55:66:77:88": "William Jones",
  "99:88:77:66:55:44": "Sophia Garcia",
  "BB:CC:DD:EE:FF:00": "James Miller",
};

class BluetoothAttendanceService {
  private devices: Map<string, StudentDevice> = new Map();
  private isScanning = false;
  private scanTimeout?: NodeJS.Timeout;

  async initialize(): Promise<boolean> {
    try {
      // Check if Bluetooth is available
      await BleClient.initialize();
      return true;
    } catch (error) {
      console.error("Failed to initialize Bluetooth:", error);
      return false;
    }
  }

  async startScanning(onDeviceFound: (device: StudentDevice) => void): Promise<void> {
    if (this.isScanning) {
      console.log("Already scanning");
      return;
    }

    try {
      this.isScanning = true;
      
      // Clear previous devices
      this.devices.clear();

      console.log("Starting Bluetooth scan for student devices...");
      
      await BleClient.requestLEScan(
        {
          // Look for any devices - in real implementation, you'd filter by specific service UUIDs
          services: [],
        },
        (result) => {
          this.handleDeviceFound(result, onDeviceFound);
        }
      );

      // Stop scanning after 10 seconds
      this.scanTimeout = setTimeout(async () => {
        await this.stopScanning();
      }, 10000);

      // For demo purposes, also add some mock devices
      this.addMockDevices(onDeviceFound);

    } catch (error) {
      console.error("Failed to start scanning:", error);
      this.isScanning = false;
      
      // Fallback to mock devices if Bluetooth fails
      this.addMockDevices(onDeviceFound);
    }
  }

  private handleDeviceFound(result: ScanResult, onDeviceFound: (device: StudentDevice) => void) {
    // Check if this device ID maps to a student
    const deviceId = result.device.deviceId;
    const studentName = STUDENT_MAPPING[deviceId];
    
    if (studentName && !this.devices.has(deviceId)) {
      const studentDevice: StudentDevice = {
        id: deviceId,
        name: studentName,
        deviceId: deviceId,
        rssi: result.rssi,
        timestamp: new Date(),
      };
      
      this.devices.set(deviceId, studentDevice);
      onDeviceFound(studentDevice);
      
      console.log(`Found student device: ${studentName} (${deviceId})`);
    }
  }

  private addMockDevices(onDeviceFound: (device: StudentDevice) => void) {
    // Simulate finding some students for demo
    const mockDevices = [
      "12:34:56:78:90:AB",
      "AA:BB:CC:DD:EE:FF", 
      "11:22:33:44:55:66",
      "77:88:99:00:11:22"
    ];

    mockDevices.forEach((deviceId, index) => {
      setTimeout(() => {
        const studentDevice: StudentDevice = {
          id: deviceId,
          name: STUDENT_MAPPING[deviceId],
          deviceId: deviceId,
          rssi: Math.floor(Math.random() * 40) - 80, // Random signal strength
          timestamp: new Date(),
        };
        
        this.devices.set(deviceId, studentDevice);
        onDeviceFound(studentDevice);
      }, (index + 1) * 1500); // Stagger discoveries
    });
  }

  async stopScanning(): Promise<void> {
    if (!this.isScanning) return;

    try {
      await BleClient.stopLEScan();
      this.isScanning = false;
      
      if (this.scanTimeout) {
        clearTimeout(this.scanTimeout);
        this.scanTimeout = undefined;
      }
      
      console.log("Stopped Bluetooth scanning");
    } catch (error) {
      console.error("Failed to stop scanning:", error);
    }
  }

  getDetectedStudents(): StudentDevice[] {
    return Array.from(this.devices.values());
  }

  isCurrentlyScanning(): boolean {
    return this.isScanning;
  }
}

export const bluetoothService = new BluetoothAttendanceService();