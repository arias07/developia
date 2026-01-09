// Pool of fictional team member names for project assignment
// These names are used to give clients the perception of a human team

export interface TeamMemberProfile {
  name: string;
  avatarSeed: string; // Used for DiceBear avatar generation
  bio: string;
}

// Project Managers - Senior professionals with leadership experience
export const PM_PROFILES: TeamMemberProfile[] = [
  {
    name: 'Carlos Mendoza',
    avatarSeed: 'carlos-mendoza-pm',
    bio: 'Project Manager con 8 años de experiencia liderando equipos de desarrollo. Especialista en metodologías ágiles y entrega de proyectos a tiempo.',
  },
  {
    name: 'María Fernández',
    avatarSeed: 'maria-fernandez-pm',
    bio: 'PMP certificada con experiencia en proyectos de transformación digital. Enfocada en comunicación efectiva y satisfacción del cliente.',
  },
  {
    name: 'Roberto Sánchez',
    avatarSeed: 'roberto-sanchez-pm',
    bio: 'Scrum Master y Project Manager con background técnico. Especializado en proyectos SaaS y aplicaciones empresariales.',
  },
  {
    name: 'Ana Lucía Morales',
    avatarSeed: 'ana-morales-pm',
    bio: 'Gestora de proyectos con enfoque en UX y productos digitales. Apasionada por crear experiencias excepcionales para usuarios.',
  },
  {
    name: 'Fernando Herrera',
    avatarSeed: 'fernando-herrera-pm',
    bio: 'PM senior con experiencia en startups y empresas Fortune 500. Experto en escalar equipos y procesos.',
  },
  {
    name: 'Patricia Ruiz',
    avatarSeed: 'patricia-ruiz-pm',
    bio: 'Project Manager especializada en e-commerce y fintech. Certificada en PMI-ACP y SAFe.',
  },
  {
    name: 'Miguel Ángel Torres',
    avatarSeed: 'miguel-torres-pm',
    bio: 'Líder técnico convertido en PM. Entiende profundamente los desafíos de desarrollo y traduce requerimientos de negocio.',
  },
  {
    name: 'Gabriela Vega',
    avatarSeed: 'gabriela-vega-pm',
    bio: 'Project Manager con 10 años en la industria tech. Especialista en proyectos de alta complejidad y equipos distribuidos.',
  },
];

// Senior Developers - Experienced professionals with deep technical knowledge
export const SENIOR_PROFILES: TeamMemberProfile[] = [
  {
    name: 'Alejandro García',
    avatarSeed: 'alejandro-garcia-sr',
    bio: 'Full-Stack Developer con 7 años de experiencia. Experto en React, Node.js y arquitecturas cloud.',
  },
  {
    name: 'Laura Martínez',
    avatarSeed: 'laura-martinez-sr',
    bio: 'Senior Developer especializada en frontend y sistemas de diseño. Contribuidora a proyectos open source.',
  },
  {
    name: 'Diego Ramírez',
    avatarSeed: 'diego-ramirez-sr',
    bio: 'Arquitecto de software con expertise en microservicios y sistemas distribuidos. AWS Solutions Architect.',
  },
  {
    name: 'Sofía Castillo',
    avatarSeed: 'sofia-castillo-sr',
    bio: 'Backend Developer senior con 8 años de experiencia. Especialista en bases de datos y optimización de rendimiento.',
  },
  {
    name: 'Andrés López',
    avatarSeed: 'andres-lopez-sr',
    bio: 'Tech Lead con experiencia en fintech y healthtech. Apasionado por código limpio y mejores prácticas.',
  },
  {
    name: 'Valentina Herrera',
    avatarSeed: 'valentina-herrera-sr',
    bio: 'Senior Full-Stack Developer con enfoque en TypeScript y Next.js. Mentora de desarrolladores junior.',
  },
  {
    name: 'Ricardo Fuentes',
    avatarSeed: 'ricardo-fuentes-sr',
    bio: 'DevOps Engineer y desarrollador senior. Experto en CI/CD, Kubernetes y automatización.',
  },
  {
    name: 'Carolina Méndez',
    avatarSeed: 'carolina-mendez-sr',
    bio: 'Full-Stack Developer con especialización en e-commerce. Experiencia con Shopify, Stripe y sistemas de pago.',
  },
];

// Junior Developers - Enthusiastic professionals learning and growing
export const JUNIOR_PROFILES: TeamMemberProfile[] = [
  {
    name: 'Daniel Rojas',
    avatarSeed: 'daniel-rojas-jr',
    bio: 'Desarrollador frontend con 2 años de experiencia. Enfocado en React y diseño responsive.',
  },
  {
    name: 'Camila Ortiz',
    avatarSeed: 'camila-ortiz-jr',
    bio: 'Junior Developer apasionada por UI/UX. Experiencia en Vue.js y TailwindCSS.',
  },
  {
    name: 'Sebastián Muñoz',
    avatarSeed: 'sebastian-munoz-jr',
    bio: 'Desarrollador backend con conocimientos en Node.js y PostgreSQL. Entusiasta de las APIs REST.',
  },
  {
    name: 'Isabella Vargas',
    avatarSeed: 'isabella-vargas-jr',
    bio: 'Frontend Developer con ojo para el detalle. Especializada en animaciones y micro-interacciones.',
  },
  {
    name: 'Mateo Silva',
    avatarSeed: 'mateo-silva-jr',
    bio: 'Junior Full-Stack con experiencia en Next.js y Supabase. Siempre aprendiendo nuevas tecnologías.',
  },
  {
    name: 'Valeria Castro',
    avatarSeed: 'valeria-castro-jr',
    bio: 'Desarrolladora con background en diseño gráfico. Une creatividad con código.',
  },
  {
    name: 'Nicolás Peña',
    avatarSeed: 'nicolas-pena-jr',
    bio: 'Backend Developer junior con experiencia en Python y JavaScript. Interesado en IA y ML.',
  },
  {
    name: 'Mariana Delgado',
    avatarSeed: 'mariana-delgado-jr',
    bio: 'Junior Developer con certificación en React. Enfocada en accesibilidad web y buenas prácticas.',
  },
  {
    name: 'Tomás Guerrero',
    avatarSeed: 'tomas-guerrero-jr',
    bio: 'Desarrollador mobile con conocimientos en React Native. Entusiasta del desarrollo cross-platform.',
  },
  {
    name: 'Luciana Mora',
    avatarSeed: 'luciana-mora-jr',
    bio: 'Frontend Developer con experiencia en testing. Promotora de TDD y código de calidad.',
  },
  {
    name: 'Felipe Ríos',
    avatarSeed: 'felipe-rios-jr',
    bio: 'Junior Full-Stack enfocado en TypeScript. Experiencia en startups y desarrollo ágil.',
  },
  {
    name: 'Antonella Suárez',
    avatarSeed: 'antonella-suarez-jr',
    bio: 'Desarrolladora con enfoque en e-commerce. Conocimientos en Stripe, PayPal y sistemas de pago.',
  },
];

// Specializations pool based on project type
export const SPECIALIZATIONS = {
  landing_page: ['HTML/CSS', 'JavaScript', 'TailwindCSS', 'SEO', 'Responsive Design'],
  website: ['Next.js', 'React', 'CMS', 'SEO', 'Performance Optimization'],
  web_app: ['React', 'Node.js', 'PostgreSQL', 'REST APIs', 'Authentication'],
  mobile_app: ['React Native', 'iOS', 'Android', 'Push Notifications', 'App Store'],
  ecommerce: ['Stripe', 'Payment Processing', 'Inventory Management', 'Shopping Cart', 'Next.js'],
  saas: ['Multi-tenancy', 'Subscriptions', 'API Design', 'Authentication', 'Dashboard'],
  api: ['REST', 'GraphQL', 'Node.js', 'Documentation', 'Security'],
  game: ['Game Development', 'WebGL', 'Canvas', 'Game Physics', 'Animation'],
  custom: ['Full-Stack', 'System Design', 'Integration', 'Custom Solutions', 'Consulting'],
} as const;

// Titles based on role
export const ROLE_TITLES = {
  project_manager: 'Project Manager',
  senior_developer: 'Senior Full-Stack Developer',
  junior_developer: 'Junior Developer',
} as const;

/**
 * Generate avatar URL using DiceBear API
 * Using 'avataaars' style for professional-looking avatars
 */
export function generateAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9&clothingColor=3c4f5c,65c9ff,5199e4&skinColor=ae5d29,d08b5b,edb98a,ffdbb4`;
}

/**
 * Get random item from array
 */
export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get random items from array without repetition
 */
export function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Get specializations based on project type
 */
export function getSpecializationsForProject(
  projectType: keyof typeof SPECIALIZATIONS
): string[] {
  return [...(SPECIALIZATIONS[projectType] || SPECIALIZATIONS.custom)];
}
