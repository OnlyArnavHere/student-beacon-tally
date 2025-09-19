import { BleClient, ScanResult } from "@capacitor-community/bluetooth-le";

export interface StudentDevice {
  id: string;
  name: string;
  deviceId: string;
  division: string;
  rssi?: number;
  timestamp: Date;
}

export interface StudentInfo {
  name: string;
  division: string;
}

// Demo mapping of device UUIDs to student info
const STUDENT_MAPPING: Record<string, StudentInfo> = {
  "12:34:56:78:90:AB": { name: "Emma Johnson", division: "Computer Science A" },
  "AA:BB:CC:DD:EE:FF": { name: "Liam Smith", division: "Computer Science A" }, 
  "11:22:33:44:55:66": { name: "Olivia Davis", division: "Computer Science A" },
  "77:88:99:00:11:22": { name: "Noah Wilson", division: "Computer Science A" },
  "FF:EE:DD:CC:BB:AA": { name: "Ava Brown", division: "Computer Science B" },
  "33:44:55:66:77:88": { name: "William Jones", division: "Computer Science B" },
  "99:88:77:66:55:44": { name: "Sophia Garcia", division: "Computer Science B" },
  "BB:CC:DD:EE:FF:00": { name: "James Miller", division: "Computer Science B" },
  "00:11:22:33:44:55": { name: "Isabella Chen", division: "Information Technology A" },
  "55:66:77:88:99:AA": { name: "Alexander Lee", division: "Information Technology A" },
  "CC:DD:EE:FF:00:11": { name: "Mia Rodriguez", division: "Information Technology B" },
  "22:33:44:55:66:77": { name: "Ethan Taylor", division: "Information Technology B" },
};

// Get all available divisions
export const getAvailableDivisions = (): string[] => {
  const divisions = Object.values(STUDENT_MAPPING).map(student => student.division);
  return [...new Set(divisions)].sort();
};

class BluetoothAttendanceService {
  private devices: Map<string, StudentDevice> = new Map();
  private isScanning = false;
  private scanTimeout?: NodeJS.Timeout;
  private selectedDivision: string | null = null;

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

  setSelectedDivision(division: string) {
    this.selectedDivision = division;
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
    const studentInfo = STUDENT_MAPPING[deviceId];
    
    if (studentInfo && !this.devices.has(deviceId)) {
      // Filter by selected division
      if (this.selectedDivision && studentInfo.division !== this.selectedDivision) {
        return;
      }
      
      const studentDevice: StudentDevice = {
        id: deviceId,
        name: studentInfo.name,
        division: studentInfo.division,
        deviceId: deviceId,
        rssi: result.rssi,
        timestamp: new Date(),
      };
      
      this.devices.set(deviceId, studentDevice);
      onDeviceFound(studentDevice);
      
      console.log(`Found student device: ${studentInfo.name} (${deviceId})`);
    }
  }

  private addMockDevices(onDeviceFound: (device: StudentDevice) => void) {
    // Get all device IDs for the selected division
    const mockDevices = Object.entries(STUDENT_MAPPING)
      .filter(([_, studentInfo]) => !this.selectedDivision || studentInfo.division === this.selectedDivision)
      .map(([deviceId, _]) => deviceId)
      .slice(0, 4); // Limit to 4 students for demo

    mockDevices.forEach((deviceId, index) => {
      setTimeout(() => {
        const studentInfo = STUDENT_MAPPING[deviceId];
        const studentDevice: StudentDevice = {
          id: deviceId,
          name: studentInfo.name,
          division: studentInfo.division,
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