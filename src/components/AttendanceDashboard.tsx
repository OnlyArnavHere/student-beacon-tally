import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Bluetooth, 
  BluetoothConnected, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  LogOut,
  Scan,
  GraduationCap
} from "lucide-react";
import { bluetoothService, StudentDevice, getAvailableDivisions } from "@/services/bluetoothService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AttendanceDashboardProps {
  onLogout: () => void;
}

const AttendanceDashboard = ({ onLogout }: AttendanceDashboardProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [presentStudents, setPresentStudents] = useState<StudentDevice[]>([]);
  const [scanStartTime, setScanStartTime] = useState<Date | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [availableDivisions] = useState(getAvailableDivisions());
  const { toast } = useToast();

  useEffect(() => {
    // Initialize Bluetooth service
    bluetoothService.initialize().then((success) => {
      if (!success) {
        toast({
          title: "Bluetooth Unavailable",
          description: "Using demo mode with mock students",
          variant: "destructive",
        });
      }
    });
  }, [toast]);

  const handleStartAttendance = async () => {
    if (!selectedDivision) {
      toast({
        title: "Select Division",
        description: "Please select a division first",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setScanStartTime(new Date());
    setPresentStudents([]);

    // Set the division filter in the service
    bluetoothService.setSelectedDivision(selectedDivision);

    toast({
      title: "Scanning Started",
      description: `Looking for students in ${selectedDivision}...`,
    });

    await bluetoothService.startScanning((device) => {
      setPresentStudents(prev => {
        // Avoid duplicates
        if (prev.some(student => student.id === device.id)) {
          return prev;
        }
        
        toast({
          title: "Student Detected",
          description: `${device.name} is present`,
        });
        
        return [...prev, device];
      });
    });

    // Auto-stop after scanning completes
    setTimeout(() => {
      setIsScanning(false);
      toast({
        title: "Scan Complete",
        description: `Found ${bluetoothService.getDetectedStudents().length} students`,
      });
    }, 10000);
  };

  const handleStopScanning = async () => {
    await bluetoothService.stopScanning();
    setIsScanning(false);
    
    toast({
      title: "Scanning Stopped",
      description: `${presentStudents.length} students detected`,
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSignalStrength = (rssi?: number): 'strong' | 'medium' | 'weak' => {
    if (!rssi) return 'medium';
    if (rssi > -50) return 'strong';
    if (rssi > -70) return 'medium';
    return 'weak';
  };

  return (
    <div className="min-h-screen bg-gradient-bg p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Classroom Attendance</h1>
            <p className="text-muted-foreground">Track student presence with Bluetooth</p>
          </div>
          <Button 
            variant="outline" 
            onClick={onLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Present Students</p>
                  <p className="text-2xl font-bold text-foreground">{presentStudents.length}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Scanning Status</p>
                  <p className="text-2xl font-bold text-foreground">
                    {isScanning ? "Active" : "Idle"}
                  </p>
                </div>
                {isScanning ? (
                  <BluetoothConnected className="w-8 h-8 text-primary animate-pulse" />
                ) : (
                  <Bluetooth className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Scan</p>
                  <p className="text-2xl font-bold text-foreground">
                    {scanStartTime ? formatTime(scanStartTime) : "—"}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Division Selection & Scan Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Select Division
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Choose Division:</label>
              <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a division to take attendance" />
                </SelectTrigger>
                <SelectContent>
                  {availableDivisions.map((division) => (
                    <SelectItem key={division} value={division}>
                      {division}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleStartAttendance}
                disabled={isScanning || !selectedDivision}
                className="bg-gradient-primary hover:opacity-90 transition-opacity"
              >
                <Scan className="w-4 h-4 mr-2" />
                {isScanning ? "Scanning..." : "Start Attendance Scan"}
              </Button>
              
              {isScanning && (
                <Button
                  variant="outline"
                  onClick={handleStopScanning}
                >
                  Stop Scanning
                </Button>
              )}
            </div>
            
            {selectedDivision && !isScanning && (
              <div className="text-sm text-muted-foreground">
                Ready to scan for <span className="font-medium text-foreground">{selectedDivision}</span> students
              </div>
            )}
            
            {isScanning && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Scanning for {selectedDivision} students... ({presentStudents.length} found)
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              Present Students ({presentStudents.length})
              {selectedDivision && <Badge variant="outline" className="ml-2">{selectedDivision}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {presentStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No students detected yet</p>
                <p className="text-sm">
                  {selectedDivision 
                    ? `Select division and start scanning to detect ${selectedDivision} students` 
                    : "Select a division and start scanning to detect students"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {presentStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 bg-success-light rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.division} • Detected at {formatTime(student.timestamp)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          getSignalStrength(student.rssi) === 'strong'
                            ? "border-success text-success"
                            : getSignalStrength(student.rssi) === 'medium'
                            ? "border-warning text-warning"
                            : "border-muted-foreground text-muted-foreground"
                        }
                      >
                        {student.rssi ? `${student.rssi} dBm` : "Connected"}
                      </Badge>
                      <Badge className="bg-success text-success-foreground">
                        Present
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AttendanceDashboard;