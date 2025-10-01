'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle, 
  Play, 
  Pause, 
  RotateCcw,
  BookOpen,
  Clock,
  Award,
  ChevronRight,
  Lightbulb,
  Target,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface ModuleContent {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  sections: {
    id: string;
    title: string;
    content: string;
    type: 'text' | 'interactive' | 'quiz';
    data?: any;
  }[];
  quiz: {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  }[];
}

const ModulePage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.id as string;
  
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [moduleCompleted, setModuleCompleted] = useState(false);

  // Contenido de los módulos
  const moduleContent: Record<string, ModuleContent> = {
    'circular-economy': {
      id: 'circular-economy',
      title: 'Economía Circular',
      description: 'Comprende los principios de la economía circular y cómo el intercambio contribuye a un futuro sostenible.',
      duration: '15 min',
      level: 'Básico',
      sections: [
        {
          id: 'intro',
          title: 'Introducción a la Economía Circular',
          type: 'text',
          content: `La economía circular es un modelo económico que busca eliminar los residuos y el uso continuo de recursos. 
          
          A diferencia del modelo lineal tradicional de "tomar, hacer, desechar", la economía circular se basa en tres principios fundamentales:
          
          • **Diseñar sin residuos**: Los productos se diseñan para durar, repararse y reutilizarse
          • **Mantener productos y materiales en uso**: Maximizar el valor de los recursos a través del intercambio y la reutilización
          • **Regenerar sistemas naturales**: Devolver nutrientes valiosos a la biosfera
          
          En GreenLoop, aplicamos estos principios facilitando el intercambio de objetos que ya no necesitas por otros que sí necesitas, extendiendo así la vida útil de los productos.`
        },
        {
          id: 'benefits',
          title: 'Beneficios de la Economía Circular',
          type: 'interactive',
          content: 'Descubre los múltiples beneficios de adoptar un modelo circular',
          data: {
            benefits: [
              {
                title: 'Reducción de Residuos',
                description: 'Hasta 80% menos residuos enviados a vertederos',
                impact: '2.3 toneladas de CO₂ ahorradas por persona/año'
              },
              {
                title: 'Ahorro Económico',
                description: 'Familias ahorran hasta $1,200 anuales',
                impact: 'Reducción del 60% en gastos de productos nuevos'
              },
              {
                title: 'Creación de Empleos',
                description: '6 millones de empleos verdes para 2030',
                impact: 'Nuevas oportunidades en reparación y reutilización'
              }
            ]
          }
        },
        {
          id: 'practice',
          title: 'Aplicación Práctica',
          type: 'text',
          content: `**Cómo aplicar la economía circular en tu vida diaria:**
          
          1. **Antes de comprar**: Pregúntate si realmente necesitas el producto nuevo
          2. **Intercambia primero**: Busca en GreenLoop si alguien tiene lo que necesitas
          3. **Mantén y repara**: Cuida tus objetos para que duren más tiempo
          4. **Comparte recursos**: Intercambia objetos que uses ocasionalmente
          5. **Piensa en el ciclo completo**: Considera qué pasará con el objeto cuando ya no lo necesites
          
          **Ejemplo práctico**: En lugar de comprar una herramienta que usarás una vez, intercámbiala por algo que ya no uses. Después del proyecto, puedes intercambiarla nuevamente.`
        }
      ],
      quiz: [
        {
          question: '¿Cuál es el principio fundamental de la economía circular?',
          options: [
            'Comprar productos más baratos',
            'Eliminar residuos y mantener recursos en uso',
            'Producir más rápido',
            'Usar solo productos nuevos'
          ],
          correct: 1,
          explanation: 'La economía circular se basa en eliminar residuos y mantener productos y materiales en uso el mayor tiempo posible.'
        },
        {
          question: '¿Cuánto CO₂ puede ahorrar una persona al año aplicando economía circular?',
          options: ['1 tonelada', '2.3 toneladas', '5 toneladas', '10 toneladas'],
          correct: 1,
          explanation: 'Según estudios, una persona puede ahorrar hasta 2.3 toneladas de CO₂ al año aplicando principios de economía circular.'
        }
      ]
    },
    'carbon-footprint': {
      id: 'carbon-footprint',
      title: 'Huella de Carbono',
      description: 'Aprende cómo tus decisiones de consumo afectan las emisiones de CO₂ y el cambio climático.',
      duration: '20 min',
      level: 'Intermedio',
      sections: [
        {
          id: 'what-is',
          title: '¿Qué es la Huella de Carbono?',
          type: 'text',
          content: `La huella de carbono es la cantidad total de gases de efecto invernadero (principalmente CO₂) que se emiten directa o indirectamente por nuestras actividades.
          
          **Tipos de emisiones:**
          • **Directas**: Las que produces directamente (conducir, calefacción)
          • **Indirectas**: Las que se producen para crear productos que consumes
          
          **Datos impactantes:**
          • Un smartphone nuevo genera ~70kg de CO₂ en su fabricación
          • Una camiseta de algodón: ~8kg de CO₂
          • Un libro: ~1kg de CO₂
          • Una bicicleta: ~96kg de CO₂
          
          Cuando intercambias en lugar de comprar nuevo, evitas estas emisiones de fabricación.`
        },
        {
          id: 'calculation',
          title: 'Calculando tu Impacto',
          type: 'interactive',
          content: 'Calcula cuánto CO₂ has ahorrado con tus intercambios',
          data: {
            calculator: {
              items: [
                { name: 'Smartphone', co2: 70, category: 'Electrónicos' },
                { name: 'Laptop', co2: 300, category: 'Electrónicos' },
                { name: 'Camiseta', co2: 8, category: 'Ropa' },
                { name: 'Jeans', co2: 33, category: 'Ropa' },
                { name: 'Libro', co2: 1, category: 'Educación' },
                { name: 'Bicicleta', co2: 96, category: 'Transporte' }
              ]
            }
          }
        },
        {
          id: 'reduction',
          title: 'Estrategias de Reducción',
          type: 'text',
          content: `**Cómo reducir tu huella de carbono a través del intercambio:**
          
          1. **Intercambia antes que comprar**: Reduce emisiones de fabricación
          2. **Elige productos duraderos**: Menos reemplazos = menos emisiones
          3. **Intercambio local**: Reduce emisiones de transporte
          4. **Mantén productos en uso**: Extiende su vida útil
          5. **Educa a otros**: Multiplica el impacto positivo
          
          **Meta global**: Reducir emisiones 45% para 2030 para limitar el calentamiento a 1.5°C
          
          **Tu contribución cuenta**: Cada intercambio evita emisiones y inspira a otros a hacer lo mismo.`
        }
      ],
      quiz: [
        {
          question: '¿Cuánto CO₂ genera aproximadamente la fabricación de un smartphone?',
          options: ['20kg', '50kg', '70kg', '100kg'],
          correct: 2,
          explanation: 'La fabricación de un smartphone genera aproximadamente 70kg de CO₂, principalmente en la extracción de materiales y manufactura.'
        },
        {
          question: '¿Cuál es la meta global de reducción de emisiones para 2030?',
          options: ['25%', '35%', '45%', '55%'],
          correct: 2,
          explanation: 'Para limitar el calentamiento global a 1.5°C, necesitamos reducir las emisiones globales en 45% para 2030.'
        }
      ]
    }
  };

  const currentModule = moduleContent[moduleId];

  useEffect(() => {
    if (!currentModule) {
      router.push('/education');
    }
  }, [moduleId, currentModule, router]);

  const handleSectionComplete = (sectionIndex: number) => {
    if (!completedSections.includes(sectionIndex)) {
      setCompletedSections([...completedSections, sectionIndex]);
    }
    if (sectionIndex < currentModule.sections.length - 1) {
      setCurrentSection(sectionIndex + 1);
    }
  };

  const handleQuizSubmit = () => {
    setShowQuizResults(true);
    const correctAnswers = quizAnswers.filter((answer, index) => 
      answer === currentModule.quiz[index].correct
    ).length;
    
    if (correctAnswers >= currentModule.quiz.length * 0.7) {
      setModuleCompleted(true);
    }
  };

  if (!currentModule) {
    return <div>Cargando...</div>;
  }

  const progress = ((completedSections.length + (showQuizResults ? 1 : 0)) / (currentModule.sections.length + 1)) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/education">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{currentModule.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {currentModule.duration}
                  </span>
                  <span className="flex items-center">
                    <Award className="h-4 w-4 mr-1" />
                    {currentModule.level}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Progreso</div>
              <div className="text-lg font-semibold text-green-600">{Math.round(progress)}%</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contenido del Módulo</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  {currentModule.sections.map((section, index) => (
                    <button
                      key={section.id}
                      onClick={() => setCurrentSection(index)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        currentSection === index
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{section.title}</span>
                        {completedSections.includes(index) && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentSection(currentModule.sections.length)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentSection === currentModule.sections.length
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Evaluación Final</span>
                      {showQuizResults && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {currentSection < currentModule.sections.length ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {currentModule.sections[currentSection].title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentModule.sections[currentSection].type === 'text' && (
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                        {currentModule.sections[currentSection].content}
                      </div>
                    </div>
                  )}

                  {currentModule.sections[currentSection].type === 'interactive' && (
                    <div>
                      <p className="text-gray-700 mb-6">
                        {currentModule.sections[currentSection].content}
                      </p>
                      
                      {/* Interactive content based on module */}
                      {moduleId === 'circular-economy' && currentModule.sections[currentSection].data?.benefits && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {currentModule.sections[currentSection].data.benefits.map((benefit: any, index: number) => (
                            <div key={index} className="bg-green-50 p-4 rounded-lg">
                              <h4 className="font-semibold text-green-800 mb-2">{benefit.title}</h4>
                              <p className="text-sm text-gray-600 mb-2">{benefit.description}</p>
                              <p className="text-xs text-green-600 font-medium">{benefit.impact}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-8 flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                      disabled={currentSection === 0}
                    >
                      Anterior
                    </Button>
                    <Button
                      onClick={() => handleSectionComplete(currentSection)}
                      className="flex items-center"
                    >
                      {completedSections.includes(currentSection) ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Completado
                        </>
                      ) : (
                        <>
                          Marcar como completado
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Quiz Section */
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Evaluación Final</CardTitle>
                  <p className="text-gray-600">
                    Responde estas preguntas para completar el módulo
                  </p>
                </CardHeader>
                <CardContent>
                  {!showQuizResults ? (
                    <div className="space-y-6">
                      {currentModule.quiz.map((question, qIndex) => (
                        <div key={qIndex} className="border-b pb-6 last:border-b-0">
                          <h3 className="font-semibold mb-4">
                            {qIndex + 1}. {question.question}
                          </h3>
                          <div className="space-y-2">
                            {question.options.map((option, oIndex) => (
                              <label key={oIndex} className="flex items-center space-x-3 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`question-${qIndex}`}
                                  value={oIndex}
                                  onChange={() => {
                                    const newAnswers = [...quizAnswers];
                                    newAnswers[qIndex] = oIndex;
                                    setQuizAnswers(newAnswers);
                                  }}
                                  className="text-green-600"
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      <Button
                        onClick={handleQuizSubmit}
                        disabled={quizAnswers.length < currentModule.quiz.length}
                        className="w-full"
                      >
                        Enviar Respuestas
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-center">
                        {moduleCompleted ? (
                          <div className="text-green-600">
                            <CheckCircle className="h-16 w-16 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold mb-2">¡Módulo Completado!</h3>
                            <p>Has aprobado la evaluación. ¡Excelente trabajo!</p>
                          </div>
                        ) : (
                          <div className="text-orange-600">
                            <RotateCcw className="h-16 w-16 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold mb-2">Necesitas repasar</h3>
                            <p>Revisa el contenido e intenta nuevamente.</p>
                          </div>
                        )}
                      </div>

                      {/* Show results */}
                      <div className="space-y-4">
                        {currentModule.quiz.map((question, qIndex) => (
                          <div key={qIndex} className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-2">{question.question}</h4>
                            <p className={`mb-2 ${
                              quizAnswers[qIndex] === question.correct 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              Tu respuesta: {question.options[quizAnswers[qIndex]]}
                              {quizAnswers[qIndex] === question.correct ? ' ✓' : ' ✗'}
                            </p>
                            {quizAnswers[qIndex] !== question.correct && (
                              <p className="text-green-600 mb-2">
                                Respuesta correcta: {question.options[question.correct]}
                              </p>
                            )}
                            <p className="text-sm text-gray-600">{question.explanation}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-center space-x-4">
                        <Link href="/education">
                          <Button variant="outline">
                            Volver a Educación
                          </Button>
                        </Link>
                        {!moduleCompleted && (
                          <Button onClick={() => {
                            setShowQuizResults(false);
                            setQuizAnswers([]);
                          }}>
                            Intentar Nuevamente
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModulePage;