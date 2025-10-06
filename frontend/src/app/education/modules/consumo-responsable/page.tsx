'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BadgeCheck, ShoppingCart, Target, ArrowLeft, CheckCircle } from 'lucide-react';

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
    'Adoptar hábitos de compra conscientes y sostenibles',
    'Diferenciar necesidad vs. deseo antes de adquirir productos',
    'Evaluar el impacto ambiental y social de lo que consumimos',
    'Aplicar estrategias como reparar, reutilizar y compartir',
  ];

  const resources = [
    {
      title: 'Guía de consumo responsable (OXFAM)',
      url: 'https://blog.oxfamintermon.org/consumo-responsable-sostenible/',
    },
    {
      title: '10 hábitos de consumo responsable',
      url: 'https://ecologiadigital.bio/cuales-son-algunos-ejemplos-de-consumo-sostenible-que-puedo-implementar-en-mi-vida-diaria/',
    },
    {
      title: 'Estrategias de compra consciente',
      url: 'https://www.un.org/sustainabledevelopment/es/sustainable-consumption-production/',
    },
  ];

  const quiz: QuizQuestion[] = [
    {
      question: 'Antes de comprar, ¿qué deberías preguntarte primero?',
      options: [
        'Si el producto está de moda',
        'Si realmente lo necesitas y por cuánto tiempo lo usarás',
        'Si puedes devolverlo fácilmente',
        'Si está en oferta',
      ],
      correctIndex: 1,
      explanation: 'La clave del consumo responsable es cuestionar la necesidad real y la duración de uso.',
    },
    {
      question: 'Una práctica de consumo responsable es…',
      options: ['Comprar siempre nuevo', 'Reparar y reutilizar antes de reemplazar', 'Desechar tras el primer fallo', 'Elegir productos de corta duración'],
      correctIndex: 1,
    },
    {
      question: 'Para reducir el impacto, conviene…',
      options: ['Priorizar envases de un solo uso', 'Elegir productos locales y duraderos', 'Comprar impulsivamente', 'Ignorar la eficiencia energética'],
      correctIndex: 1,
    },
    {
      question: 'El intercambio y la compra de segunda mano…',
      options: ['Aumenta residuos', 'Reduce la demanda de productos nuevos y extiende la vida útil', 'No tiene beneficios ambientales', 'Es menos transparente que lo nuevo'],
      correctIndex: 1,
    },
  ];

  const flashcards: Flashcard[] = [
    { term: 'Necesidad vs. deseo', definition: 'Analizar si un producto es realmente necesario o solo deseado.' },
    { term: 'Durabilidad', definition: 'Capacidad de un producto para resistir uso prolongado y reparaciones.' },
    { term: 'Economía compartida', definition: 'Modelos para usar en vez de poseer: alquilar, compartir, intercambiar.' },
    { term: 'Huella ambiental', definition: 'Impacto total (materiales, energía, residuos) asociado a un producto.' },
  ];

  const [answers, setAnswers] = useState<number[]>(Array(quiz.length).fill(-1));
  const [score, setScore] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('education_completed_modules');
    if (saved) {
      const arr = JSON.parse(saved) as string[];
      setCompleted(arr.includes('consumo-responsable'));
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
    if (!arr.includes('consumo-responsable')) {
      const next = [...arr, 'consumo-responsable'];
      localStorage.setItem('education_completed_modules', JSON.stringify(next));
      setCompleted(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-8 w-8" />
              <h1 className="text-2xl md:text-3xl font-bold">Módulo: Consumo Responsable</h1>
              {completed && <BadgeCheck className="h-6 w-6 text-white" />}
            </div>
            <Link href="/education">
              <Button variant="outline" className="bg-white text-purple-700 hover:bg-purple-50">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Educación
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-purple-100 max-w-3xl">
            Aprende a tomar decisiones de compra conscientes que reduzcan tu impacto y fomenten usos más sostenibles de los productos.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Introducción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  El consumo responsable implica elegir productos y servicios considerando su utilidad real, su durabilidad, el origen de los materiales y su impacto ambiental y social. 
                  Impulsa prácticas como reparar, reutilizar, compartir y comprar de segunda mano para extender la vida útil y reducir residuos.
                </p>
                <div className="flex flex-wrap gap-2">
                  {objectives.map((obj, i) => (
                    <span key={i} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm">{obj}</span>
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
                    src="https://www.youtube.com/embed/qtXuRvKNm3s"
                    title="ODS 12: Producción y consumo responsable"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
                <p className="text-sm text-gray-600 mt-3">Fuente: ONU y recursos educativos sobre ODS 12.</p>
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
                              className="accent-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600"
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
                        <p className="text-gray-600 text-sm mt-1">{q.explanation}</p>
                      )}
                    </div>
                  ))}
                  <Button onClick={checkQuiz} className="bg-purple-600 hover:bg-purple-700">Calcular puntaje</Button>
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
                      <a href={r.url} target="_blank" rel="noreferrer" className="text-purple-700 hover:underline">{r.title}</a>
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
                  <li>Antes de comprar, espera 24 horas y reevalúa la necesidad.</li>
                  <li>Prioriza productos reparables, modulares y con garantías claras.</li>
                  <li>Compra de segunda mano o intercambia en tu comunidad.</li>
                  <li>Elige envases reutilizables y evita el un solo uso.</li>
                  <li>Prefiere productos locales y con menor huella logística.</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Marcar como completado</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={markCompleted} className="bg-purple-600 hover:bg-purple-700">
                  <CheckCircle className="mr-2 h-4 w-4" /> Marcar módulo como completado
                </Button>
                {completed && (
                  <p className="mt-2 text-green-700 flex items-center gap-2">
                    <BadgeCheck className="h-5 w-5" /> ¡Has completado este módulo!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;