import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { COURSES, courseBySlug } from '@/lib/courses';
import { CoursePlans } from '@/components/CoursePlans';
import { CourseMedia } from '@/components/CourseMedia';

export function generateStaticParams() { return COURSES.map(course => ({ slug: course.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const course = courseBySlug((await params).slug);
  if (!course) return { title: 'Curso no encontrado' };
  return { title: `${course.name} en Jesús María`, description: course.description, alternates: { canonical: `/cursos/${course.slug}` }, openGraph: { images: [course.image] } };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const course = courseBySlug((await params).slug);
  if (!course) notFound();
  return <div className="wrap courses-page"><nav className="course-breadcrumb" aria-label="Ruta"><Link href="/">Inicio</Link> / <Link href="/cursos">Cursos</Link> / {course.name}</nav>
    <div className="course-detail"><div><div className="course-detail-photo"><Image src={course.image} alt={course.imageAlt} width={1254} height={1254} priority sizes="(max-width: 444px) calc(100vw - 44px), (max-width: 850px) 400px, 444px" /></div>
      <div className="course-location"><span className="eb">Dónde entrenamos</span><h2>Jesús María, Lima</h2><p>{course.location}</p></div>
    </div><div className="course-decision"><span className="eb">{course.category} · Presencial</span><h1>{course.name}</h1><CoursePlans course={course} /></div></div>
    <div className="course-overview"><h2>Sobre el curso</h2><p>{course.description}</p><p className="course-audience">{course.audience}</p></div>
    <div className="course-info-grid"><section><h2>Qué incluye</h2><ul className="ben">{course.benefits.map(benefit => <li key={benefit}>{benefit}</li>)}</ul></section>
      <section><h2>Horarios</h2><dl className="course-schedule">{course.schedules.map(schedule => <div key={schedule.days}><dt>{schedule.days}</dt><dd>{schedule.hours}</dd></div>)}</dl></section></div>
    <CourseMedia course={course} />
    <section className="course-questions"><h2>Antes de empezar</h2><div className="product-disclosures">{course.questions.map(item => <details key={item.question}><summary>{item.question}</summary><div className="disclosure-content"><p>{item.answer}</p></div></details>)}</div></section>
    <Link href="/cursos" className="tl">← Ver todos los cursos</Link>
  </div>;
}
