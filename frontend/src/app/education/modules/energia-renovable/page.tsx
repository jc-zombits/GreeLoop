'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Sun, Wind, Battery, ArrowLeft, BadgeCheck, CheckCircle } from 'lucide-react';

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
    'Conocer las principales fuentes de energía renovable (solar, eólica, hidráulica)',
    'Identificar oportunidades de eficiencia energética en el hogar',
    'Comprender el autoconsumo y su impacto en emisiones y costes',
    'Aplicar acciones prácticas de ahorro y uso eficiente de energía',
  ];

  const resources = [
    { title: 'ODS 7: Energía asequible y no contaminante (ONU)', url: 'https://www.un.org/sustainabledevelopment/es/energy/' },
    { title: 'IDAE: Guías y eficiencia energética', url: 'https://www.idae.es/publicaciones' },
    { title: 'Autoconsumo fotovoltaico: recursos informativos', url: 'https://www.ree.es/es/ambitos/energia/energia-solar' },
  ];

  const quiz: QuizQuestion[] = [
    {
      question: '¿Cuál de las siguientes es una fuente renovable?',
      options: ['Carbón', 'Solar', 'Diésel', 'Gas natural'],
      correctIndex: 1,
      explanation: 'La energía solar es renovable; carbón, diésel y gas natural son fósiles.',
    },
    {
      question: 'El autoconsumo fotovoltaico permite…',
      options: [
        'Generar electricidad propia y reducir la factura',
        'Aumentar el consumo sin cambios',
        'Depender más de combustibles fósiles',
        'Eliminar la necesidad de eficiencia',
      ],
      correctIndex: 0,
      explanation: 'El autoconsumo genera electricidad local y reduce costes y emisiones.',
    },
    {
      question: 'Una medida de eficiencia energética en casa es…',
      options: ['Usar bombillas incandescentes', 'Aislar mejor y cambiar a LED', 'Dejar aparatos en standby', 'Abrir ventanas para calentar'],
      correctIndex: 1,
    },
    {
      question: 'La energía eólica se obtiene a partir de…',
      options: ['Movimiento del agua', 'Calor del subsuelo', 'Viento que mueve aerogeneradores', 'Radiación solar directa'],
      correctIndex: 2,
    },
  ];

  const flashcards: Flashcard[] = [
    { term: 'Autoconsumo', definition: 'Generación y consumo local de electricidad (p. ej., solar fotovoltaica).' },
    { term: 'Eficiencia energética', definition: 'Usar menos energía para obtener el mismo servicio (iluminación, climatización, etc.).' },
    { term: 'Mix energético', definition: 'Composición de fuentes de energía utilizadas en una región o país.' },
    { term: 'Net metering / Compensación de excedentes', definition: 'Mecanismo para compensar la energía generada y vertida a la red.' },
  ];

  const [answers, setAnswers] = useState<number[]>(Array(quiz.length).fill(-1));
  const [score, setScore] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('education_completed_modules');
    if (saved) {
      const arr = JSON.parse(saved) as string[];
      setCompleted(arr.includes('energia-renovable'));
    }
  }, []);

  const handleAnswer = (qIndex: number, optionIndex: number) => {
    const next = [...answers];
    next[qIndex] = optionIndex;
    setAnswers(next);
  };

  const checkQuiz = () => {
    const s = answers.reduce((acc, ans, i) => (ans === quiz[i].correctIndex ? acc + 1 : acc), 0);
    setScore(s);
  };

  const markCompleted = () => {
    const saved = localStorage.getItem('education_completed_modules');
    const arr = saved ? (JSON.parse(saved) as string[]) : [];
    if (!arr.includes('energia-renovable')) {
      const next = [...arr, 'energia-renovable'];
      localStorage.setItem('education_completed_modules', JSON.stringify(next));
      setCompleted(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-yellow-500 via-yellow-600 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sun className="h-8 w-8" />
              <h1 className="text-2xl md:text-3xl font-bold">Módulo: Energía Renovable</h1>
              {completed && <BadgeCheck className="h-6 w-6 text-white" />}
            </div>
            <Link href="/education">
              <Button variant="outline" className="bg-white text-yellow-700 hover:bg-yellow-50">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Educación
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-yellow-100 max-w-3xl">
            Descubre las fuentes renovables (solar, eólica, hidráulica) y cómo aplicar eficiencia y autoconsumo para reducir emisiones y ahorrar.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wind className="h-5 w-5" /> Introducción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  Las energías renovables provienen de fuentes naturales inagotables o de regeneración continua. Entre las más comunes se encuentran la solar, la eólica y la hidráulica. 
                  Combinadas con medidas de eficiencia energética, permiten reducir la dependencia de combustibles fósiles, las emisiones y los costes.
                </p>
                <div className="flex flex-wrap gap-2">
                  {objectives.map((obj, i) => (
                    <span key={i} className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm">{obj}</span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Video</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-200">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/XgFRTehpDsk"
                    title="Fuentes de energía renovables: eólica, hidráulica y mareomotriz"
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
                              className="accent-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-600"
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
                  <Button onClick={checkQuiz} className="bg-yellow-600 hover:bg-yellow-700">Calcular puntaje</Button>
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
                <CardTitle className="flex items-center gap-2">Lecturas y recursos</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {resources.map((r, i) => (
                    <li key={i}>
                      <a href={r.url} target="_blank" rel="noreferrer" className="text-yellow-700 hover:underline">{r.title}</a>
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
                  <li>Reemplaza bombillas por LED y optimiza el uso de iluminación natural.</li>
                  <li>Reduce el consumo en standby usando regletas con interruptor.</li>
                  <li>Mejora el aislamiento en ventanas y puertas para disminuir pérdidas térmicas.</li>
                  <li>Evalúa la viabilidad de autoconsumo solar y electrodomésticos eficientes (A+++).</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Finalizar módulo</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={markCompleted} className="w-full bg-green-600 hover:bg-green-700">
                  Marcar como completado <CheckCircle className="ml-2 h-4 w-4" />
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
                  <Button className="w-full">Volver y elegir otro módulo <ArrowLeft className="ml-2 h-4 w-4" /></Button>
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