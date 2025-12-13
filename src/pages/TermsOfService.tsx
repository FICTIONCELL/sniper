import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
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

                <h1 className="text-3xl font-bold mb-6 text-primary">Conditions d'Utilisation</h1>
                <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : 13 Décembre 2025</p>

                <div className="space-y-6 text-foreground/90">
                    <section>
                        <h2 className="text-xl font-semibold mb-3">1. Acceptation des conditions</h2>
                        <p>
                            En accédant et en utilisant l'application Sniper Build Flow, vous acceptez d'être lié par ces conditions d'utilisation.
                            Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">2. Description du service</h2>
                        <p>
                            Sniper Build Flow est une application de gestion de chantier permettant le suivi des réserves, la gestion des projets et l'organisation des documents via Google Drive.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">3. Compte utilisateur</h2>
                        <p>
                            Pour utiliser certaines fonctionnalités, vous devez vous connecter avec un compte Google. Vous êtes responsable de maintenir la confidentialité de votre compte
                            et de toutes les activités qui s'y déroulent.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">4. Utilisation appropriée</h2>
                        <p>
                            Vous acceptez d'utiliser l'application uniquement à des fins légales et conformément à ces conditions.
                            Il est interdit d'utiliser le service pour stocker ou transmettre du contenu illégal, offensant ou nuisible.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">5. Propriété intellectuelle</h2>
                        <p>
                            L'application et son contenu original (fonctionnalités, design, code) sont et resteront la propriété exclusive de Sniper Build Flow.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">6. Limitation de responsabilité</h2>
                        <p>
                            Dans toute la mesure permise par la loi, Sniper Build Flow ne sera pas responsable des dommages indirects, accessoires ou consécutifs
                            résultant de votre utilisation ou de votre incapacité à utiliser le service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">7. Modifications</h2>
                        <p>
                            Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications prendront effet dès leur publication sur cette page.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">8. Contact</h2>
                        <p>
                            Pour toute question concernant ces conditions, veuillez nous contacter à : <a href="mailto:support@thesniper.onrender.com" className="text-primary hover:underline">support@thesniper.onrender.com</a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
