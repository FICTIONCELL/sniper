import { useState } from "react";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/contexts/TranslationContext";

const TestPV = () => {
  const { t } = useTranslation();
  const [pvData, setPvData] = useState({
    pvNumber: `PV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    date: new Date().toLocaleDateString(),
    id: `id-${Date.now()}`,
    title: "Test PV Generation",
    projectName: "Projet Test",
    description: "Ceci est un test de génération de PV avec QR code et export PDF multilingue."
  });

  const generateNewPV = () => {
    setPvData({
      ...pvData,
      pvNumber: `PV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      id: `id-${Date.now()}`,
      date: new Date().toLocaleDateString()
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('testPvGeneration') || 'Test Génération PV'}</h1>
        <p className="text-muted-foreground">
          {t('testPvDescription') || 'Démonstration de la génération de PV avec QR code et export PDF multilingue'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>{t('pvConfiguration') || 'Configuration du PV'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pvNumber">{t('pvNumber')}</Label>
              <Input
                id="pvNumber"
                value={pvData.pvNumber}
                onChange={(e) => setPvData({...pvData, pvNumber: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="title">{t('title')}</Label>
              <Input
                id="title"
                value={pvData.title}
                onChange={(e) => setPvData({...pvData, title: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="projectName">{t('project')}</Label>
              <Input
                id="projectName"
                value={pvData.projectName}
                onChange={(e) => setPvData({...pvData, projectName: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="description">{t('description')}</Label>
              <Textarea
                id="description"
                value={pvData.description}
                onChange={(e) => setPvData({...pvData, description: e.target.value})}
                rows={4}
              />
            </div>

            <Button onClick={generateNewPV} className="w-full">
              {t('generateNewPv') || 'Générer nouveau PV'}
            </Button>
          </CardContent>
        </Card>

        {/* QR Code Generator */}
        <QRCodeGenerator
          data={{
            pvNumber: pvData.pvNumber,
            date: pvData.date,
            id: pvData.id,
            type: 'pv',
            title: pvData.title,
            projectName: pvData.projectName,
            description: pvData.description
          }}
          projectName={pvData.projectName}
          description={pvData.description}
          size={200}
        />
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('instructions') || 'Instructions'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>• {t('modifyFields') || 'Modifiez les champs ci-dessus pour personnaliser le PV'}</p>
            <p>• {t('downloadPdfInfo') || 'Cliquez sur "Télécharger PDF" pour générer un PV complet en PDF'}</p>
            <p>• {t('qrCodeInfo') || 'Le code QR contient toutes les informations du PV'}</p>
            <p>• {t('multilingualInfo') || 'Le PDF est généré dans la langue sélectionnée dans les paramètres'}</p>
            <p>• {t('changeLanguageInfo') || 'Changez la langue dans Paramètres > Langue pour voir la traduction'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestPV;