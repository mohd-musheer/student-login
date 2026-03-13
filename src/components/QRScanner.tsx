import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2 } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  isActive: boolean;
  onClose: () => void;
}

export default function QRScanner({ onScan, onError, isActive, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!isActive) return;
    
    setIsLoading(true);
    setPermissionDenied(false);
    
    try {
      // Request camera permission directly from user gesture
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Initialize QR code reader
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      // Start continuous scanning
      codeReader.decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        (result, error) => {
          if (result) {
            const scannedText = result.getText();
            console.log('QR Code scanned:', scannedText);
            stopCamera();
            onScan(scannedText);
          }
          if (error && !(error instanceof NotFoundException)) {
            console.error('Scan error:', error);
          }
        }
      );

      setIsLoading(false);
      setHasCamera(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      setIsLoading(false);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        onError?.('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setHasCamera(false);
        onError?.('No camera found on this device.');
      } else {
        onError?.('Failed to access camera. Please try again.');
      }
    }
  }, [isActive, onScan, onError, stopCamera]);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive, startCamera, stopCamera]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-12 right-0 text-white hover:bg-white/20"
          onClick={() => {
            stopCamera();
            onClose();
          }}
        >
          <X className="w-6 h-6" />
        </Button>

        {/* Scanner container */}
        <div className="bg-gray-900 rounded-lg overflow-hidden aspect-square relative">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-white text-lg">Starting camera...</p>
            </div>
          )}

          {permissionDenied && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10 p-6 text-center">
              <Camera className="w-16 h-16 text-red-500 mb-4" />
              <p className="text-white text-lg mb-2">Camera Access Required</p>
              <p className="text-gray-400 text-sm mb-4">
                Please allow camera access in your browser settings and try again.
              </p>
              <Button onClick={startCamera} variant="secondary">
                Try Again
              </Button>
            </div>
          )}

          {!hasCamera && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10 p-6 text-center">
              <Camera className="w-16 h-16 text-yellow-500 mb-4" />
              <p className="text-white text-lg mb-2">No Camera Found</p>
              <p className="text-gray-400 text-sm">
                This device doesn't have a camera or it's not accessible.
              </p>
            </div>
          )}

          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />

          {/* Scanning overlay */}
          {!isLoading && !permissionDenied && hasCamera && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner markers */}
              <div className="absolute top-4 left-4 w-16 h-16 border-l-4 border-t-4 border-green-500" />
              <div className="absolute top-4 right-4 w-16 h-16 border-r-4 border-t-4 border-green-500" />
              <div className="absolute bottom-4 left-4 w-16 h-16 border-l-4 border-b-4 border-green-500" />
              <div className="absolute bottom-4 right-4 w-16 h-16 border-r-4 border-b-4 border-green-500" />
              
              {/* Scanning line animation */}
              <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-green-500 animate-pulse" />
            </div>
          )}
        </div>

        <p className="text-white text-center mt-4 text-sm">
          Point your camera at the QR code displayed by your faculty
        </p>
      </div>
    </div>
  );
}
