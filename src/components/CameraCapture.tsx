import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, Check, X } from 'lucide-react';
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
                    // On demande la résolution maximale disponible pour le plein écran
                    width: { ideal: quality === 'hd' ? 1920 : 640 },
                    height: { ideal: quality === 'hd' ? 1080 : 480 },
                    facingMode: 'environment'
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
            setError("Accès caméra refusé ou non supporté.");
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
            // On capture à la taille réelle du flux vidéo
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
            fetch(capturedImage)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], `photo_${new Date().getTime()}.jpg`, { type: 'image/jpeg' });
                    onCapture(file);
                });
        }
    };

    return (
        // CONTENEUR PLEIN ÉCRAN
        <div className="fixed inset-0 z-50 flex flex-col bg-black h-[100dvh] w-screen overflow-hidden">
            
            {/* ZONE VIDÉO / APERÇU */}
            <div className="relative flex-1 w-full h-full bg-black">
                {error ? (
                    <div className="flex items-center justify-center h-full p-6 text-center text-white">
                        <p>{error}</p>
                        <Button onClick={onCancel} variant="link" className="text-white underline">Fermer</Button>
                    </div>
                ) : (
                    <>
                        {!capturedImage ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                // object-cover permet de remplir tout l'écran
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <img
                                src={capturedImage}
                                alt="Captured"
                                className="w-full h-full object-cover"
                            />
                        )}
                    </>
                )}
                <canvas ref={canvasRef} className="hidden" />

                {/* BOUTON FERMER (OVERLAY) */}
                <button 
                    onClick={onCancel}
                    className="absolute top-6 right-6 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
                >
                    <X className="h-6 w-6" />
                </button>

                {/* SÉLECTEUR QUALITÉ (OVERLAY) */}
                {!capturedImage && !error && (
                    <div className="absolute top-6 left-6">
                        <Select value={quality} onValueChange={(v: 'sd' | 'hd') => setQuality(v)}>
                            <SelectTrigger className="w-[80px] h-9 bg-black/40 backdrop-blur-md text-white border-white/20 rounded-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 text-white border-zinc-800">
                                <SelectItem value="sd">SD</SelectItem>
                                <SelectItem value="hd">HD</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* BARRE DE CONTRÔLE BASSE */}
            <div className="shrink-0 h-32 flex items-center justify-center bg-black px-8">
                {!capturedImage ? (
                    <Button
                        size="icon"
                        className="h-20 w-20 rounded-full bg-white hover:bg-gray-200 text-black border-4 border-gray-400/30 shadow-2xl transition-transform active:scale-90"
                        onClick={takePhoto}
                    >
                        <div className="h-16 w-16 rounded-full border-2 border-black/10 flex items-center justify-center">
                             <Camera className="h-10 w-10" />
                        </div>
                    </Button>
                ) : (
                    <div className="flex w-full gap-4 max-w-sm">
                        <Button
                            variant="outline"
                            onClick={() => setCapturedImage(null)}
                            className="flex-1 h-14 rounded-2xl bg-white/10 text-white border-white/20 hover:bg-white/20"
                        >
                            <RefreshCw className="mr-2 h-5 w-5" />
                            Reprendre
                        </Button>
                        <Button
                            onClick={confirmPhoto}
                            className="flex-1 h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold"
                        >
                            <Check className="mr-2 h-5 w-5" />
                            Valider
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
