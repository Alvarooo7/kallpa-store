import type { Metadata } from 'next';
import Link from 'next/link';
import { CourseCards } from '@/components/CourseCards';

export const metadata: Metadata = { title: 'Cursos de natación y entrenamiento funcional en Jesús María', description: 'Conoce los cursos presenciales de Kallpa: natación grupal y entrenamiento funcional Búnker Cross. Planes, horarios e inscripción por WhatsApp.', alternates: { canonical: '/cursos' } };

export default function CoursesPage() {
  return <div className="wrap courses-page"><nav className="course-breadcrumb" aria-label="Ruta"><Link href="/">Inicio</Link> / Cursos</nav>
    <header className="courses-heading"><span className="eb">Jesús María · Presencial</span><h1>Aprende. Entrena.<br />Sigue avanzando.</h1><p>Natación y entrenamiento funcional para sumar movimiento a tu semana. Elige tu curso, revisa los horarios y conversemos por WhatsApp.</p></header>
    <CourseCards />
    <div className="course-how"><h2>Tu siguiente paso es simple.</h2><ol><li><b>Elige tu curso y plan.</b> Revisa precios, horarios y ubicación.</li><li><b>Conversemos por WhatsApp.</b> Cuéntanos qué turno te interesa.</li><li><b>Confirma tu inscripción.</b> Coordinamos tu cupo, inicio y pago.</li></ol></div>
  </div>;
}
