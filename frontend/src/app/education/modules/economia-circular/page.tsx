'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BadgeCheck, BookOpen, Earth, Recycle, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

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

const EC_VIDEO_EMBED = 'https://www.youtube.com/embed/rPJyAR-Hz1A';

const Page: React.FC = () => {
  const objectives = [
    'Comprender los principios básicos de la economía circular',
    'Distinguir entre economía lineal y circular',
    'Identificar estrategias para eliminar residuos y circular materiales',
    'Reconocer ejemplos reales de aplicación en empresas y ciudades',
  ];

  const resources = [
    {
      title: 'Introducción a la Economía Circular – Ellen MacArthur Foundation',
      url: 'https://www.ellenmacarthurfoundation.org/topics/circular-economy-introduction/overview',
    },
    {
      title: 'Basics of a circular economy – Video (ES)',
      url: 'https://www.ellenmacarthurfoundation.org/videos/basics-of-a-circular-economy',
    },
    {
      title: 'What If We Don’t Buy Products and We Buy Service? – Video',
      url: 'https://www.ellenmacarthurfoundation.org/videos/what-if-we-dont-buy-products-and-we-buy-service',
    },
    {
      title: 'Knowledge pill: What is the circular economy? (UPF-BSM)',
      url: 'https://www.bsm.upf.edu/en/news/knowledge-pill-1-what-circular-economy',
    },
  ];

  const quiz: QuizQuestion[] = [
    {
      question: '¿Cuál es el objetivo principal de la economía circular?',
      options: [
        'Maximizar la producción al menor costo',
        'Eliminar residuos, circular productos y regenerar la naturaleza',
        'Incrementar el consumo de recursos finitos',
        'Prohibir el reciclaje en procesos industriales',
      ],
      correctIndex: 1,
      explanation:
        'La economía circular se basa en tres principios: eliminar residuos y contaminación, circular productos y materiales a su mayor valor, y regenerar la naturaleza.',
    },
    {
      question: '¿Cuál es la diferencia clave respecto a la economía lineal?',
      options: [
        'La circular ignora el diseño del producto',
        'La circular diseña para evitar residuos y mantener materiales en uso',
        'Ambas dependen de recursos infinitos',
        'La lineal recicla mejor que la circular',
      ],
      correctIndex: 1,
    },
    {
      question: '¿Qué estrategia NO pertenece a la economía circular?',
      options: ['Reutilización', 'Reciclaje', 'Regeneración', 'Obsolescencia programada'],
      correctIndex: 3,
    },
    {
      question: 'Un ejemplo de circularidad es:',
      options: [
        'Desechar dispositivos al primer fallo',
        'Diseñar para reparación y remanufactura',
        'Usar materiales tóxicos por su bajo costo',
        'Aumentar el consumo de energía fósil',
      ],
      correctIndex: 1,
    },
  ];

  const flashcards: Flashcard[] = [
    {
      term: 'Economía lineal',
      definition: 'Modelo “tomar-hacer-desechar” que depende de recursos finitos y genera residuos.',
    },
    {
      term: 'Economía circular',
      definition:
        'Modelo que diseña para eliminar residuos, mantener materiales en uso y regenerar sistemas naturales.',
    },
    {
      term: 'Circularidad a máximo valor',
      definition: 'Mantener productos y materiales en su mayor valor durante el mayor tiempo posible.',
    },
    {
      term: 'Regeneración',
      definition: 'Diseñar para devolver valor a la naturaleza: suelos saludables, biodiversidad, etc.',
    },
  ];

  const [answers, setAnswers] = useState<number[]>(Array(quiz.length).fill(-1));
  const [score, setScore] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('education_completed_modules');
    if (saved) {
      const arr = JSON.parse(saved) as string[];
      setCompleted(arr.includes('economia-circular'));
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
    if (!arr.includes('economia-circular')) {
      const next = [...arr, 'economia-circular'];
      localStorage.setItem('education_completed_modules', JSON.stringify(next));
      setCompleted(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-green-600 via-green-700 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Recycle className="h-8 w-8" />
              <h1 className="text-2xl md:text-3xl font-bold">Módulo: Economía Circular</h1>
              {completed && <BadgeCheck className="h-6 w-6 text-white" />}
            </div>
            <Link href="/education">
              <Button variant="outline" className="bg-white text-green-700 hover:bg-green-50">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Educación
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-green-100 max-w-3xl">
            Aprende los principios y prácticas para diseñar sistemas que eliminen residuos, circulen materiales y regeneren la naturaleza.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Introducción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  La economía circular es un marco de soluciones sistémicas que aborda desafíos globales como el cambio climático, la pérdida de biodiversidad, los residuos y la contaminación.
                  Se basa en tres principios: eliminar residuos y contaminación desde el diseño, circular productos y materiales (en su mayor valor) y regenerar la naturaleza.
                </p>
                <div className="flex flex-wrap gap-2">
                  {objectives.map((obj, i) => (
                    <span key={i} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">{obj}</span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Earth className="h-5 w-5" /> Video</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                  <iframe
                    className="w-full h-full"
                    src={`${EC_VIDEO_EMBED}?rel=0`}
                    title="Economía Circular"
                    frameBorder={0}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <p className="text-sm text-gray-600 mt-3">Video introductorio basado en materiales de la Ellen MacArthur Foundation.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Quiz</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {quiz.map((q, i) => (
                    <div key={i}>
                      <p className="font-medium text-gray-900 mb-2">{i + 1}. {q.question}</p>
                      <div className="space-y-2">
                        {q.options.map((opt, j) => (
                          <label key={j} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`q-${i}`}
                              checked={answers[i] === j}
                              onChange={() => handleAnswer(i, j)}
                            />
                            <span className="text-gray-700">{opt}</span>
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
                  <Button onClick={checkQuiz} className="bg-green-600 hover:bg-green-700">Calcular puntaje</Button>
                  {score !== null && (
                    <p className="text-gray-900 font-semibold">Tu puntaje: {score} / {quiz.length}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Glosario</CardTitle>
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
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:text-green-800 underline">
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
                <Button onClick={markCompleted} className={completed ? 'bg-gray-300 text-gray-700 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} disabled={completed}>
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