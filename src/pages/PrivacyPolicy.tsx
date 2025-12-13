import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-3xl mx-auto bg-card rounded-lg shadow-lg p-6 md:p-10 border">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="mb-6 pl-0 hover:pl-2 transition-all"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>

                <h1 className="text-3xl font-bold mb-6 text-primary">Politique de Confidentialité</h1>
                <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : 13 Décembre 2025</p>

                <div className="space-y-6 text-foreground/90">
                    <section>
                        <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
                        <p>
                            Bienvenue sur Sniper Build Flow ("nous", "notre", "nos"). Nous nous engageons à protéger votre vie privée et vos données personnelles.
                            Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations lorsque vous utilisez notre application.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">2. Données collectées</h2>
                        <p className="mb-2">Nous collectons les informations suivantes lorsque vous utilisez notre service :</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Informations de compte Google :</strong> Nom, adresse e-mail et photo de profil (via Google OAuth).</li>
                            <li><strong>Données d'utilisation :</strong> Informations sur la façon dont vous utilisez l'application (projets créés, réserves, etc.).</li>
                            <li><strong>Fichiers :</strong> Photos et documents que vous choisissez de télécharger sur Google Drive via notre application.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">3. Utilisation des données</h2>
                        <p className="mb-2">Nous utilisons vos données pour :</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Vous authentifier et gérer votre compte.</li>
                            <li>Stocker et organiser vos photos de chantier sur votre propre Google Drive.</li>
                            <li>Améliorer et personnaliser votre expérience utilisateur.</li>
                            <li>Communiquer avec vous concernant les mises à jour ou le support.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">4. Accès Google Drive</h2>
                        <p>
                            Notre application demande l'accès à votre Google Drive pour créer et gérer des dossiers spécifiques à vos projets ("Sniper Documents").
                            Nous n'accédons pas aux autres fichiers de votre Drive qui ne sont pas liés à l'application.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">5. Partage des données</h2>
                        <p>
                            Nous ne vendons ni ne louons vos données personnelles à des tiers. Vos données peuvent être partagées uniquement si la loi l'exige ou pour protéger nos droits.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">6. Sécurité</h2>
                        <p>
                            Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données contre tout accès non autorisé, modification ou destruction.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">7. Vos droits</h2>
                        <p>
                            Vous avez le droit d'accéder, de corriger ou de supprimer vos données personnelles. Vous pouvez également révoquer l'accès à votre compte Google à tout moment via les paramètres de sécurité de Google.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">8. Contact</h2>
                        <p>
                            Pour toute question concernant cette politique de confidentialité, veuillez nous contacter à : <a href="mailto:support@thesniper.onrender.com" className="text-primary hover:underline">support@thesniper.onrender.com</a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
