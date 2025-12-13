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
import { Key, Users, Shield, BarChart3, Plus, Trash2, Ban, Copy, Eye, EyeOff, RefreshCw, Download, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Capacitor } from "@capacitor/core";

const API_URL = import.meta.env.VITE_API_URL || "https://sniper-rptn.onrender.com";

interface License {
    id: string;
    key: string;
    plan: string;
    status: string;
    created_at: string;
    activated_at?: string;
    expires_at?: string;
    machine_id?: string;
    email?: string;
    notes?: string;
}

interface Trial {
    id: string;
    machine_id: string;
    email: string;
    device_name: string;
    started_at: string;
    expired_at: string;
}

interface Subscription {
    id: string;
    license_id?: string;
    license_key?: string;
    machine_id: string;
    email: string;
    plan: string;
    status: string;
    started_at: string;
    expires_at?: string;
}

interface Stats {
    totalLicenses: number;
    activeLicenses: number;
    usedLicenses: number;
    revokedLicenses: number;
    totalTrials: number;
    activeSubscriptions: number;
}

const Admin = () => {
    const { toast } = useToast();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [adminPassword, setAdminPassword] = useState("");

    const [licenses, setLicenses] = useState<License[]>([]);
    const [trials, setTrials] = useState<Trial[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);

    const [newLicensePlan, setNewLicensePlan] = useState<string>("yearly");
    const [newLicenseNotes, setNewLicenseNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);

    const handleLogin = async () => {
        setLoginError(null);
        setIsLoading(true);
        try {
            console.log("Attempting login to:", `${API_URL}/api/admin/stats`);
            const response = await fetch(`${API_URL}/api/admin/stats`, {
                headers: { "x-admin-password": password }
            });

            if (response.ok) {
                setAdminPassword(password);
                setIsAuthenticated(true);
                loadAllData(password);
                toast({ title: "Connexion réussie", description: "Bienvenue dans le panneau d'administration." });
            } else {
                if (response.status === 401 || response.status === 403) {
                    setLoginError("Mot de passe incorrect.");
                } else if (response.status === 500) {
                    setLoginError("Erreur serveur (500). Le mot de passe est peut-être incorrect ou le serveur rencontre un problème.");
                } else {
                    setLoginError(`Erreur serveur: ${response.status}`);
                }
                toast({ title: "Erreur", description: "Échec de la connexion.", variant: "destructive" });
            }
        } catch (error) {
            console.error("Login error:", error);
            let errorMessage = "Impossible de se connecter au serveur. Vérifiez votre connexion internet.";

            // Only show localhost error if API_URL actually contains localhost or 127.0.0.1
            if (Capacitor.isNativePlatform()) {
                if (API_URL.includes("localhost") || API_URL.includes("127.0.0.1")) {
                    errorMessage = "Erreur configuration: 'localhost' détecté sur Android. L'application mobile doit utiliser une URL publique (ex: https://sniper-rptn.onrender.com). Contactez le support.";
                } else {
                    // On mobile with correct URL, provide more helpful error message
                    errorMessage = `Impossible de se connecter au serveur (${API_URL}). Vérifiez que le serveur est en ligne et que vous avez une connexion internet.`;
                }
            }

            setLoginError(errorMessage);
            toast({ title: "Erreur de connexion", description: errorMessage, variant: "destructive" });
        }
        setIsLoading(false);
    };

    const loadAllData = async (pwd: string) => {
        setIsLoading(true);
        try {
            const headers = { "x-admin-password": pwd };

            const [licensesRes, trialsRes, subsRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/api/admin/licenses`, { headers }),
                fetch(`${API_URL}/api/admin/trials`, { headers }),
                fetch(`${API_URL}/api/admin/subscriptions`, { headers }),
                fetch(`${API_URL}/api/admin/stats`, { headers })
            ]);

            if (licensesRes.ok) setLicenses(await licensesRes.json());
            if (trialsRes.ok) setTrials(await trialsRes.json());
            if (subsRes.ok) setSubscriptions(await subsRes.json());
            if (statsRes.ok) setStats(await statsRes.json());
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible de charger les données.", variant: "destructive" });
        }
        setIsLoading(false);
    };

    const generateLicense = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/licenses`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-password": adminPassword
                },
                body: JSON.stringify({ plan: newLicensePlan, notes: newLicenseNotes })
            });

            if (response.ok) {
                const data = await response.json();
                toast({
                    title: "Licence générée",
                    description: `Clé: ${data.license.key}`
                });
                setNewLicenseNotes("");
                loadAllData(adminPassword);
            } else {
                toast({ title: "Erreur", description: "Impossible de générer la licence.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Erreur", description: "Erreur serveur.", variant: "destructive" });
        }
    };

    const revokeLicense = async (id: string) => {
        try {
            const response = await fetch(`${API_URL}/api/admin/licenses/${id}/revoke`, {
                method: "PUT",
                headers: { "x-admin-password": adminPassword }
            });

            if (response.ok) {
                toast({ title: "Licence révoquée" });
                loadAllData(adminPassword);
            }
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        }
    };

    const deleteLicense = async (id: string) => {
        try {
            const response = await fetch(`${API_URL}/api/admin/licenses/${id}`, {
                method: "DELETE",
                headers: { "x-admin-password": adminPassword }
            });

            if (response.ok) {
                toast({ title: "Licence supprimée" });
                loadAllData(adminPassword);
            }
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copié!", description: text });
    };

    const handleDownloadReport = () => {
        if (subscriptions.length === 0) {
            toast({ title: "Aucune donnée", description: "Il n'y a aucun abonnement à exporter." });
            return;
        }

        // Prepare CSV data
        const headers = ["Email", "Plan", "Statut", "Clé Licence", "Date Début", "Date Expiration", "Jours Restants"];
        const rows = subscriptions.map(sub => {
            const now = new Date();
            const expires = sub.expires_at ? new Date(sub.expires_at) : null;
            const daysRemaining = expires ? Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : "N/A";

            return [
                sub.email,
                sub.plan,
                sub.status,
                sub.license_key || "N/A",
                new Date(sub.started_at).toLocaleDateString(),
                expires ? expires.toLocaleDateString() : "N/A",
                daysRemaining
            ];
        });

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        // Create and download file
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `rapport_abonnements_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({ title: "Rapport téléchargé", description: "Le fichier CSV a été généré avec succès." });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <Badge className="bg-green-500">Actif</Badge>;
            case "used":
                return <Badge className="bg-blue-500">Utilisé</Badge>;
            case "revoked":
                return <Badge className="bg-red-500">Révoqué</Badge>;
            case "expired":
                return <Badge className="bg-gray-500">Expiré</Badge>;
            case "cancelled":
                return <Badge className="bg-orange-500">Annulé</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const getPlanBadge = (plan: string) => {
        switch (plan) {
            case "monthly":
                return <Badge variant="outline">Mensuel</Badge>;
            case "yearly":
                return <Badge variant="outline" className="border-blue-500 text-blue-500">Annuel</Badge>;
            case "lifetime":
                return <Badge variant="outline" className="border-purple-500 text-purple-500">À vie</Badge>;
            case "trial":
                return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Essai</Badge>;
            default:
                return <Badge variant="outline">{plan}</Badge>;
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle>Administration</CardTitle>
                        <CardDescription>Entrez le mot de passe administrateur</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loginError && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Erreur</AlertTitle>
                                <AlertDescription>{loginError}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label>Mot de passe</Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                                    placeholder="Entrez le mot de passe..."
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
                            {isLoading ? "Connexion..." : "Connexion"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Administration</h1>
                    <p className="text-muted-foreground">Gérez les licences et abonnements</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" onClick={() => loadAllData(adminPassword)} disabled={isLoading} className="flex-1 md:flex-none">
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        Actualiser
                    </Button>
                    <Button variant="default" onClick={handleDownloadReport} disabled={isLoading || subscriptions.length === 0} className="flex-1 md:flex-none">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                            <CardTitle className="text-sm font-medium">Licences</CardTitle>
                            <Key className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold">{stats.totalLicenses}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.activeLicenses} dispo
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                            <CardTitle className="text-sm font-medium">Essais</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold">{stats.totalTrials}</div>
                            <p className="text-xs text-muted-foreground">Consommés</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
                            <p className="text-xs text-muted-foreground">Utilisateurs</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                            <CardTitle className="text-sm font-medium">Révoqués</CardTitle>
                            <Ban className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-red-500">{stats.revokedLicenses}</div>
                            <p className="text-xs text-muted-foreground">Bannis</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs defaultValue="licenses" className="space-y-4">
                <TabsList className="w-full justify-start overflow-x-auto">
                    <TabsTrigger value="licenses">Licences</TabsTrigger>
                    <TabsTrigger value="trials">Essais</TabsTrigger>
                    <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
                </TabsList>

                {/* Licenses Tab */}
                <TabsContent value="licenses" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Générer une nouvelle licence</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="space-y-2 w-full md:w-auto">
                                    <Label>Type de plan</Label>
                                    <Select value={newLicensePlan} onValueChange={setNewLicensePlan}>
                                        <SelectTrigger className="w-full md:w-40">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Mensuel</SelectItem>
                                            <SelectItem value="yearly">Annuel</SelectItem>
                                            <SelectItem value="lifetime">À vie</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1 space-y-2 w-full">
                                    <Label>Notes (optionnel)</Label>
                                    <Input
                                        value={newLicenseNotes}
                                        onChange={(e) => setNewLicenseNotes(e.target.value)}
                                        placeholder="Ex: Client XYZ..."
                                    />
                                </div>
                                <Button onClick={generateLicense} className="w-full md:w-auto">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Générer
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Liste des licences ({licenses.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 md:p-6">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Clé</TableHead>
                                            <TableHead>Plan</TableHead>
                                            <TableHead>Statut</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Créée le</TableHead>
                                            <TableHead>Expire le</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {licenses.map((license) => (
                                            <TableRow key={license.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-xs bg-muted px-2 py-1 rounded whitespace-nowrap">{license.key}</code>
                                                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(license.key)}>
                                                            <Copy className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getPlanBadge(license.plan)}</TableCell>
                                                <TableCell>{getStatusBadge(license.status)}</TableCell>
                                                <TableCell>{license.email || "-"}</TableCell>
                                                <TableCell className="whitespace-nowrap">{new Date(license.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
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
                                                                            Cette action désactivera la licence.
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
                                                                        Irréversible.
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
                                        {licenses.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                                    Aucune licence générée
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Trials Tab */}
                <TabsContent value="trials" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Essais utilisés ({trials.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 md:p-6">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Appareil</TableHead>
                                            <TableHead>Machine ID</TableHead>
                                            <TableHead>Début</TableHead>
                                            <TableHead>Fin</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {trials.map((trial) => (
                                            <TableRow key={trial.id}>
                                                <TableCell>{trial.email}</TableCell>
                                                <TableCell>{trial.device_name}</TableCell>
                                                <TableCell>
                                                    <code className="text-xs bg-muted px-2 py-1 rounded whitespace-nowrap">
                                                        {trial.machine_id.substring(0, 8)}...
                                                    </code>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">{new Date(trial.started_at).toLocaleDateString()}</TableCell>
                                                <TableCell className="whitespace-nowrap">{new Date(trial.expired_at).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        ))}
                                        {trials.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                    Aucun essai utilisé
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Subscriptions Tab */}
                <TabsContent value="subscriptions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Abonnements ({subscriptions.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 md:p-6">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Plan</TableHead>
                                            <TableHead>Statut</TableHead>
                                            <TableHead>Licence</TableHead>
                                            <TableHead>Début</TableHead>
                                            <TableHead>Expiration</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {subscriptions.map((sub) => (
                                            <TableRow key={sub.id}>
                                                <TableCell>{sub.email}</TableCell>
                                                <TableCell>{getPlanBadge(sub.plan)}</TableCell>
                                                <TableCell>{getStatusBadge(sub.status)}</TableCell>
                                                <TableCell>
                                                    {sub.license_key ? (
                                                        <code className="text-xs bg-muted px-2 py-1 rounded whitespace-nowrap">{sub.license_key}</code>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">{new Date(sub.started_at).toLocaleDateString()}</TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {subscriptions.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                    Aucun abonnement
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Admin;
