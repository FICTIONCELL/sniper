import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/contexts/TranslationContext";
import { useProjects, useBlocks, useContractors, generateId } from "@/hooks/useLocalStorage";
import { Project, Block, Contractor } from "@/types";
import { Plus, Trash2, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProjectWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ProjectWizard({ open, onOpenChange }: ProjectWizardProps) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [projects, setProjects] = useProjects();
    const [blocks, setBlocks] = useBlocks();
    const [contractors, setContractors] = useContractors();

    // Step 1: Project Data
    const [projectData, setProjectData] = useState<Partial<Project>>({
        name: "",
        description: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        status: "en_attente"
    });

    // Step 2: Blocks Data
    const [blocksData, setBlocksData] = useState<{ name: string; description: string }[]>([
        { name: "Bloc A", description: "" }
    ]);

    // Step 3: Contractors Data
    const [contractorsData, setContractorsData] = useState<{ name: string; email: string; specialty: string }[]>([
        { name: "", email: "", specialty: "" }
    ]);

    const handleNext = () => {
        if (step === 1) {
            if (!projectData.name) {
                toast({ title: t('error'), description: t('projectNameRequired'), variant: "destructive" });
                return;
            }
        }
        setStep(step + 1);
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    const addBlock = () => {
        setBlocksData([...blocksData, { name: `${t('block')} ${String.fromCharCode(65 + blocksData.length)}`, description: "" }]);
    };

    const removeBlock = (index: number) => {
        setBlocksData(blocksData.filter((_, i) => i !== index));
    };

    const addContractor = () => {
        setContractorsData([...contractorsData, { name: "", email: "", specialty: "" }]);
    };

    const removeContractor = (index: number) => {
        setContractorsData(contractorsData.filter((_, i) => i !== index));
    };

    const handleFinish = () => {
        // 1. Create Project
        const projectId = generateId();
        const newProject: Project = {
            ...projectData as Project,
            id: projectId,
            createdAt: new Date().toISOString(),
        };

        // 2. Create Blocks
        const newBlocks: Block[] = blocksData.map(b => ({
            id: generateId(),
            projectId: projectId,
            name: b.name,
            description: b.description,
            createdAt: new Date().toISOString(),
        }));

        // 3. Create Contractors (Optional - usually contractors are global, but we can add them here)
        // Filter out empty entries
        const validContractors = contractorsData.filter(c => c.name.trim() !== "");
        const newContractors: Contractor[] = validContractors.map(c => ({
            id: generateId(),
            name: c.name,
            email: c.email,
            specialty: c.specialty,
            phone: "",
            categoryId: "", // Default or empty
            categoryIds: [],
            projectId: projectId, // Assign to this project
            contractStart: projectData.startDate || "",
            contractEnd: projectData.endDate || "",
            status: "actif",
            createdAt: new Date().toISOString(),
        }));

        // Save all
        setProjects([...projects, newProject]);
        setBlocks([...blocks, ...newBlocks]);
        setContractors([...contractors, ...newContractors]);

        toast({
            title: t('notificationTypeSuccess'),
            description: t('projectCreatedSuccess'),
        });

        onOpenChange(false);
        // Reset form
        setStep(1);
        setProjectData({ name: "", description: "", startDate: new Date().toISOString().split('T')[0], endDate: "", status: "en_attente" });
        setBlocksData([{ name: "Bloc A", description: "" }]);
        setContractorsData([{ name: "", email: "", specialty: "" }]);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{t('wizardTitle')} - {t('step')} {step}/3</DialogTitle>
                    <DialogDescription>
                        {step === 1 && t('step1Description')}
                        {step === 2 && t('step2Description')}
                        {step === 3 && t('step3Description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {/* Step 1: Project Info */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">{t('projectName')}</Label>
                                <Input
                                    id="name"
                                    value={projectData.name}
                                    onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                                    placeholder="Ex: Résidence Les Fleurs"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">{t('description')}</Label>
                                <Textarea
                                    id="description"
                                    value={projectData.description}
                                    onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                                    placeholder={t('projectDescription')}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="startDate">{t('startDate')}</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={projectData.startDate}
                                        onChange={(e) => setProjectData({ ...projectData, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="endDate">{t('endDate')}</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={projectData.endDate}
                                        onChange={(e) => setProjectData({ ...projectData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Blocks */}
                    {step === 2 && (
                        <div className="space-y-4">
                            {blocksData.map((block, index) => (
                                <div key={index} className="flex gap-4 items-start p-4 border rounded-lg bg-muted/20">
                                    <div className="flex-1 space-y-2">
                                        <Label>{t('blockName')}</Label>
                                        <Input
                                            value={block.name}
                                            onChange={(e) => {
                                                const newData = [...blocksData];
                                                newData[index].name = e.target.value;
                                                setBlocksData(newData);
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <Label>{t('blockDescription')}</Label>
                                        <Input
                                            value={block.description}
                                            onChange={(e) => {
                                                const newData = [...blocksData];
                                                newData[index].description = e.target.value;
                                                setBlocksData(newData);
                                            }}
                                        />
                                    </div>
                                    <Button variant="ghost" size="icon" className="mt-8 text-destructive" onClick={() => removeBlock(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button onClick={addBlock} variant="outline" className="w-full border-dashed">
                                <Plus className="mr-2 h-4 w-4" /> {t('addBlock')}
                            </Button>
                        </div>
                    )}

                    {/* Step 3: Contractors */}
                    {step === 3 && (
                        <div className="space-y-4">
                            {contractorsData.map((contractor, index) => (
                                <div key={index} className="flex gap-4 items-start p-4 border rounded-lg bg-muted/20">
                                    <div className="flex-1 space-y-2">
                                        <Label>{t('companyName')}</Label>
                                        <Input
                                            value={contractor.name}
                                            onChange={(e) => {
                                                const newData = [...contractorsData];
                                                newData[index].name = e.target.value;
                                                setContractorsData(newData);
                                            }}
                                            placeholder="Ex: Elec SARL"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <Label>{t('specialty')}</Label>
                                        <Input
                                            value={contractor.specialty}
                                            onChange={(e) => {
                                                const newData = [...contractorsData];
                                                newData[index].specialty = e.target.value;
                                                setContractorsData(newData);
                                            }}
                                            placeholder="Ex: Électricité"
                                        />
                                    </div>
                                    <Button variant="ghost" size="icon" className="mt-8 text-destructive" onClick={() => removeContractor(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button onClick={addContractor} variant="outline" className="w-full border-dashed">
                                <Plus className="mr-2 h-4 w-4" /> {t('addContractor')}
                            </Button>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between sm:justify-between">
                    <Button variant="outline" onClick={step === 1 ? () => onOpenChange(false) : handleBack}>
                        {step === 1 ? t('cancel') : <><ArrowLeft className="mr-2 h-4 w-4" /> {t('previous') || "Précédent"}</>}
                    </Button>

                    {step < 3 ? (
                        <Button onClick={handleNext}>
                            {t('next') || "Suivant"} <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="mr-2 h-4 w-4" /> {t('finishAndCreate')}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
