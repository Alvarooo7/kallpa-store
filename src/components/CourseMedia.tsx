'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Course } from '@/lib/courses';
import { courseWaLink } from '@/lib/company';

export function CourseMedia({ course }: { course: Course }) {
  const [playing, setPlaying] = useState(false);
  const copy = course.slug === 'natacion' ? {
    title: 'Tu próxima meta empieza en el agua.',
    intro: '¿Quieres aprender a nadar o mejorar tu técnica? Entrena en grupo, disfruta una piscina temperada y haz de cada clase un momento para ti. Te esperamos en Jesús María.',
    video: 'Así se entrena en Kallpa. Imagínate aquí, dando tu próxima brazada.',
    flyer: 'De «algún día» a tu primera clase. Elige 8 o 12 clases y consulta tu horario.',
    action: 'Quiero empezar a nadar',
  } : {
    title: 'Haz espacio para una versión más fuerte de ti.',
    intro: 'Dale un nuevo ritmo a tu rutina. Entrena fuerza, resistencia y movilidad con guía de coach en Búnker Cross, Jesús María. Todos los planes incluyen 2 sesiones de piscina de relajación por mes.',
    video: 'Conoce dónde empieza tu próximo reto. Entrena con guía, a tu ritmo.',
    flyer: 'Elige el plan que encaje contigo y da el primer paso hacia una rutina más activa.',
    action: 'Quiero empezar a entrenar',
  };
  return <section className="course-media" aria-label="Fotos y video del curso">
    <h2>{copy.title}</h2>
    <p>{copy.intro}</p>
    <div className="course-media-grid">
      <figure>
        {playing ? <video controls autoPlay playsInline preload="none" src={course.video} aria-label={`Video de ${course.name}`} /> : <button type="button" className="course-video-cover" onClick={() => setPlaying(true)} aria-label={`Reproducir video de ${course.name}`}><Image src={course.flyer} alt="" width={1024} height={768} sizes="(max-width: 700px) 90vw, 440px" /><span>▶ Ver video del curso</span></button>}
        <figcaption>{copy.video}</figcaption>
      </figure>
      <figure><a href={course.flyer} target="_blank" rel="noopener noreferrer" aria-label={`Ampliar afiche de ${course.name}`}><Image src={course.flyer} alt={`Afiche original de ${course.category}, con planes y horarios`} width={1024} height={768} sizes="(max-width: 700px) 90vw, 440px" /></a><figcaption>{copy.flyer}</figcaption></figure>
    </div>
    <a className="btn acc" style={{ marginTop: 20 }} href={courseWaLink(`Hola Kallpa, quiero empezar con ${course.name}. ¿Qué horarios y cupos tienen disponibles?`)} target="_blank" rel="noopener noreferrer">{copy.action}</a>
    <p className="course-help">Consulta los cupos y las promociones vigentes por WhatsApp antes de inscribirte.</p>
  </section>;
}
