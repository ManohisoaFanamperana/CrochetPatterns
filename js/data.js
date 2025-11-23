// Sample patron data
export const SAMPLE_PATRONS = [
  {
    id: '1',
    name: 'Amigurumi Chat Mignon',
    category: 'amigurumi',
    level: 'debutant',
    hookSize: '3.5',
    yarnAmount: 150,
    materials: ['Fil acrylique', 'Yeux de sécurité', 'Fibrefill', 'Aiguille à laine'],
    description: 'Un adorable petit chat amigurumi parfait pour les débutants. Facile à faire et très mignon!',
    image: null,
    pdf: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Sac à Main Bohème',
    category: 'accessoire',
    level: 'intermediaire',
    hookSize: '4.5',
    yarnAmount: 400,
    materials: ['Fil coton', 'Anses en cuir', 'Doublure en tissu', 'Bouton'],
    description: 'Un sac à main stylé et pratique avec une anse en cuir. Parfait pour l\'été!',
    image: null,
    pdf: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Couverture Granny Square',
    category: 'deco',
    level: 'intermediaire',
    hookSize: '4',
    yarnAmount: 2000,
    materials: ['Fil multicolore', 'Épingle de blocage'],
    description: 'Une belle couverture aux carrés granny traditionnels. Idéale pour les canapés ou pique-niques.',
    image: null,
    pdf: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Top Ajouré d\'Été',
    category: 'vetement',
    level: 'avance',
    hookSize: '3.5',
    yarnAmount: 600,
    materials: ['Fil de lin', 'Boutons', 'Élastique'],
    description: 'Un top ajouré et féminin parfait pour les chaudes journées d\'été. Motifs de dentelle délicats.',
    image: null,
    pdf: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Suspension Florale',
    category: 'deco',
    level: 'debutant',
    hookSize: '3.5',
    yarnAmount: 100,
    materials: ['Fil coton', 'Perles de bois', 'Crochet'],
    description: 'Une jolie suspension florale pour décorer votre intérieur. Facile et rapide à faire.',
    image: null,
    pdf: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const LEVEL_COLORS = {
  debutant: 'bg-green-500',
  intermediaire: 'bg-yellow-500',
  avance: 'bg-red-500'
};

export const LEVEL_LABELS = {
  debutant: '🟢 Débutant',
  intermediaire: '🟡 Intermédiaire',
  avance: '🔴 Avancé'
};

export const CATEGORIES = {
  amigurumi: '🧸 Amigurumi',
  accessoire: '👜 Accessoires',
  vetement: '👗 Vêtements',
  deco: '🏠 Décoration',
  autre: '🎨 Autre'
};
