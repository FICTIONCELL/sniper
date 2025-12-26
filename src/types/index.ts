export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'en_cours' | 'termine' | 'en_attente';
  createdAt: string;
}

export interface Block {
  id: string;
  projectId: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Apartment {
  id: string;
  blockId: string;
  projectId: string;
  number: string;
  type: 'appartement' | 'villa' | 'studio' | 'duplex';
  surface: number;
  status: 'libre' | 'reserve' | 'vendu';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
}

export interface Contractor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  projectId: string;
  categoryIds: string[];
  contractStart: string;
  contractEnd: string;
  status: 'actif' | 'expire' | 'suspendu';
  createdAt: string;
}

export interface Reserve {
  id: string;
  projectId: string;
  blockId?: string;
  apartmentId?: string;
  categoryId: string;
  contractorId: string;
  title: string;
  description: string;
  images: string[];
  status: 'ouverte' | 'en_cours' | 'resolue';
  priority: 'urgent' | 'normal' | 'faible';
  createdAt: string;
  resolvedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assignedTo: string;
  startDate: string;
  endDate: string;
  duration: number; // en jours
  status: 'en_attente' | 'en_cours' | 'termine';
  priority: 'urgent' | 'normal' | 'faible';
  progress: number; // 0-100
  dependencies: string[]; // IDs des tâches dépendantes
  createdAt: string;
}

export interface Reception {
  id: string;
  projectId: string;
  blockId?: string;
  categoryId?: string;
  date: string;
  responsibleParties: string[];
  hasReserves: boolean;
  reserveCount: number;
  isOnTime: boolean;
  delayDays: number;
  pvGenerated: boolean;
  pvContent: string;
  attachmentType?: 'auto' | 'file' | 'text';
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
}

export interface Subcontractor {
  id: string;
  code: string;
  name: string;
  domain: string;
  status: 'entreprise' | 'artisan';
  phone: string;
  email: string;
  zone: string;
  typePrestation: 'fourniture_pose' | 'pose' | 'fourniture';
  price: number;
  unit: 'm2' | 'ml' | 'forfait';
  tvaIncluded: boolean;
  projects?: string[];
  delay: number;
  rating: number;
  createdAt: string;
}