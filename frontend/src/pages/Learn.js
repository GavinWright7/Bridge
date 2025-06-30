import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';

const Learn = () => {
  const [learningPlan, setLearningPlan] = useState(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [completedDays, setCompletedDays] = useState(new Set());

  const getDayTitle = useCallback((day) => {
    const titles = [
      "HTML Fundamentals", "CSS Basics", "JavaScript Introduction", "DOM Manipulation", "ES6 Features",
      "React Basics", "Components & Props", "State Management", "Event Handling", "Hooks Introduction",
      "useEffect Hook", "Custom Hooks", "Context API", "Routing", "Forms",
      "API Integration", "Error Handling", "Testing Basics", "Performance", "Accessibility",
      "Responsive Design", "CSS Grid", "Flexbox", "Animations", "Build Tools",
      "Git & GitHub", "Deployment", "Code Review", "Best Practices", "Final Project"
    ];
    return titles[day - 1] || `Topic ${day}`;
  }, []);

  const getDayType = useCallback((day) => {
    const types = ['reading', 'video', 'quiz', 'game'];
    return types[(day - 1) % 4];
  }, []);

  const getDayContent = useCallback((day) => {
    const title = getDayTitle(day);
    const content = {
      reading: `# ${title}\n\nWelcome to day ${day} of your learning journey!\n\n## Today's Focus\n\nToday we'll explore **${title}** and how it applies to your career development.\n\n### Key Learning Points:\n\n- Understanding the fundamentals\n- Practical applications\n- Best practices\n- Real-world examples\n\n### Exercise\n\nTry to implement what you've learned today in a small project or example.\n\n**Remember:** Practice makes perfect! 🚀`,
      video: `/videos/day${day}.mp4`,
      quiz: {
        question: `What is the most important concept about ${title}?`,
        options: [
          "Understanding the basic principles",
          "Memorizing all the syntax",
          "Skipping to advanced topics",
          "Only reading about it"
        ],
        correct: 0
      },
      game: `/games/day${day}.html`
    };
    return content;
  }, [getDayTitle]);

  const loadDefaultPlan = useCallback(() => {
    // Default 30-day plan structure
    const defaultPlan = {
      title: "Frontend Developer Learning Path",
      description: "A comprehensive 30-day plan to master frontend development",
      totalDays: 30,
      days: Array.from({ length: 30 }, (_, i) => {
        const dayNum = i + 1;
        const type = getDayType(dayNum);
        const content = getDayContent(dayNum);
        return {
          day: dayNum,
          title: `Day ${dayNum}: ${getDayTitle(dayNum)}`,
          type: type,
          content: content,
          duration: "5 minutes"
        };
      })
    };
    setLearningPlan(defaultPlan);
  }, [getDayTitle, getDayType, getDayContent]);

  useEffect(() => {
    // Get learning plan from localStorage or API
    const plan = JSON.parse(localStorage.getItem('learningPlan') || 'null');
    if (!plan) {
      // Load default plan
      loadDefaultPlan();
    } else {
      setLearningPlan(plan);
    }

    // Load completed days from localStorage
    const completed = JSON.parse(localStorage.getItem('completedDays') || '[]');
    setCompletedDays(new Set(completed));
  }, [loadDefaultPlan]);

  const markDayComplete = (day) => {
    const newCompleted = new Set([...completedDays, day]);
    setCompletedDays(newCompleted);
    localStorage.setItem('completedDays', JSON.stringify([...newCompleted]));
  };

  const renderContent = (lesson) => {
    if (!lesson || !lesson.content) {
      return <div>Content not available</div>;
    }

    switch (lesson.type) {
      case 'reading':
        return (
          <div className="bg-white p-6 rounded-lg">
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown>{lesson.content.reading || ''}</ReactMarkdown>
            </div>
            <button
              onClick={() => markDayComplete(lesson.day)}
              className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Mark as Complete ✓
            </button>
          </div>
        );

      case 'video':
        return (
          <div className="bg-white p-6 rounded-lg">
            <div className="bg-gray-100 p-8 rounded-lg text-center">
              <div className="text-6xl mb-4">🎥</div>
              <h3 className="text-xl font-semibold mb-2">Video: {lesson.title}</h3>
              <p className="text-gray-600 mb-4">
                Video content for {lesson.title.split(': ')[1]} would be displayed here.
              </p>
              <div className="bg-gray-200 p-4 rounded">
                <p className="text-sm text-gray-700">
                  📹 In a real implementation, this would show:
                  <br />
                  <code>{lesson.content.video || ''}</code>
                </p>
              </div>
            </div>
            <button
              onClick={() => markDayComplete(lesson.day)}
              className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Mark as Complete ✓
            </button>
          </div>
        );

      case 'quiz':
        return <QuizComponent lesson={lesson} onComplete={() => markDayComplete(lesson.day)} />;

      case 'game':
        return (
          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Interactive Game: {lesson.title.split(': ')[1]}</h3>
            <div className="border-2 border-gray-200 rounded-lg">
              <iframe
                src={lesson.content.game || ''}
                className="w-full h-96 rounded-lg"
                title={`Game for ${lesson.title}`}
              />
            </div>
            <button
              onClick={() => markDayComplete(lesson.day)}
              className="mt-6 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Mark as Complete ✓
            </button>
          </div>
        );

      default:
        return <div>Content not available</div>;
    }
  };

  if (!learningPlan) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const currentLesson = learningPlan.plan.find(d => d.day === currentDay);
  const progress = (completedDays.size / learningPlan.totalDays) * 100;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{learningPlan.title}</h1>
        <p className="text-gray-600 mb-4">{learningPlan.description}</p>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress: {completedDays.size}/{learningPlan.totalDays} days</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-primary-600 to-green-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Day Selector */}
        <div className="lg:col-span-1">
          <h3 className="font-semibold text-gray-900 mb-4">30-Day Plan</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {learningPlan.plan.map((day) => (
              <button
                key={day.day}
                onClick={() => setCurrentDay(day.day)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  currentDay === day.day
                    ? 'bg-primary-600 text-white'
                    : completedDays.has(day.day)
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Day {day.day}</span>
                  {completedDays.has(day.day) && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-sm opacity-75">{day.title.split(': ')[1]}</p>
                <p className="text-xs opacity-60 capitalize">{day.type}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {currentLesson && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentLesson.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Duration: {currentLesson.duration}</span>
                  <span className="capitalize bg-gray-100 px-2 py-1 rounded">
                    {currentLesson.type}
                  </span>
                  {completedDays.has(currentLesson.day) && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      ✓ Completed
                    </span>
                  )}
                </div>
              </div>
              
              {renderContent(currentLesson)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Quiz Component
const QuizComponent = ({ lesson, onComplete }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = () => {
    setShowResult(true);
    if (selectedAnswer === lesson.content.quiz.correct) {
      setTimeout(() => onComplete(), 1500);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg">
      <h3 className="text-xl font-semibold mb-6">{lesson.content.quiz.question}</h3>
      <div className="space-y-3 mb-6">
        {lesson.content.quiz.options.map((option, index) => (
          <label key={index} className={`flex items-center cursor-pointer p-3 rounded-lg border-2 transition-colors ${
            selectedAnswer === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="radio"
              name="quiz"
              value={index}
              onChange={() => setSelectedAnswer(index)}
              className="mr-3 text-blue-600"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      
      {!showResult ? (
        <button
          onClick={handleSubmit}
          disabled={selectedAnswer === null}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          Submit Answer
        </button>
      ) : (
        <div className={`p-4 rounded-lg ${
          selectedAnswer === lesson.content.quiz.correct
            ? 'bg-green-100 text-green-800 border border-green-300'
            : 'bg-red-100 text-red-800 border border-red-300'
        }`}>
          {selectedAnswer === lesson.content.quiz.correct
            ? '🎉 Correct! Well done! This lesson will be marked as complete.'
            : '❌ Incorrect. The correct answer was: ' + lesson.content.quiz.options[lesson.content.quiz.correct]}
        </div>
      )}
    </div>
  );
};

export default Learn; 