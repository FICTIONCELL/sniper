import React, { useState, useEffect } from 'react';
import { useGoogleDrive } from '@/contexts/GoogleDriveContext';
import { useProjects } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CameraCapture } from '@/components/CameraCapture';
import { FileText, Image as ImageIcon, Upload, Plus, Loader2, FolderOpen, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const Documents = () => {
    const { isAuthenticated, login, uploadDocument, getDocuments, isSyncing } = useGoogleDrive();
    const [projects] = useProjects();
    const { toast } = useToast();

    const [documents, setDocuments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedProject, setSelectedProject] = useState<string>('all');

    // Upload State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadProject, setUploadProject] = useState<string>('');
    const [uploadName, setUploadName] = useState<string>('');
    const [activeTab, setActiveTab] = useState('upload');

    useEffect(() => {
        if (isAuthenticated) {
            loadDocuments();
        }
    }, [isAuthenticated, selectedProject]);

    const loadDocuments = async () => {
        setIsLoading(true);
        try {
            const docs = await getDocuments(selectedProject === 'all' ? undefined : selectedProject);
            setDocuments(docs);
        } catch (error) {
            console.error("Failed to load documents", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadFile(e.target.files[0]);
            setUploadName(e.target.files[0].name);
        }
    };

    const handleCameraCapture = (file: File) => {
        setUploadFile(file);
        setUploadName(file.name);
        // Switch to upload tab to review/confirm
        setActiveTab('upload');
    };

    const handleUpload = async () => {
        if (!uploadFile || !uploadProject || !uploadName) {
            toast({ title: "Erreur", description: "Veuillez remplir tous les champs.", variant: "destructive" });
            return;
        }

        try {
            await uploadDocument(uploadFile, uploadName, uploadProject);
            setIsDialogOpen(false);
            setUploadFile(null);
            setUploadName('');
            setUploadProject('');
            loadDocuments(); // Refresh list
        } catch (error) {
            // Error handled in context
        }
    };

    const getProjectName = (id: string) => {
        return projects.find(p => p.id === id)?.name || "Inconnu";
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.includes('image')) return <ImageIcon className="h-5 w-5 text-purple-500" />;
        if (mimeType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
        return <FileText className="h-5 w-5 text-blue-500" />;
    };

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <FolderOpen className="h-16 w-16 text-muted-foreground" />
                <h2 className="text-2xl font-bold">Documents</h2>
                <p className="text-muted-foreground text-center max-w-md">
                    Connectez-vous à Google Drive pour gérer vos documents et photos de chantier.
                </p>
                <Button onClick={login}>Se connecter à Google Drive</Button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Documents</h1>
                    <p className="text-muted-foreground">Gérez vos plans, photos et documents par projet.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Ajouter un document
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Ajouter un document</DialogTitle>
                        </DialogHeader>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="upload">Importer un fichier</TabsTrigger>
                                <TabsTrigger value="camera">Prendre une photo</TabsTrigger>
                            </TabsList>

                            <TabsContent value="upload" className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Projet</label>
                                    <Select value={uploadProject} onValueChange={setUploadProject}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner un projet" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projects.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nom du fichier</label>
                                    <Input
                                        value={uploadName}
                                        onChange={(e) => setUploadName(e.target.value)}
                                        placeholder="Ex: Plan RDC.pdf"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Fichier</label>
                                    {!uploadFile ? (
                                        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
                                            <Input
                                                type="file"
                                                className="hidden"
                                                id="file-upload"
                                                onChange={handleFileUpload}
                                            />
                                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                                <Upload className="h-8 w-8 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">Cliquez pour sélectionner un fichier</span>
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
                                            <span className="text-sm truncate max-w-[200px]">{uploadFile.name}</span>
                                            <Button variant="ghost" size="sm" onClick={() => setUploadFile(null)}>Changer</Button>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    className="w-full"
                                    onClick={handleUpload}
                                    disabled={!uploadFile || !uploadProject || !uploadName || isSyncing}
                                >
                                    {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    Sauvegarder sur Drive
                                </Button>
                            </TabsContent>

                            <TabsContent value="camera" className="h-[400px]">
                                <CameraCapture
                                    onCapture={handleCameraCapture}
                                    onCancel={() => setActiveTab('upload')}
                                />
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-lg">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Filtrer par projet" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les projets</SelectItem>
                        {projects.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" onClick={loadDocuments} disabled={isLoading}>
                    <Loader2 className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* Documents Grid */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : documents.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">Aucun document</h3>
                    <p className="text-muted-foreground">Sélectionnez un projet ou ajoutez un nouveau document.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => {
                        let meta = {};
                        try { meta = JSON.parse(doc.description || "{}"); } catch (e) { }
                        // @ts-ignore
                        const projectName = getProjectName(meta.projectId);

                        return (
                            <Card key={doc.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4 flex items-start gap-4">
                                    <div className="p-2 bg-muted rounded-lg">
                                        {getFileIcon(doc.mimeType)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium truncate" title={doc.name}>{doc.name}</h4>
                                        <p className="text-xs text-muted-foreground mt-1">{projectName}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(doc.createdTime).toLocaleDateString()}</p>
                                    </div>
                                    <a
                                        href={doc.webViewLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 hover:bg-muted rounded-full transition-colors"
                                    >
                                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                    </a>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
