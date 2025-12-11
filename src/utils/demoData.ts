export const generateDemoData = () => {
  const projects = [
    {
      id: 'proj1',
      name: 'Résidence Les Jardins',
      description: 'Complexe résidentiel de 150 appartements avec espaces verts',
      startDate: '2024-01-15',
      endDate: '2025-06-30',
      status: 'en_cours' as const,
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'proj2',
      name: 'Tour Horizon',
      description: 'Immeuble de bureaux de 25 étages au centre-ville',
      startDate: '2024-03-01',
      endDate: '2025-12-31',
      status: 'en_cours' as const,
      createdAt: '2024-03-01T09:00:00Z'
    },
    {
      id: 'proj3',
      name: 'Villa Premium',
      description: 'Villas de luxe avec piscine et jardin privatif',
      startDate: '2024-02-01',
      endDate: '2024-11-30',
      status: 'en_attente' as const,
      createdAt: '2024-02-01T11:00:00Z'
    }
  ];

  const blocks = [
    {
      id: 'block1',
      projectId: 'proj1',
      name: 'Bloc A',
      description: 'Premier bloc résidentiel - 50 appartements',
      createdAt: '2024-01-20T10:00:00Z'
    },
    {
      id: 'block2',
      projectId: 'proj1',
      name: 'Bloc B',
      description: 'Deuxième bloc résidentiel - 50 appartements',
      createdAt: '2024-01-20T10:30:00Z'
    },
    {
      id: 'block3',
      projectId: 'proj1',
      name: 'Bloc C',
      description: 'Troisième bloc résidentiel - 50 appartements',
      createdAt: '2024-01-20T11:00:00Z'
    },
    {
      id: 'block4',
      projectId: 'proj2',
      name: 'Tour Est',
      description: 'Partie est de la tour - étages 1-12',
      createdAt: '2024-03-05T09:00:00Z'
    },
    {
      id: 'block5',
      projectId: 'proj2',
      name: 'Tour Ouest',
      description: 'Partie ouest de la tour - étages 13-25',
      createdAt: '2024-03-05T09:30:00Z'
    }
  ];

  const apartments = [
    {
      id: 'apt1',
      blockId: 'block1',
      projectId: 'proj1',
      number: 'A101',
      type: 'appartement' as const,
      surface: 85,
      status: 'libre' as const,
      createdAt: '2024-01-25T10:00:00Z'
    },
    {
      id: 'apt2',
      blockId: 'block1',
      projectId: 'proj1',
      number: 'A102',
      type: 'appartement' as const,
      surface: 95,
      status: 'reserve' as const,
      createdAt: '2024-01-25T10:15:00Z'
    },
    {
      id: 'apt3',
      blockId: 'block2',
      projectId: 'proj1',
      number: 'B201',
      type: 'duplex' as const,
      surface: 120,
      status: 'vendu' as const,
      createdAt: '2024-01-25T10:30:00Z'
    },
    {
      id: 'apt4',
      blockId: 'block3',
      projectId: 'proj1',
      number: 'C301',
      type: 'studio' as const,
      surface: 45,
      status: 'libre' as const,
      createdAt: '2024-01-25T10:45:00Z'
    }
  ];

  const categories = [
    {
      id: 'cat1',
      name: 'Plomberie',
      description: 'Installation et maintenance des systèmes de plomberie',
      color: '#3B82F6',
      createdAt: '2024-01-10T08:00:00Z'
    },
    {
      id: 'cat2',
      name: 'Électricité',
      description: 'Installation électrique et éclairage',
      color: '#F59E0B',
      createdAt: '2024-01-10T08:15:00Z'
    },
    {
      id: 'cat3',
      name: 'Peinture',
      description: 'Travaux de peinture et finitions',
      color: '#10B981',
      createdAt: '2024-01-10T08:30:00Z'
    },
    {
      id: 'cat4',
      name: 'Carrelage',
      description: 'Pose de carrelage et revêtements sols',
      color: '#8B5CF6',
      createdAt: '2024-01-10T08:45:00Z'
    },
    {
      id: 'cat5',
      name: 'Menuiserie',
      description: 'Installation portes, fenêtres et mobilier',
      color: '#EF4444',
      createdAt: '2024-01-10T09:00:00Z'
    }
  ];

  const contractors = [
    {
      id: 'cont1',
      name: 'Ahmed Plomberie SARL',
      email: 'contact@ahmed-plomberie.ma',
      phone: '+212 6 12 34 56 78',
      specialty: 'Plomberie générale',
      categoryId: 'cat1',
      categoryIds: ['cat1'],
      projectId: 'proj1',
      contractStart: '2024-01-01',
      contractEnd: '2024-12-31',
      status: 'actif' as const,
      createdAt: '2024-01-05T09:00:00Z'
    },
    {
      id: 'cont2',
      name: 'ElectroTech Solutions',
      email: 'info@electrotech.ma',
      phone: '+212 6 98 76 54 32',
      specialty: 'Installation électrique industrielle',
      categoryId: 'cat2',
      categoryIds: ['cat2'],
      projectId: 'proj1',
      contractStart: '2024-02-01',
      contractEnd: '2025-01-31',
      status: 'actif' as const,
      createdAt: '2024-01-05T09:15:00Z'
    },
    {
      id: 'cont3',
      name: 'Peinture Atlas',
      email: 'atlas.peinture@gmail.com',
      phone: '+212 6 55 44 33 22',
      specialty: 'Peinture décorative',
      categoryId: 'cat3',
      categoryIds: ['cat3'],
      projectId: 'proj1',
      contractStart: '2023-12-01',
      contractEnd: '2024-11-30',
      status: 'actif' as const,
      createdAt: '2024-01-05T09:30:00Z'
    },
    {
      id: 'cont4',
      name: 'Carrelage Expert',
      email: 'expert@carrelage.ma',
      phone: '+212 6 77 88 99 00',
      specialty: 'Carrelage haut de gamme',
      categoryId: 'cat4',
      categoryIds: ['cat4'],
      projectId: 'proj1',
      contractStart: '2024-01-15',
      contractEnd: '2024-12-15',
      status: 'actif' as const,
      createdAt: '2024-01-05T09:45:00Z'
    },
    {
      id: 'cont5',
      name: 'Menuiserie Moderne',
      email: 'contact@menuiserie-moderne.ma',
      phone: '+212 6 11 22 33 44',
      specialty: 'Menuiserie sur mesure',
      categoryId: 'cat5',
      categoryIds: ['cat5'],
      projectId: 'proj1',
      contractStart: '2024-03-01',
      contractEnd: '2025-02-28',
      status: 'actif' as const,
      createdAt: '2024-01-05T10:00:00Z'
    }
  ];

  const reserves = [
    {
      id: 'res1',
      projectId: 'proj1',
      blockId: 'block1',
      apartmentId: 'apt1',
      categoryId: 'cat1',
      contractorId: 'cont1',
      title: 'Fuite dans la salle de bain',
      description: 'Problème de fuite au niveau du robinet de la salle de bain principale',
      images: [],
      status: 'ouverte' as const,
      priority: 'urgent' as const,
      createdAt: '2024-01-30T14:00:00Z'
    },
    {
      id: 'res2',
      projectId: 'proj1',
      blockId: 'block2',
      categoryId: 'cat2',
      contractorId: 'cont2',
      title: 'Problème électrique cuisine',
      description: 'Les prises de courant de la cuisine ne fonctionnent pas correctement',
      images: [],
      status: 'en_cours' as const,
      priority: 'normal' as const,
      createdAt: '2024-02-05T09:30:00Z'
    },
    {
      id: 'res3',
      projectId: 'proj2',
      blockId: 'block4',
      categoryId: 'cat3',
      contractorId: 'cont3',
      title: 'Retouche peinture bureau',
      description: 'Quelques retouches de peinture nécessaires dans les bureaux du 5ème étage',
      images: [],
      status: 'resolue' as const,
      priority: 'faible' as const,
      createdAt: '2024-02-10T11:00:00Z',
      resolvedAt: '2024-02-15T16:30:00Z'
    },
    {
      id: 'res4',
      projectId: 'proj1',
      blockId: 'block3',
      categoryId: 'cat4',
      contractorId: 'cont4',
      title: 'Carrelage fissuré',
      description: 'Plusieurs carreaux présentent des fissures dans le hall d\'entrée',
      images: [],
      status: 'ouverte' as const,
      priority: 'normal' as const,
      createdAt: '2024-02-12T10:15:00Z'
    }
  ];

  const tasks = [
    {
      id: 'task1',
      title: 'Installation plomberie Bloc A',
      description: 'Installation complète du système de plomberie pour le Bloc A',
      projectId: 'proj1',
      assignedTo: 'Ahmed Plomberie SARL',
      startDate: '2024-02-01',
      endDate: '2024-03-15',
      duration: 43,
      status: 'en_cours' as const,
      priority: 'urgent' as const,
      progress: 65,
      dependencies: [],
      createdAt: '2024-01-25T10:00:00Z'
    },
    {
      id: 'task2',
      title: 'Câblage électrique Tour Est',
      description: 'Installation du câblage électrique pour les étages 1-12',
      projectId: 'proj2',
      assignedTo: 'ElectroTech Solutions',
      startDate: '2024-03-01',
      endDate: '2024-05-30',
      duration: 90,
      status: 'en_attente' as const,
      priority: 'normal' as const,
      progress: 0,
      dependencies: [],
      createdAt: '2024-02-20T11:00:00Z'
    },
    {
      id: 'task3',
      title: 'Peinture façade extérieure',
      description: 'Application de la peinture sur la façade extérieure du Bloc B',
      projectId: 'proj1',
      assignedTo: 'Peinture Atlas',
      startDate: '2024-04-01',
      endDate: '2024-04-20',
      duration: 19,
      status: 'en_attente' as const,
      priority: 'normal' as const,
      progress: 0,
      dependencies: ['task1'],
      createdAt: '2024-02-25T09:30:00Z'
    },
    {
      id: 'task4',
      title: 'Pose carrelage hall principal',
      description: 'Installation du carrelage dans le hall principal du bâtiment',
      projectId: 'proj2',
      assignedTo: 'Carrelage Expert',
      startDate: '2024-05-15',
      endDate: '2024-06-15',
      duration: 31,
      status: 'en_attente' as const,
      priority: 'faible' as const,
      progress: 0,
      dependencies: ['task2'],
      createdAt: '2024-03-01T14:00:00Z'
    }
  ];

  const receptions = [
    {
      id: 'rec1',
      projectId: 'proj1',
      blockId: 'block1',
      categoryId: 'cat1',
      date: '2024-03-20',
      responsibleParties: ['Ahmed Plomberie SARL', 'Chef de projet', 'Architecte'],
      hasReserves: true,
      reserveCount: 2,
      isOnTime: false,
      delayDays: 5,
      pvGenerated: true,
      pvContent: 'Réception effectuée avec quelques réserves mineures...',
      createdAt: '2024-03-20T15:00:00Z'
    },
    {
      id: 'rec2',
      projectId: 'proj2',
      blockId: 'block4',
      date: '2024-04-10',
      responsibleParties: ['ElectroTech Solutions', 'Maître d\'ouvrage'],
      hasReserves: false,
      reserveCount: 0,
      isOnTime: true,
      delayDays: 0,
      pvGenerated: true,
      pvContent: 'Réception sans réserve, travaux conformes...',
      createdAt: '2024-04-10T16:30:00Z'
    }
  ];

  return {
    projects,
    blocks,
    apartments,
    categories,
    contractors,
    reserves,
    tasks,
    receptions
  };
};