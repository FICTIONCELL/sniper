import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, QrCode, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QrScanner from "qr-scanner";
import { useReserves, useProjects, useBlocks, useApartments, useCategories } from "@/hooks/useLocalStorage";
import { useTranslation } from "@/contexts/TranslationContext";

interface SearchSuggestion {
  id: string;
  type: 'project' | 'block' | 'apartment' | 'category' | 'reserve';
  title: string;
  subtitle?: string;
}

interface SearchBarProps {
  onSearch: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
}

export const SearchBar = ({ onSearch, onSuggestionSelect }: SearchBarProps) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  const [reserves] = useReserves();
  const [projects] = useProjects();
  const [blocks] = useBlocks();
  const [apartments] = useApartments();
  const [categories] = useCategories();

  const generateSuggestions = (searchQuery: string): SearchSuggestion[] => {
    if (!searchQuery.trim()) return [];

    const lowercaseQuery = searchQuery.toLowerCase();
    const suggestions: SearchSuggestion[] = [];

    // Search in projects
    projects
      .filter(p => p.name.toLowerCase().includes(lowercaseQuery))
      .forEach(p => {
        suggestions.push({
          id: p.id,
          type: 'project',
          title: p.name,
          subtitle: t('project')
        });
      });

    // Search in blocks
    blocks
      .filter(b => b.name.toLowerCase().includes(lowercaseQuery))
      .forEach(b => {
        const project = projects.find(p => p.id === b.projectId);
        suggestions.push({
          id: b.id,
          type: 'block',
          title: b.name,
          subtitle: `${t('block')} - ${project?.name || t('unknownProject')}`
        });
      });

    // Search in apartments
    apartments
      .filter(a => a.number.toLowerCase().includes(lowercaseQuery))
      .forEach(a => {
        const block = blocks.find(b => b.id === a.blockId);
        const project = projects.find(p => p.id === block?.projectId);
        suggestions.push({
          id: a.id,
          type: 'apartment',
          title: `${t('apartment')} ${a.number}`,
          subtitle: `${project?.name || t('project')} / ${block?.name || t('block')}`
        });
      });

    // Search in categories
    categories
      .filter(c => c.name.toLowerCase().includes(lowercaseQuery))
      .forEach(c => {
        suggestions.push({
          id: c.id,
          type: 'category',
          title: c.name,
          subtitle: t('category')
        });
      });

    // Search in reserves
    reserves
      .filter(r =>
        r.title.toLowerCase().includes(lowercaseQuery) ||
        r.description.toLowerCase().includes(lowercaseQuery)
      )
      .forEach(r => {
        const project = projects.find(p => p.id === r.projectId);
        suggestions.push({
          id: r.id,
          type: 'reserve',
          title: r.title,
          subtitle: `${t('reserve')} - ${project?.name || t('unknownProject')}`
        });
      });

    return suggestions.slice(0, 8); // Limit to 8 suggestions
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    const newSuggestions = generateSuggestions(value);
    setSuggestions(newSuggestions);
    setShowSuggestions(newSuggestions.length > 0);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.title);
    setShowSuggestions(false);
    onSuggestionSelect?.(suggestion);
    onSearch(suggestion.title);
  };

  const handleSearch = () => {
    onSearch(query);
    setShowSuggestions(false);
  };

  const [cameras, setCameras] = useState<QrScanner.Camera[]>([]);
  const [currentCamera, setCurrentCamera] = useState<string>("");

  const startQrScanner = async () => {
    if (!videoRef.current) return;

    try {
      // Get available cameras
      const availableCameras = await QrScanner.listCameras(true);
      setCameras(availableCameras);

      // Prefer back camera
      const backCamera = availableCameras.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('environment'));
      const cameraId = backCamera ? backCamera.id : availableCameras[0]?.id;
      setCurrentCamera(cameraId);

      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          setQuery(result.data);
          onSearch(result.data);
          stopQrScanner();
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment'
        }
      );

      await qrScannerRef.current.start();
    } catch (error) {
      console.error('Error starting QR scanner:', error);
    }
  };

  const switchCamera = async (cameraId: string) => {
    if (qrScannerRef.current) {
      await qrScannerRef.current.setCamera(cameraId);
      setCurrentCamera(cameraId);
    }
  };

  const stopQrScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsQrScannerOpen(false);
  };

  useEffect(() => {
    if (isQrScannerOpen) {
      startQrScanner();
    }
    return () => {
      stopQrScanner();
    };
  }, [isQrScannerOpen]);

  return (
    <div className="relative flex-1 max-w-md">
      <div className="relative flex">
        <Input
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="pr-20"
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsQrScannerOpen(true)}
            className="h-8 w-8 p-0"
          >
            <QrCode className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSearch}
            className="h-8 w-8 p-0"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Suggestions */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 z-50 bg-popover border rounded-md shadow-lg mt-1">
          {suggestions.map((suggestion) => (
            <button
              key={`${suggestion.type}-${suggestion.id}`}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm border-b last:border-b-0"
            >
              <div className="font-medium">{suggestion.title}</div>
              {suggestion.subtitle && (
                <div className="text-xs text-muted-foreground">{suggestion.subtitle}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* QR Scanner Dialog */}
      <Dialog open={isQrScannerOpen} onOpenChange={setIsQrScannerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {t('scanQrCode')}
              <Button
                variant="ghost"
                size="sm"
                onClick={stopQrScanner}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-square bg-black rounded-lg overflow-hidden relative">
              <video ref={videoRef} className="w-full h-full object-cover" />
            </div>

            {cameras.length > 1 && (
              <div className="flex justify-center">
                <select
                  className="p-2 border rounded bg-background"
                  value={currentCamera}
                  onChange={(e) => switchCamera(e.target.value)}
                >
                  {cameras.map(camera => (
                    <option key={camera.id} value={camera.id}>
                      {camera.label || `${t('camera')} ${camera.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <p className="text-sm text-muted-foreground text-center">
              {t('pointCamera')}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};