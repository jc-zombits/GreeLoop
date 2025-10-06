'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BadgeCheck, Flame, Leaf, Gauge, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

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

const VIDEO_EMBED = 'https://www.youtube.com/embed/KJgGfY5PACM';

const Page: React.FC = () => {
  const objectives = [
    'Entender qué es la huella de carbono y cómo se mide',
    'Conocer las fuentes de emisiones directas e indirectas (alcances 1, 2 y 3)',
    'Identificar estrategias para reducir y compensar emisiones',
    'Explorar herramientas para el cálculo y reporte',
  ];

  const resources = [
    {
      title: 'Huella de Carbono – Guía básica (Ministerio de Transición Ecológica, España)',
      url: 'https://www.miteco.gob.es/es/cambio-climatico/temas/mitigacion-politicas-y-medidas/huella-de-carbono.html',
    },
    {
      title: 'GHG Protocol – Corporate Standard',
      url: 'https://ghgprotocol.org/corporate-standard',
    },
    {
      title: 'ISO 14064 – Medición y reporte de GEI',
      url: 'https://www.iso.org/standard/66454.html',
    },
  ];

  const quiz: QuizQuestion[] = [
    {
      question: 'La huella de carbono mide…',
      options: [
        'El consumo de agua de una organización',
        'Las emisiones de GEI asociadas a actividades y productos',
        'La biodiversidad de un territorio',
        'La cantidad de residuos sólidos generados',
      ],
      correctIndex: 1,
    },
    {
      question: 'El alcance 1 se refiere a…',
      options: [
        'Emisiones directas controladas por la organización (combustión en calderas, vehículos)',
        'Emisiones por electricidad adquirida',
        'Emisiones de la cadena de valor (proveedores, uso de producto)',
        'Emisiones por viajes aéreos de terceros',
      ],
      correctIndex: 0,
    },
    {
      question: 'Una estrategia efectiva para reducir emisiones es…',
      options: [
        'Incrementar consumo de combustibles fósiles',
        'Mejorar eficiencia energética y electrificar procesos con renovables',
        'Aumentar la obsolescencia de equipos',
        'Ignorar datos de proveedores',
      ],
      correctIndex: 1,
    },
    {
      question: 'La compensación de carbono…',
      options: [
        'Sustituye la reducción de emisiones',
        'Complementa la reducción con proyectos certificados (reforestación, captura)',
        'No tiene estándares reconocidos',
        'Se basa en emisiones de alcance 4',
      ],
      correctIndex: 1,
    },
  ];

  const flashcards: Flashcard[] = [
    { term: 'GEI', definition: 'Gases de Efecto Invernadero: CO2, CH4, N2O, etc.' },
    { term: 'Alcance 1', definition: 'Emisiones directas de fuentes controladas por la organización.' },
    { term: 'Alcance 2', definition: 'Emisiones indirectas por electricidad/energía comprada.' },
    { term: 'Alcance 3', definition: 'Emisiones indirectas de la cadena de valor.' },
    { term: 'Factor de emisión', definition: 'Relación entre actividad y emisiones (p.ej., kg CO2e/kWh).'},
  ];

  const [answers, setAnswers] = useState<number[]>(Array(quiz.length).fill(-1));
  const [score, setScore] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('education_completed_modules');
    if (saved) {
      const arr = JSON.parse(saved) as string[];
      setCompleted(arr.includes('huella-carbono'));
    }
  }, []);

  const handleAnswer = (qIndex: number, optionIndex: number) => {
    const next = [...answers];
    next[qIndex] = optionIndex;
    setAnswers(next);
    // Persistir progreso parcial: porcentaje de preguntas respondidas correctamente
    try {
      const answered = next.filter((v) => v !== -1).length;
      const percent = Math.round((answered / quiz.length) * 100);
      const savedProgress = localStorage.getItem('education_progress');
      const obj = savedProgress ? (JSON.parse(savedProgress) as Record<string, number>) : {};
      obj['huella-carbono'] = percent;
      localStorage.setItem('education_progress', JSON.stringify(obj));
    } catch {}
  };

  const checkQuiz = () => {
    const s = answers.reduce((acc, ans, i) => (ans === quiz[i].correctIndex ? acc + 1 : acc), 0);
    setScore(s);
    // Al calcular score, actualizar porcentaje según preguntas correctas
    try {
      const percent = Math.round((s / quiz.length) * 100);
      const savedProgress = localStorage.getItem('education_progress');
      const obj = savedProgress ? (JSON.parse(savedProgress) as Record<string, number>) : {};
      obj['huella-carbono'] = percent;
      localStorage.setItem('education_progress', JSON.stringify(obj));
    } catch {}
  };

  const markCompleted = () => {
    const saved = localStorage.getItem('education_completed_modules');
    const arr = saved ? (JSON.parse(saved) as string[]) : [];
    if (!arr.includes('huella-carbono')) {
      const next = [...arr, 'huella-carbono'];
      localStorage.setItem('education_completed_modules', JSON.stringify(next));
      setCompleted(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gauge className="h-8 w-8" />
              <h1 className="text-2xl md:text-3xl font-bold">Módulo: Huella de Carbono</h1>
              {completed && <BadgeCheck className="h-6 w-6 text-white" />}
            </div>
            <Link href="/education">
              <Button variant="outline" className="bg-white text-emerald-700 hover:bg-emerald-50">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Educación
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-emerald-100 max-w-3xl">
            Aprende a medir, reportar y reducir las emisiones de GEI asociadas a actividades y productos.
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
                <p className="text-gray-700 mb-4">
                  La huella de carbono cuantifica las emisiones de gases de efecto invernadero (GEI) generadas por una actividad, organización o producto, normalmente expresadas en CO2 equivalente (CO2e).
                  Se basa en estándares como GHG Protocol e ISO 14064 y se organiza en alcances (1, 2 y 3).
                </p>
                <div className="flex flex-wrap gap-2">
                  {objectives.map((obj, i) => (
                    <span key={i} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm">{obj}</span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Flame className="h-5 w-5" /> Video</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                  <iframe
                    className="w-full h-full"
                    src={`${VIDEO_EMBED}?rel=0`}
                    title="Huella de Carbono"
                    frameBorder={0}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <p className="text-sm text-gray-600 mt-3">Video divulgativo en español para introducir conceptos clave de medición y reducción.</p>
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
                              className="accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                            <span className="text-gray-900">{opt}</span>
                          </label>
                        ))}
                      </div>
                      {score !== null && (
                        <p className={answers[i] === q.correctIndex ? 'text-green-700' : 'text-red-700'}>
                          {answers[i] === q.correctIndex ? 'Correcto' : 'Incorrecto'}
                        </p>
                      )}
                      {score !== null && q.explanation && (
                        <p className="text-gray-600 text-sm mt-1">{q.explanation}</p>
                      )}
                    </div>
                  ))}
                  <Button onClick={checkQuiz} className="bg-emerald-600 hover:bg-emerald-700">Calcular puntaje</Button>
                  {score !== null && (
                    <p className="text-gray-900 font-semibold">Tu puntaje: {score} / {quiz.length}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Glosario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {flashcards.map((fc, i) => (
                    <details key={i} className="bg-white rounded-lg border p-4">
                      <summary className="cursor-pointer font-medium text-gray-900">{fc.term}</summary>
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
                <CardTitle>Recursos</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {resources.map((r) => (
                    <li key={r.url}>
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:text-emerald-800 underline">
                        {r.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Finalizar módulo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-3">Marca este módulo como completado para registrar tu progreso.</p>
                <Button onClick={markCompleted} className={completed ? 'bg-gray-300 text-gray-700 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'} disabled={completed}>
                  {completed ? <><CheckCircle className="mr-2 h-4 w-4" /> Módulo completado</> : 'Marcar como completado'}
                </Button>
                {completed && (
                  <p className="text-sm text-gray-600 mt-2">Tu progreso se guarda localmente en tu navegador.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Siguiente paso</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/education">
                  <Button className="w-full">Volver y elegir otro módulo <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;