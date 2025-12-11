import { Category } from '@/types';
import { generateId } from '@/hooks/useLocalStorage';

/**
 * Returns a comprehensive list of default categories for construction projects.
 * These categories cover all major trades and specialties in construction.
 */
export const getDefaultCategories = (): Category[] => {
    const now = new Date().toISOString();

    return [
        // GROS ŒUVRE
        {
            id: generateId(),
            name: "Terrassement",
            description: "Travaux de terrassement, excavation et préparation du terrain",
            color: "#78350F",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Fondations",
            description: "Fondations superficielles et profondes, semelles, radiers",
            color: "#451A03",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Maçonnerie",
            description: "Murs porteurs, cloisons maçonnées, parpaings, briques",
            color: "#6B7280",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Béton armé",
            description: "Structures en béton armé, poteaux, poutres, dalles",
            color: "#374151",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Charpente",
            description: "Charpente bois, métallique ou béton",
            color: "#92400E",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Couverture",
            description: "Toiture, tuiles, ardoises, bac acier, étanchéité toiture",
            color: "#B45309",
            createdAt: now
        },

        // SECOND ŒUVRE
        {
            id: generateId(),
            name: "Plomberie",
            description: "Installation et maintenance des réseaux d'eau et évacuation",
            color: "#3B82F6",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Électricité",
            description: "Installation électrique, tableaux, câblage, prises, éclairage",
            color: "#F59E0B",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Chauffage",
            description: "Systèmes de chauffage, chaudières, radiateurs, plancher chauffant",
            color: "#EF4444",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Climatisation / VMC",
            description: "Climatisation, ventilation mécanique contrôlée, extraction",
            color: "#06B6D4",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Menuiserie extérieure",
            description: "Portes d'entrée, fenêtres, baies vitrées, volets, stores",
            color: "#A16207",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Menuiserie intérieure",
            description: "Portes intérieures, placards, dressings, escaliers",
            color: "#CA8A04",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Serrurerie / Métallerie",
            description: "Garde-corps, rampes, grilles, portails métalliques",
            color: "#57534E",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Cloisons / Doublages",
            description: "Cloisons sèches, placo, doublages, faux-plafonds",
            color: "#D6D3D1",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Isolation",
            description: "Isolation thermique et phonique, murs, combles, sols",
            color: "#84CC16",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Étanchéité",
            description: "Étanchéité terrasses, sous-sols, façades",
            color: "#0EA5E9",
            createdAt: now
        },

        // FINITIONS
        {
            id: generateId(),
            name: "Peinture",
            description: "Travaux de peinture intérieure et extérieure, finitions",
            color: "#10B981",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Carrelage",
            description: "Pose de carrelage sols et murs, faïence",
            color: "#F97316",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Revêtements de sol",
            description: "Parquet, stratifié, moquette, vinyle, résine",
            color: "#8B5CF6",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Revêtements muraux",
            description: "Papier peint, enduits décoratifs, lambris",
            color: "#EC4899",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Façades",
            description: "Ravalement, enduits extérieurs, bardage, ITE",
            color: "#F472B6",
            createdAt: now
        },

        // ÉQUIPEMENTS
        {
            id: generateId(),
            name: "Sanitaires",
            description: "WC, lavabos, douches, baignoires, robinetterie",
            color: "#14B8A6",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Cuisine",
            description: "Meubles de cuisine, plans de travail, électroménager",
            color: "#A855F7",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Ascenseur",
            description: "Installation et maintenance ascenseurs, monte-charges",
            color: "#6366F1",
            createdAt: now
        },

        // EXTÉRIEURS
        {
            id: generateId(),
            name: "VRD",
            description: "Voiries et réseaux divers, assainissement, raccordements",
            color: "#65A30D",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Espaces verts",
            description: "Aménagement paysager, plantations, engazonnement",
            color: "#22C55E",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Clôtures",
            description: "Clôtures, portails, contrôle d'accès extérieur",
            color: "#4ADE80",
            createdAt: now
        },

        // SÉCURITÉ
        {
            id: generateId(),
            name: "Sécurité incendie",
            description: "Désenfumage, extincteurs, détection incendie, sprinklers",
            color: "#DC2626",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Alarme / Vidéosurveillance",
            description: "Systèmes d'alarme, caméras, contrôle d'accès",
            color: "#7C3AED",
            createdAt: now
        },

        // RÉSEAUX
        {
            id: generateId(),
            name: "Courants faibles",
            description: "Téléphonie, informatique, fibre optique, interphonie",
            color: "#0284C7",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Domotique",
            description: "Automatisation, contrôle intelligent, maison connectée",
            color: "#7C3AED",
            createdAt: now
        },

        // DIVERS
        {
            id: generateId(),
            name: "Nettoyage",
            description: "Nettoyage de chantier, remise en état",
            color: "#38BDF8",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Signalétique",
            description: "Signalétique intérieure et extérieure, numérotation",
            color: "#FBBF24",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Accessibilité PMR",
            description: "Aménagements pour personnes à mobilité réduite",
            color: "#2DD4BF",
            createdAt: now
        },
        {
            id: generateId(),
            name: "Divers / Autres",
            description: "Travaux divers non classés ailleurs",
            color: "#9CA3AF",
            createdAt: now
        }
    ];
};
