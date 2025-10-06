'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BadgeCheck, Globe, Leaf, ArrowLeft } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

interface Flashcard {
  term: string;
  definition: string;
}

const Page: React.FC = () => {
  const objectives = [
    'Comprender qué es la biodiversidad y por qué es esencial',
    'Reconocer servicios ecosistémicos clave (provisión, regulación, culturales)',
    'Identificar amenazas (pérdida de hábitat, especies invasoras, contaminación, clima)',
    'Aplicar acciones de conservación y consumo responsable para proteger ecosistemas',
  ];

  const resources = [
    { title: 'ODS 15: Vida de ecosistemas terrestres (ONU)', url: 'https://www.un.org/sustainabledevelopment/es/biodiversity/' },
    { title: 'Convenio sobre la Diversidad Biológica (CBD)', url: 'https://www.cbd.int/' },
    { title: 'Lista Roja de la UICN', url: 'https://www.iucnredlist.org/' },
    { title: 'WWF: Biodiversidad', url: 'https://www.wwf.es/nuestro_trabajo/biodiversidad/' },
  ];

  const quiz: QuizQuestion[] = [
    {
      question: 'La biodiversidad se refiere a…',
      options: [
        'La variedad de vida (genes, especies y ecosistemas)',
        'Solo la cantidad de animales grandes',
        'La productividad agrícola',
        'La acumulación de residuos en ciudades',
      ],
      correctIndex: 0,
      explanation: 'Incluye diversidad genética, de especies y de ecosistemas.',
    },
    {
      question: 'Un servicio ecosistémico de regulación es…',
      options: ['Polinización de cultivos', 'Control de inundaciones por humedales', 'Recreación en parques', 'Producción de madera'],
      correctIndex: 1,
    },
    {
      question: 'Una amenaza frecuente para la biodiversidad es…',
      options: ['Restauración de hábitats', 'Pérdida y fragmentación de hábitat', 'Educación ambiental', 'Agricultura regenerativa'],
      correctIndex: 1,
    },
    {
      question: 'Una acción ciudadana útil para proteger la biodiversidad es…',
      options: ['Liberar mascotas en la naturaleza', 'Participar en ciencia ciudadana y apoyar áreas protegidas', 'Comprar especies exóticas sin control', 'Evitar conocer especies locales'],
      correctIndex: 1,
    },
  ];

  const flashcards: Flashcard[] = [
    { term: 'Ecosistema', definition: 'Conjunto de organismos y su entorno físico que interactúan.' },
    { term: 'Servicios ecosistémicos', definition: 'Beneficios que las personas obtienen de la naturaleza (provisión, regulación, culturales).'},
    { term: 'Especie endémica', definition: 'Especie que solo habita en una región específica.' },
    { term: 'Red trófica', definition: 'Relaciones de alimentación entre organismos en un ecosistema.' },
  ];

  const [answers, setAnswers] = useState<number[]>(Array(quiz.length).fill(-1));
  const [score, setScore] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('education_completed_modules');
    if (saved) {
      const arr = JSON.parse(saved) as string[];
      setCompleted(arr.includes('biodiversidad'));
    }
  }, []);

  const handleAnswer = (qIndex: number, optIndex: number) => {
    const next = [...answers];
    next[qIndex] = optIndex;
    setAnswers(next);
    // Persistir progreso parcial
    try {
      const answered = next.filter((v) => v !== -1).length;
      const percent = Math.round((answered / quiz.length) * 100);
      const savedProgress = localStorage.getItem('education_progress');
      const obj = savedProgress ? (JSON.parse(savedProgress) as Record<string, number>) : {};
      obj['biodiversidad'] = percent;
      localStorage.setItem('education_progress', JSON.stringify(obj));
    } catch {}
  };

  const calculateScore = () => {
    let s = 0;
    quiz.forEach((q, i) => {
      if (answers[i] === q.correctIndex) s++;
    });
    setScore(s);
    try {
      const percent = Math.round((s / quiz.length) * 100);
      const savedProgress = localStorage.getItem('education_progress');
      const obj = savedProgress ? (JSON.parse(savedProgress) as Record<string, number>) : {};
      obj['biodiversidad'] = percent;
      localStorage.setItem('education_progress', JSON.stringify(obj));
    } catch {}
  };

  const markCompleted = () => {
    const saved = localStorage.getItem('education_completed_modules');
    const arr = saved ? (JSON.parse(saved) as string[]) : [];
    if (!arr.includes('biodiversidad')) {
      const next = [...arr, 'biodiversidad'];
      localStorage.setItem('education_completed_modules', JSON.stringify(next));
      setCompleted(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-green-700 via-emerald-700 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8" />
              <h1 className="text-2xl md:text-3xl font-bold">Módulo: Biodiversidad y Ecosistemas</h1>
              {completed && <BadgeCheck className="h-6 w-6 text-white" />}
            </div>
            <Link href="/education">
              <Button variant="outline" className="bg-white text-green-800 hover:bg-green-50">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Educación
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-emerald-100 max-w-3xl">
            Explora por qué la biodiversidad sostiene nuestra vida, qué amenazas la ponen en riesgo y cómo proteger los ecosistemas.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Leaf className="h-5 w-5" /> Introducción</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {objectives.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Video</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg shadow">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src="https://www.youtube.com/embed/90NDETtorCs"
                    title="Biodiversidad | Planeta Darwin | Ciencias naturales"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
                <p className="text-sm text-gray-600 mt-3">Recurso educativo en español orientado a nivel introductorio.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Quiz</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {quiz.map((q, i) => (
                    <div key={i}>
                      <p className="font-medium text-gray-900 mb-2">{i + 1}. {q.question}</p>
                      <div className="space-y-2">
                        {q.options.map((opt, j) => (
                          <label key={j} className="flex items-center gap-2 text-gray-900 hover:bg-gray-50 rounded-md px-2 py-1">
                            <input
                              type="radio"
                              name={`q-${i}`}
                              checked={answers[i] === j}
                              onChange={() => handleAnswer(i, j)}
                              className="accent-green-600 focus:outline-none focus:ring-2 focus:ring-green-600"
                            />
                            <span className="text-gray-900">{opt}</span>
                          </label>
                        ))}
                      </div>
                      {answers[i] !== -1 && q.explanation && (
                        <p className="text-sm text-gray-600 mt-1">{q.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <Button onClick={calculateScore}>Calcular puntaje</Button>
                  {score !== null && (
                    <span className="text-gray-700">Puntaje: {score}/{quiz.length}</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Glosario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {flashcards.map((fc, i) => (
                    <details key={i} className="rounded-md border p-3">
                      <summary className="cursor-pointer font-semibold text-gray-900">{fc.term}</summary>
                      <p className="mt-2 text-gray-700">{fc.definition}</p>
                    </details>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Lecturas y recursos</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {resources.map((r, i) => (
                    <li key={i}>
                      <a href={r.url} target="_blank" rel="noreferrer" className="text-green-700 hover:underline">{r.title}</a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Acciones prácticas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-700">
                  <li>Planta y protege especies nativas; evita introducir especies exóticas.</li>
                  <li>Reduce plásticos de un solo uso y residuos; recicla y reutiliza.</li>
                  <li>Participa en ciencia ciudadana (observación de aves, biodiversidad urbana).</li>
                  <li>Apoya áreas protegidas y proyectos de restauración ecológica.</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Marcar como completado</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={markCompleted} className="w-full" variant="secondary">
                  {completed ? (
                    <span className="flex items-center justify-center gap-2"><BadgeCheck className="h-4 w-4" /> ¡Completado!</span>
                  ) : (
                    'Marcar como completado'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;