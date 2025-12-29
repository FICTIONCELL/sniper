import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, Check, X, Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    onCancel: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [quality, setQuality] = useState<'sd' | 'hd'>('hd');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startCamera = async () => {
        try {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            const constraints = {
                video: {
                    width: quality === 'hd' ? { ideal: 1920 } : { ideal: 640 },
                    height: quality === 'hd' ? { ideal: 1080 } : { ideal: 480 },
                    facingMode: 'environment' // Prefer back camera on mobile
                }
            };

            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
            setError(null);
        } catch (err) {
            console.error("Camera error:", err);
            setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
        }
    };

    useEffect(() => {
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [quality]);

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
                setCapturedImage(imageUrl);
            }
        }
    };

    const confirmPhoto = () => {
        if (capturedImage) {
            // Convert base64 to File
            fetch(capturedImage)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], `photo_${new Date().getTime()}.jpg`, { type: 'image/jpeg' });
                    onCapture(file);
                });
        }
    };

    const retakePhoto = () => {
        setCapturedImage(null);
    };

    return (
        <div className="flex flex-col items-center gap-4 w-full h-full bg-black/90 p-4 rounded-lg">
            {error ? (
                <div className="text-red-500">{error}</div>
            ) : (
                <div className="relative w-full max-w-md aspect-[4/3] bg-black rounded-lg overflow-hidden">
                    {!capturedImage ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <img
                            src={capturedImage}
                            alt="Captured"
                            className="w-full h-full object-cover"
                        />
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                </div>
            )}

            <div className="flex items-center gap-4 w-full max-w-md justify-between">
                {!capturedImage ? (
                    <>
                        <Select value={quality} onValueChange={(v: 'sd' | 'hd') => setQuality(v)}>
                            <SelectTrigger className="w-[100px] bg-white/10 text-white border-white/20">
                                <SelectValue placeholder="Qualité" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sd">SD (Low)</SelectItem>
                                <SelectItem value="hd">HD (High)</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            size="icon"
                            className="h-16 w-16 rounded-full bg-white hover:bg-gray-200 text-black"
                            onClick={takePhoto}
                        >
                            <Camera className="h-8 w-8" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={onCancel}
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    </>
                ) : (
                    <div className="flex w-full justify-between px-8">
                        <Button
                            variant="destructive"
                            onClick={retakePhoto}
                            className="rounded-full"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reprendre
                        </Button>
                        <Button
                            variant="default"
                            onClick={confirmPhoto}
                            className="rounded-full bg-green-600 hover:bg-green-700"
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Valider
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
