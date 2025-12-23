import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Key, Users, Shield, BarChart3, Plus, Trash2, Ban, Copy, RefreshCw, Download, AlertCircle, Search, Play, Pause, PieChart as PieChartIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useGoogleDrive } from "@/contexts/GoogleDriveContext";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || "https://sniper-rptn.onrender.com";
const ADMIN_EMAIL = "fictionsell@gmail.com";
const ADMIN_PASSWORD = "127.0.0.1";

interface License {
    id: string;
    key: string;
    email: string;
    type: 'trial' | 'monthly' | '6months' | 'yearly' | 'lifetime';
    status: 'active' | 'suspended' | 'revoked' | 'expired';
    startDate: string;
    endDate?: string;
    daysRemaining: number;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

interface Stats {
    totalLicenses: number;
    activeLicenses: number;
    suspendedLicenses: number;
    revokedLicenses: number;
    expiredLicenses: number;
    totalTrials: number;
    totalUsers: number;
    byType: {
        trial: number;
        monthly: number;
        sixMonths: number;
        yearly: number;
        lifetime: number;
    };
}

const Admin = () => {
    const { toast } = useToast();
    const { userEmail, isAuthenticated, login } = useGoogleDrive();
    const [isAuthorized, setIsAuthorized] = useState(false);

    const [licenses, setLicenses] = useState<License[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Form states
    const [newEmail, setNewEmail] = useState("");
    const [newType, setNewType] = useState<string>("monthly");
    const [newNotes, setNewNotes] = useState("");

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    // Check if user is authorized admin
    useEffect(() => {
        if (isAuthenticated && userEmail === ADMIN_EMAIL) {
            setIsAuthorized(true);
            loadAllData();
        } else {
            setIsAuthorized(false);
        }
    }, [isAuthenticated, userEmail]);

    const loadAllData = async () => {
        setIsLoading(true);
        try {
            const headers = { "x-admin-password": ADMIN_PASSWORD };

            const [licensesRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/api/admin/licenses`, { headers }),
                fetch(`${API_URL}/api/admin/stats`, { headers })
            ]);

            if (!licensesRes.ok || !statsRes.ok) {
                const errorData = !licensesRes.ok ? await licensesRes.json() : await statsRes.json();
                toast({
                    title: "Erreur Serveur",
                    description: errorData.details || errorData.error || "Erreur de connexion à la base de données.",
                    variant: "destructive"
                });
                setIsLoading(false);
                return;
            }

            const [licensesData, statsData] = await Promise.all([
                licensesRes.json(),
                statsRes.json()
            ]);

            setLicenses(licensesData);
            setStats(statsData);
        } catch (error) {
            console.error('Load data error:', error);
            toast({
                title: "Erreur",
                description: "Impossible de contacter le serveur.",
                variant: "destructive"
            });
        }
        setIsLoading(false);
    };

    const generateLicense = async () => {
        if (!newEmail || !newType) {
            toast({
                title: "Erreur",
                description: "Email et type sont requis.",
                variant: "destructive"
            });
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/admin/licenses`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-password": ADMIN_PASSWORD
                },
                body: JSON.stringify({
                    email: newEmail,
                    type: newType,
                    notes: newNotes
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: "✅ Licence générée",
                    description: `Clé créée pour ${newEmail}`
                });
                setNewEmail("");
                setNewNotes("");
                loadAllData();
            } else {
                toast({
                    title: "Erreur",
                    description: data.details || data.error || "Impossible de générer la licence.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Generate license error:', error);
            toast({
                title: "Erreur",
                description: "Erreur serveur.",
                variant: "destructive"
            });
        }
    };

    const suspendLicense = async (id: string) => {
        try {
            const response = await fetch(`${API_URL}/api/admin/licenses/${id}/suspend`, {
                method: "PUT",
                headers: { "x-admin-password": ADMIN_PASSWORD }
            });

            if (response.ok) {
                toast({ title: "✅ Licence suspendue" });
                loadAllData();
            }
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        }
    };

    const activateLicense = async (id: string) => {
        try {
            const response = await fetch(`${API_URL}/api/admin/licenses/${id}/activate`, {
                method: "PUT",
                headers: { "x-admin-password": ADMIN_PASSWORD }
            });

            const data = await response.json();

            if (response.ok) {
                toast({ title: "✅ Licence activée" });
                loadAllData();
            } else {
                toast({
                    title: "Erreur",
                    description: data.error,
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        }
    };

    const revokeLicense = async (id: string) => {
        try {
            const response = await fetch(`${API_URL}/api/admin/licenses/${id}/revoke`, {
                method: "PUT",
                headers: { "x-admin-password": ADMIN_PASSWORD }
            });

            if (response.ok) {
                toast({ title: "✅ Licence révoquée" });
                loadAllData();
            }
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        }
    };

    const deleteLicense = async (id: string) => {
        try {
            const response = await fetch(`${API_URL}/api/admin/licenses/${id}`, {
                method: "DELETE",
                headers: { "x-admin-password": ADMIN_PASSWORD }
            });

            if (response.ok) {
                toast({ title: "✅ Licence supprimée" });
                loadAllData();
            }
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        }
    };

    const exportCSV = () => {
        const encodedPassword = encodeURIComponent(ADMIN_PASSWORD);
        window.open(`${API_URL}/api/admin/export/csv?password=${encodedPassword}`, '_blank');
        toast({ title: "📥 Export en cours...", description: "Le fichier CSV va se télécharger." });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "📋 Copié!", description: text.substring(0, 50) + "..." });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <Badge className="bg-green-500">🟢 Active</Badge>;
            case "suspended":
                return <Badge className="bg-yellow-500">🟡 Suspendue</Badge>;
            case "revoked":
                return <Badge className="bg-red-500">🔴 Révoquée</Badge>;
            case "expired":
                return <Badge className="bg-gray-500">⚫ Expirée</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const getTypeBadge = (type: string) => {
        const badges = {
            trial: <Badge variant="outline" className="border-blue-500 text-blue-500">🔵 Trial</Badge>,
            monthly: <Badge variant="outline">📅 Mensuel</Badge>,
            '6months': <Badge variant="outline" className="border-purple-500 text-purple-500">📆 6 Mois</Badge>,
            yearly: <Badge variant="outline" className="border-green-500 text-green-500">📊 Annuel</Badge>,
            lifetime: <Badge variant="outline" className="border-yellow-500 text-yellow-500">👑 Lifetime</Badge>
        };
        return badges[type as keyof typeof badges] || <Badge>{type}</Badge>;
    };

    // Filter licenses
    const filteredLicenses = licenses.filter(license => {
        const matchesSearch = searchQuery === "" ||
            license.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            license.key.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType = filterType === "all" || license.type === filterType;
        const matchesStatus = filterStatus === "all" || license.status === filterStatus;

        return matchesSearch && matchesType && matchesStatus;
    });

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle>Administration</CardTitle>
                        <CardDescription>Accès réservé à l'administrateur</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!isAuthenticated ? (
                            <>
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Connexion requise</AlertTitle>
                                    <AlertDescription>
                                        Veuillez vous connecter avec le compte administrateur (fictionsell@gmail.com)
                                    </AlertDescription>
                                </Alert>
                                <Button className="w-full" onClick={login}>
                                    Se connecter avec Google
                                </Button>
                            </>
                        ) : (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Accès refusé</AlertTitle>
                                <AlertDescription>
                                    Vous n'êtes pas autorisé à accéder à cette page.
                                    <br />
                                    Compte actuel: {userEmail}
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">🔐 Administration</h1>
                    <p className="text-muted-foreground">Gestion complète des licences</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" onClick={() => loadAllData()} disabled={isLoading} className="flex-1 md:flex-none">
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        Actualiser
                    </Button>
                    <Button variant="default" onClick={exportCSV} disabled={isLoading} className="flex-1 md:flex-none">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="dashboard" className="space-y-4">
                <TabsList className="w-full justify-start overflow-x-auto">
                    <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
                    <TabsTrigger value="licenses">🔑 Licences</TabsTrigger>
                    <TabsTrigger value="generate">➕ Générer</TabsTrigger>
                </TabsList>

                {/* Dashboard Tab */}
                <TabsContent value="dashboard" className="space-y-4">
                    {stats && (
                        <>
                            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                                        <CardTitle className="text-sm font-medium">Total Licences</CardTitle>
                                        <Key className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <div className="text-2xl font-bold">{stats.totalLicenses}</div>
                                        <p className="text-xs text-muted-foreground">
                                            {stats.activeLicenses} actives
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                                        <CardTitle className="text-sm font-medium">Suspendues</CardTitle>
                                        <Pause className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <div className="text-2xl font-bold text-yellow-500">{stats.suspendedLicenses}</div>
                                        <p className="text-xs text-muted-foreground">En pause</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                                        <CardTitle className="text-sm font-medium">Révoquées</CardTitle>
                                        <Ban className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <div className="text-2xl font-bold text-red-500">{stats.revokedLicenses}</div>
                                        <p className="text-xs text-muted-foreground">Désactivées</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                                        <CardTitle className="text-sm font-medium">Trials Utilisés</CardTitle>
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <div className="text-2xl font-bold text-blue-500">{stats.totalTrials}</div>
                                        <p className="text-xs text-muted-foreground">30 jours chacun</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <PieChartIcon className="h-5 w-5" />
                                            Répartition par Type
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Trial', value: stats.byType?.trial || 0 },
                                                        { name: 'Mensuel', value: stats.byType?.monthly || 0 },
                                                        { name: '6 Mois', value: stats.byType?.sixMonths || 0 },
                                                        { name: 'Annuel', value: stats.byType?.yearly || 0 },
                                                        { name: 'Lifetime', value: stats.byType?.lifetime || 0 },
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    <Cell fill="#3b82f6" />
                                                    <Cell fill="#6366f1" />
                                                    <Cell fill="#a855f7" />
                                                    <Cell fill="#22c55e" />
                                                    <Cell fill="#eab308" />
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <BarChart3 className="h-5 w-5" />
                                            Statut des Licences
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={[
                                                    { name: 'Actives', value: stats.activeLicenses },
                                                    { name: 'Suspendues', value: stats.suspendedLicenses },
                                                    { name: 'Révoquées', value: stats.revokedLicenses },
                                                    { name: 'Expirées', value: stats.expiredLicenses },
                                                ]}
                                            >
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip />
                                                <Bar dataKey="value">
                                                    <Cell fill="#22c55e" />
                                                    <Cell fill="#eab308" />
                                                    <Cell fill="#ef4444" />
                                                    <Cell fill="#6b7280" />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    )}
                </TabsContent>

                {/* Licenses Tab */}
                <TabsContent value="licenses" className="space-y-4">
                    {/* Search and Filters */}
                    <Card>
                        <CardHeader>
                            <CardTitle>🔍 Recherche et Filtres</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Recherche</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Email ou clé..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={filterType} onValueChange={setFilterType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tous</SelectItem>
                                            <SelectItem value="trial">Trial</SelectItem>
                                            <SelectItem value="monthly">Mensuel</SelectItem>
                                            <SelectItem value="6months">6 Mois</SelectItem>
                                            <SelectItem value="yearly">Annuel</SelectItem>
                                            <SelectItem value="lifetime">Lifetime</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Statut</Label>
                                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tous</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="suspended">Suspendue</SelectItem>
                                            <SelectItem value="revoked">Révoquée</SelectItem>
                                            <SelectItem value="expired">Expirée</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Licenses Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>📋 Liste des Licences ({filteredLicenses.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 md:p-6">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Statut</TableHead>
                                            <TableHead>Jours Restants</TableHead>
                                            <TableHead>Date Fin</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredLicenses.map((license) => (
                                            <TableRow key={license.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{license.email}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => copyToClipboard(license.key)}
                                                        >
                                                            <Copy className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    {license.notes && (
                                                        <p className="text-xs text-muted-foreground">{license.notes}</p>
                                                    )}
                                                </TableCell>
                                                <TableCell>{getTypeBadge(license.type)}</TableCell>
                                                <TableCell>{getStatusBadge(license.status)}</TableCell>
                                                <TableCell>
                                                    {license.daysRemaining === -1 ? (
                                                        <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                                                            ∞ Illimité
                                                        </Badge>
                                                    ) : (
                                                        <span className={license.daysRemaining < 7 ? "text-red-500 font-bold" : ""}>
                                                            {license.daysRemaining} jours
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {license.endDate ? new Date(license.endDate).toLocaleDateString() : "Aucune"}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        {license.status === "active" && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => suspendLicense(license.id)}
                                                            >
                                                                <Pause className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                        {license.status === "suspended" && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => activateLicense(license.id)}
                                                            >
                                                                <Play className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                        {license.status !== "revoked" && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="outline" size="sm">
                                                                        <Ban className="h-3 w-3" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Révoquer la licence?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Cette action désactivera définitivement la licence.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => revokeLicense(license.id)}>
                                                                            Révoquer
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="destructive" size="sm">
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Supprimer?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Cette action est irréversible.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => deleteLicense(license.id)}>
                                                                        Supprimer
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredLicenses.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                    Aucune licence trouvée
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Generate Tab */}
                <TabsContent value="generate" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>➕ Générer une Nouvelle Licence</CardTitle>
                            <CardDescription>
                                Créer une licence pour un email spécifique.
                                ⚠️ Trial : 1 seul par email (30 jours)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Email *</Label>
                                    <Input
                                        type="email"
                                        placeholder="utilisateur@example.com"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type de Licence *</Label>
                                    <Select value={newType} onValueChange={setNewType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="trial">🔵 Trial (30 jours)</SelectItem>
                                            <SelectItem value="monthly">📅 Mensuel (30 jours)</SelectItem>
                                            <SelectItem value="6months">📆 6 Mois (180 jours)</SelectItem>
                                            <SelectItem value="yearly">📊 Annuel (365 jours)</SelectItem>
                                            <SelectItem value="lifetime">👑 Lifetime (Illimité)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Notes (optionnel)</Label>
                                    <Input
                                        placeholder="Ex: Promo, Bonus, VIP..."
                                        value={newNotes}
                                        onChange={(e) => setNewNotes(e.target.value)}
                                    />
                                </div>
                                <Button onClick={generateLicense} className="w-full" disabled={isLoading}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Générer la Licence
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Admin;
