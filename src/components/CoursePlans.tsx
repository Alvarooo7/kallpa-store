'use client';

import { useState } from 'react';
import type { Course } from '@/lib/courses';
import { courseWaLink } from '@/lib/company';
import { money } from '@/lib/format';

export function CoursePlans({ course }: { course: Course }) {
  const [selectedId, setSelectedId] = useState(course.plans[0].id);
  const selected = course.plans.find(plan => plan.id === selectedId)!;
  const message = `Hola Kallpa, quiero inscribirme en ${course.name} (${course.category}). Me interesa el plan ${selected.label} de ${money(selected.price)}. ¿Me confirman cupos, horarios y cómo realizar el pago?`;
  return <div className="course-enrollment">
    <h2>Elige tu plan</h2>
    {course.slug === 'funcional-crossfit' && <p className="course-included">Todos los planes incluyen <strong>2 sesiones de piscina de relajación por mes</strong>. No es acceso libre a la piscina.</p>}
    <div className="course-plans" role="group" aria-label="Planes del curso">{course.plans.map(plan => <button key={plan.id} type="button" className={`course-plan${plan.id === selectedId ? ' selected' : ''}`} aria-pressed={plan.id === selectedId} onClick={() => setSelectedId(plan.id)}><span>{plan.label}</span><strong>{money(plan.price)}</strong><small>{plan.detail}</small></button>)}</div>
    <p className="course-plan-summary" aria-live="polite">{selected.label} · {money(selected.price)}</p>
    <a className="btn acc block" href={courseWaLink(message)} target="_blank" rel="noopener noreferrer">Consultar cupo por WhatsApp</a>
    <p className="course-help">Te ayudamos a elegir tu horario y confirmar tu inscripción. Aceptamos Yape, Plin, Visa y Mastercard; coordinamos el pago por WhatsApp.</p>
  </div>;
}
