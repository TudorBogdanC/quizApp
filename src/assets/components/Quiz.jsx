import React, { useState, useEffect } from 'react';
import axios from 'axios';
import he from 'he';
import { Button } from '@material-tailwind/react';

const Quiz = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(15);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [quizStarted, setQuizStarted] = useState(false);
  const [userAnswer, setUserAnswer] = useState(null);

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const formatQuestions = (data) => {
    return data.map((question) => {
      const incorrectOptions = question.incorrect_answers.map((answer) => he.decode(answer));
      const correctOption = he.decode(question.correct_answer);

      // Shuffle options, then ensure only 3 incorrect options
      const shuffledOptions = shuffleArray([...incorrectOptions, correctOption]).slice(0, 4);

      return {
        ...question,
        question: he.decode(question.question),
        correct_answer: correctOption,
        options: shuffledOptions,
      };
    });
  };

  const updateQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setTimer(15);
      setUserAnswer(null);
      setAnswerSubmitted(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleAnswer = (answerOption) => {
    if (answerSubmitted) {
      return;
    }

    setUserAnswer(answerOption);

    if (answerOption === questions[currentQuestion]?.correct_answer) {
      setScore(score + 1);
    }

    setAnswerSubmitted(true);

    // Display next question after 2 seconds
    setTimeout(() => {
      updateQuestion();
    }, 2000);
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        let apiUrl = 'https://opentdb.com/api.php?amount=10&category=15&type=multiple';

        if (selectedDifficulty) {
          apiUrl += `&difficulty=${selectedDifficulty}`;
        }

        const response = await axios.get(apiUrl);
        setQuestions(formatQuestions(response.data.results));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (quizStarted) {
      fetchData();
      setTimer(15);
      setAnswerSubmitted(false);
    }
  }, [selectedDifficulty, quizStarted]);

  useEffect(() => {
    if (timer === 0) {
      updateQuestion();
    }

    const interval = setInterval(() => {
      setTimer((prevTimer) => (prevTimer > 0 ? prevTimer - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [timer, currentQuestion]);

  const handleRetry = () => {
    setScore(0);
    setCurrentQuestion(0);
    setQuizCompleted(false);
    setAnswerSubmitted(false);
    setQuizStarted(false);
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
  };

  if (!quizStarted) {
    return (
      <div className="flex items-center justify-center min-h-screen mx-5">
        <div className="card p-4 shadow-md w-full md:max-w-lg bg-white rounded-xl card-container">
          <div className="mb-4">
            <label htmlFor="difficulty" className="block text-lg font-bold mb-2">
              Select Difficulty:
            </label>
            <select
              id="difficulty"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="p-2 border border-gray-300 rounded w-full"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <Button
            onClick={handleStartQuiz}
            className="p-2 bg-orange-500 text-white rounded w-full"
            disabled={!selectedDifficulty}
          >
            Start Quiz
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner-border text-orange-500" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div className="flex items-center justify-center min-h-screen mx-5">
        <div className="card p-4 shadow-md w-full md:max-w-lg bg-white rounded-xl">
          <h1 className="text-2xl md:text-3xl font-bold">Quiz Completed!</h1>
          <p className="text-lg md:text-xl">Your score: {score} / {questions.length}</p>
          <Button
            onClick={handleRetry}
            className="mt-4 p-2 bg-orange-500 text-white rounded w-full"
          >
            Retry Quiz
          </Button>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen mx-5">
        <div className="card p-4 shadow-md w-full md:max-w-lg bg-white rounded-xl">
          <div>No questions available.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen mx-5">
      <div className="card p-4 shadow-lg w-full md:max-w-lg bg-white rounded-xl">
        <h1 className="text-2xl md:text-3xl font-bold">Question {currentQuestion + 1}</h1>
        <p className="text-base md:text-lg">{questions[currentQuestion]?.question}</p>
        <div className="space-y-2 flex flex-col">
          {questions[currentQuestion]?.options.map((answerOption) => (
            <Button
              key={answerOption}
              onClick={() => handleAnswer(answerOption)}
              className={`p-1 ${(answerOption === userAnswer)
                  ? (answerOption === questions[currentQuestion]?.correct_answer)
                    ? 'bg-green-500 text-white' // Highlight correct answer when selected
                    : 'bg-red-500 text-white' // Highlight incorrect answer with red background when selected
                  : (answerOption === questions[currentQuestion]?.correct_answer && answerSubmitted)
                    ? 'bg-green-500 text-white' // Highlight correct answer without background when an answer is submitted
                    : 'bg-orange-500 text-white'
                } rounded w-full`}
              disabled={answerSubmitted}
            >
              {answerOption}
            </Button>
          ))}

        </div>

        <div className="mt-4">
          <p className="text-base md:text-lg">Time Remaining: {timer}s</p>
          <div className="h-2 mb-4 overflow-hidden bg-orange-200 rounded">
            <div
              style={{ width: `${(timer / 15) * 100}%` }}
              className="h-full bg-orange-500"
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;


















































