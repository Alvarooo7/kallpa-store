import Image from 'next/image';
import Link from 'next/link';
import { COURSES } from '@/lib/courses';
import { money } from '@/lib/format';

export function CourseCards() {
  return <div className="course-grid">{COURSES.map(course => <Link className="course-card" href={`/cursos/${course.slug}`} key={course.slug}>
    <div className="course-card-photo"><Image src={course.image} alt={course.imageAlt} fill sizes="(max-width: 444px) calc(100vw - 44px), (max-width: 700px) 400px, (max-width: 924px) calc((100vw - 64px) / 2), 430px" /></div>
    <div className="course-card-copy"><span className="eb">{course.category}</span><h2>{course.name}</h2><p>{course.tagline}</p>
      <div className="course-card-bottom"><span>Desde <strong>{money(Math.min(...course.plans.map(plan => plan.price)))}</strong></span><span>Ver planes <span aria-hidden="true">→</span></span></div>
    </div>
  </Link>)}</div>;
}

export function HomeCourses() {
  return <section id="cursos"><div className="wrap"><div className="shead"><div><span className="eb">Cursos presenciales · Jesús María</span><h2>También entrenamos contigo.</h2></div><Link className="vall" href="/cursos">Ver cursos</Link></div><CourseCards /></div></section>;
}
