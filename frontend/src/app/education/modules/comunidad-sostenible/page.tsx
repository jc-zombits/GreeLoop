'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BadgeCheck, Users, ArrowLeft } from 'lucide-react';

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
    'Entender qué es una comunidad sostenible y sus pilares',
    'Identificar iniciativas locales que promueven sostenibilidad (huertos, reciclaje, trueque)',
    'Fomentar la participación ciudadana y redes de colaboración',
    'Aplicar acciones prácticas para fortalecer la comunidad y reducir impactos',
  ];

  const resources = [
    { title: 'ODS 11: Ciudades y comunidades sostenibles (ONU)', url: 'https://www.un.org/sustainabledevelopment/es/cities/' },
    { title: 'Pacto Mundial – ODS 11', url: 'https://www.pactomundial.org/ods/ods-11/' },
    { title: 'Guías de participación ciudadana y sostenibilidad local', url: 'https://www.iied.org/' },
    { title: 'Zero Waste Communities', url: 'https://zerowasteworld.org/' },
    { title: 'Busca huertos urbanos en tu ciudad', url: 'https://www.google.com/search?q=huertos+urbanos+tu+ciudad' },
    { title: 'Encuentra bancos de tiempo locales', url: 'https://www.google.com/search?q=banco+de+tiempo+tu+ciudad' },
  ];

  const quiz: QuizQuestion[] = [
    {
      question: 'Una comunidad sostenible se caracteriza por…',
      options: [
        'Consumo desmedido y poca participación ciudadana',
        'Colaboración, inclusión, movilidad sostenible y gestión de residuos',
        'Uso exclusivo del automóvil privado',
        'Crecimiento sin planificación urbana',
      ],
      correctIndex: 1,
      explanation: 'Integra aspectos sociales, ambientales y económicos con participación activa.',
    },
    {
      question: 'Una iniciativa local que fortalece la sostenibilidad es…',
      options: ['Promover el desperdicio', 'Huertos urbanos y compostaje comunitario', 'Eliminar espacios verdes', 'Fomentar el aislamiento social'],
      correctIndex: 1,
    },
    {
      question: 'La economía colaborativa en la comunidad puede incluir…',
      options: ['Trueque, bancos de tiempo y compartir herramientas', 'Comprar siempre nuevo', 'Prohibir el préstamo de objetos', 'Aumentar residuos intencionalmente'],
      correctIndex: 0,
    },
    {
      question: 'Una acción para mejorar la movilidad sostenible es…',
      options: ['Incrementar coches individuales', 'Impulsar ciclovías, transporte público y caminar', 'Eliminar rutas peatonales', 'Cerrar estaciones de transporte'],
      correctIndex: 1,
    },
    {
      question: 'Para fomentar la inclusión, la comunidad debería…',
      options: ['Segregar actividades', 'Diseñar espacios y actividades accesibles', 'Evitar la participación ciudadana', 'Centrarse solo en lo digital'],
      correctIndex: 1,
      explanation: 'La inclusión implica accesibilidad física y social, y participación abierta.',
    },
    {
      question: 'Una forma de medir el impacto de un huerto urbano es…',
      options: ['Comentarios subjetivos', 'Kg de residuos compostados y número de participantes activos', 'Número de “likes” en redes', 'Color de las herramientas'],
      correctIndex: 1,
      explanation: 'Usa métricas como kg compostados, voluntarios, parcelas activas y cosecha anual.',
    },
  ];

  const flashcards: Flashcard[] = [
    { term: 'Comunidad sostenible', definition: 'Colectivo que integra prácticas ambientales, sociales y económicas responsables.' },
    { term: 'Participación ciudadana', definition: 'Implicación activa de personas en decisiones y proyectos comunitarios.' },
    { term: 'Economía colaborativa', definition: 'Modelo basado en compartir, intercambiar y cooperar en lugar de poseer.' },
    { term: 'Gobernanza local', definition: 'Gestión y coordinación de actores locales para el bien común.' },
  ];

  const [answers, setAnswers] = useState<number[]>(Array(quiz.length).fill(-1));
  const [score, setScore] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('education_completed_modules');
    if (saved) {
      const arr = JSON.parse(saved) as string[];
      setCompleted(arr.includes('comunidad-sostenible'));
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
      obj['comunidad-sostenible'] = percent;
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
      obj['comunidad-sostenible'] = percent;
      localStorage.setItem('education_progress', JSON.stringify(obj));
    } catch {}
  };

  const markCompleted = () => {
    const saved = localStorage.getItem('education_completed_modules');
    const arr = saved ? (JSON.parse(saved) as string[]) : [];
    if (!arr.includes('comunidad-sostenible')) {
      const next = [...arr, 'comunidad-sostenible'];
      localStorage.setItem('education_completed_modules', JSON.stringify(next));
      setCompleted(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-pink-600 via-pink-700 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8" />
              <h1 className="text-2xl md:text-3xl font-bold">Módulo: Comunidad Sostenible</h1>
              {completed && <BadgeCheck className="h-6 w-6 text-white" />}
            </div>
            <Link href="/education">
              <Button variant="outline" className="bg-white text-pink-700 hover:bg-pink-50">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Educación
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-pink-100 max-w-3xl">
            Descubre cómo construir comunidades más sostenibles mediante colaboración, economía compartida e iniciativas locales.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Introducción</CardTitle>
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
                    src="https://www.youtube.com/embed/oEbY0BGfF6k"
                    title="ODS 11: Ciudades y comunidades sostenibles"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
                <p className="text-sm text-gray-600 mt-3">Recurso educativo en español sobre ODS 11.</p>
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
                              className="accent-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-600"
                            />
                            <span className="text-gray-900">{opt}</span>
                          </label>
                        ))}
                      </div>
                      {answers[i] !== -1 && (
                        <p className={answers[i] === q.correctIndex ? 'text-green-700' : 'text-red-700'}>
                          {answers[i] === q.correctIndex ? 'Correcto' : 'Incorrecto'}
                        </p>
                      )}
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
                      <a href={r.url} target="_blank" rel="noreferrer" className="text-pink-700 hover:underline">{r.title}</a>
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
                  <li>
                    Organiza jornadas de trueque y bancos de tiempo en tu barrio.
                    <span className="block text-sm text-gray-600">Meta: 20 participantes, 100 objetos intercambiados por evento.</span>
                  </li>
                  <li>
                    Participa en huertos urbanos, compostaje y reciclaje comunitario.
                    <span className="block text-sm text-gray-600">Indicadores: kg de residuos compostados/mes, voluntarios activos, parcelas en uso.</span>
                  </li>
                  <li>
                    Apoya la movilidad sostenible: caminar, bicicleta y transporte público.
                    <span className="block text-sm text-gray-600">Objetivo: +15% viajes en bici/mes, +10% uso de transporte público.</span>
                  </li>
                  <li>
                    Colabora con asociaciones locales en proyectos de inclusión y cuidado del entorno.
                    <span className="block text-sm text-gray-600">Métrica: número de actividades inclusivas y participantes por trimestre.</span>
                  </li>
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