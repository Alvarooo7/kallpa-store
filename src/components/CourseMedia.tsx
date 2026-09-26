'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Course } from '@/lib/courses';

export function CourseMedia({ course }: { course: Course }) {
  const [playing, setPlaying] = useState(false);
  return <section className="course-media" aria-label="Fotos y video del curso">
    <h2>Conoce el curso en imágenes</h2>
    <p>Material original del club. Las promociones, horarios y contactos de los afiches o videos pueden variar; confirma los detalles con nosotros al consultar cupo.</p>
    <div className="course-media-grid">
      <figure>
        {playing ? <video controls autoPlay playsInline preload="none" src={course.video} aria-label={`Video de ${course.name}`} /> : <button type="button" className="course-video-cover" onClick={() => setPlaying(true)} aria-label={`Reproducir video de ${course.name}`}><Image src={course.flyer} alt="" width={1024} height={768} sizes="(max-width: 700px) 90vw, 440px" /><span>▶ Ver video del curso</span></button>}
        <figcaption>Video original · {course.category}</figcaption>
      </figure>
      <figure><a href={course.flyer} target="_blank" rel="noopener noreferrer" aria-label={`Ampliar afiche de ${course.name}`}><Image src={course.flyer} alt={`Afiche original de ${course.category}, con planes y horarios`} width={1024} height={768} sizes="(max-width: 700px) 90vw, 440px" /></a><figcaption>Afiche del club · toca para ampliar</figcaption></figure>
    </div>
  </section>;
}
