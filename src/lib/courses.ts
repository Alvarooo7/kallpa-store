export type Course = {
  slug: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  image: string;
  imageAlt: string;
  video: string;
  flyer: string;
  location: string;
  audience: string;
  benefits: string[];
  schedules: { days: string; hours: string }[];
  plans: { id: string; label: string; price: number; detail: string }[];
  questions: { question: string; answer: string }[];
};

// Planes y horarios facilitados por el propietario en los archivos de cursos.
// El material original se muestra separado de los planes actuales.
export const COURSES: Course[] = [
  {
    slug: 'natacion', name: 'Natación grupal', category: 'Club de Nadadores Kallpa',
    tagline: 'Tu próximo reto empieza en el agua.',
    description: 'Aprende desde cero o perfecciona tu técnica en clases grupales para jóvenes y adultos. Entrena en la piscina temperada del Colegio Teresa González de Fanning, en Jesús María.',
    image: '/courses/luchito-natacion-v4.webp', imageAlt: 'Luchito nadando con gorro en una piscina inspirada en el local del video, con plataformas celestes y graderías azules',
    video: '/courses/natacion-original.mp4', flyer: '/courses/natacion-afiche.webp',
    location: 'Piscina temperada del Colegio Teresa González de Fanning, Jesús María, Lima.',
    audience: 'Jóvenes y adultos · desde principiantes',
    benefits: ['Aprendizaje desde cero', 'Perfeccionamiento de técnica', 'Clases grupales en piscina temperada', 'Entrenamiento para quienes buscan participar en competencias'],
    schedules: [{ days: 'Lunes a viernes', hours: '9:00 p.m. a 10:00 p.m.' }, { days: 'Sábados', hours: '1:00 p.m. a 2:00 p.m. / 2:00 p.m. a 3:00 p.m.' }, { days: 'Domingos', hours: '9:00 a.m.' }],
    plans: [{ id: '8-clases', label: '8 clases', price: 270, detail: 'Formación y constancia semanal.' }, { id: '12-clases', label: '12 clases', price: 330, detail: 'Entrenamiento intensivo de técnica.' }],
    questions: [{ question: '¿Puedo empezar sin saber nadar?', answer: 'Sí. Las clases incluyen aprendizaje desde cero. Cuéntanos tu experiencia por WhatsApp para coordinar el grupo adecuado.' }, { question: '¿Cómo elijo mi horario?', answer: 'Elige un paquete y dinos qué turno te interesa. Confirmamos los cupos, la fecha de inicio y la vigencia del paquete por WhatsApp antes de inscribirte.' }, { question: '¿Qué necesito llevar?', answer: 'Al coordinar tu inscripción te indicamos el equipo y los requisitos de ingreso a la piscina.' }],
  },
  {
    slug: 'funcional-crossfit', name: 'Entrenamiento funcional', category: 'Búnker Cross',
    tagline: 'Haz del movimiento tu nueva rutina.',
    description: 'Entrena fuerza, resistencia y movilidad en Búnker Cross. Elige un plan de acceso libre dentro de los horarios del gimnasio, con guía de coach y dos sesiones de piscina de relajación al mes.',
    image: '/courses/luchito-funcional.webp', imageAlt: 'Luchito con polo Kallpa bordado realizando una sentadilla con pesa rusa en el gimnasio',
    video: '/courses/bunker-original.mp4', flyer: '/courses/bunker-afiche.webp',
    location: 'Gimnasio Búnker Cross · Av. Talara 450, Jesús María, Lima.',
    audience: 'Entrenamiento funcional · guía de coach',
    benefits: ['Entrenamiento de fuerza, resistencia y movilidad', 'Guía de coach', 'Horarios libres dentro de los turnos del gimnasio', '2 sesiones de piscina de relajación por mes'],
    schedules: [{ days: 'Lunes a viernes', hours: '6:00 a.m. a 9:00 a.m. / 5:00 p.m. a 9:00 p.m.' }, { days: 'Sábados', hours: '6:00 a.m. a 9:00 a.m.' }],
    plans: [{ id: 'mensual', label: 'Mensual', price: 160, detail: '2 sesiones de piscina por mes.' }, { id: 'trimestral', label: 'Trimestral', price: 375, detail: '2 sesiones de piscina por mes + 20 días de congelamiento.' }, { id: 'semestral', label: '6 meses', price: 690, detail: '2 sesiones de piscina por mes + 20 días de congelamiento.' }, { id: 'anual', label: 'Anual', price: 1290, detail: '2 sesiones de piscina por mes + 20 días de congelamiento.' }],
    questions: [{ question: '¿Cómo funcionan los horarios libres?', answer: 'Puedes entrenar dentro de los turnos publicados del gimnasio. Coordinamos tu inicio y las indicaciones para tu primera sesión por WhatsApp.' }, { question: '¿Qué incluye la piscina?', answer: 'Todos los planes incluyen dos sesiones de piscina de relajación por mes. Coordinamos los turnos disponibles al inscribirte.' }, { question: '¿Puedo congelar mi plan?', answer: 'Los planes desde el trimestral incluyen 20 días de congelamiento. Consulta por WhatsApp cómo solicitarlos y las condiciones antes de elegir tu plan.' }],
  },
];

export const courseBySlug = (slug: string) => COURSES.find(course => course.slug === slug);
