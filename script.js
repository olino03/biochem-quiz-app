let questions = [];
let selectedQuestions = [];
let currentIndex = 0;
let userAnswers = [];
const TIME_LIMIT = 2 * 60 * 60; // 2 hours in seconds
let timerInterval;
let quizMode = 'test'; // 'test' or 'training'
let feedbackGiven = false; // Used in training mode

// --- UI Element References ---
const landingPage = document.getElementById('landing-page');
const quizContainer = document.getElementById('quiz-container');
const summaryScreen = document.getElementById('summary-screen');
const startTrainingButton = document.getElementById('startTrainingButton');
const startTestButton = document.getElementById('startTestButton');
const darkModeToggle = document.getElementById('darkModeToggle');
const averageSuccessRateDisplay = document.getElementById('average-success-rate');
const timerDiv = document.getElementById("timer");
const questionNumberDiv = document.getElementById("question-number");
const questionTextDiv = document.getElementById("question-text");
const optionsDiv = document.getElementById("options");
const feedbackDiv = document.getElementById("feedback");
const nextButton = document.getElementById('next-button');
const homeButton = document.getElementById('homeButton');
const backToHomeButton = document.getElementById('back-to-home');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('darkMode') === 'enabled') {
    document.documentElement.classList.add('dark');
  }
  darkModeToggle.addEventListener('click', toggleDarkMode);
  
  startTrainingButton.addEventListener('click', () => {
    quizMode = 'training';
    startQuiz();
  });
  
  startTestButton.addEventListener('click', () => {
    quizMode = 'test';
    startQuiz();
  });
  
  homeButton.addEventListener('click', displayLandingPage);

  backToHomeButton.addEventListener('click', () => {
    summaryScreen.classList.add('hidden');
    displayLandingPage();
  });

  loadQuestions().then(() => {
    displayLandingPage();
    calculateAndDisplaySuccessRate();
  });
});

// --- Dark Mode ---
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('darkMode', document.documentElement.classList.contains('dark') ? 'enabled' : 'disabled');
}

// --- Quiz Flow ---
async function loadQuestions() {
  try {
    const response = await fetch("questions.json");
    questions = (await response.json()).questions;
  } catch (error) {
    console.error("Error loading questions:", error);
  }
}

function shuffle(arr) {
  let currentIndex = arr.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]];
  }
  return arr;
}

function displayLandingPage() {
  // Stop any active timers when returning to the landing page
  clearInterval(timerInterval);
  
  landingPage.classList.remove('hidden');
  quizContainer.classList.add('hidden');
  summaryScreen.classList.add('hidden');
  calculateAndDisplaySuccessRate();
}

function startQuiz() {
  // Load questions based on the selected mode
  if (quizMode === 'training') {
    // For training mode, shuffle and use all available questions
    selectedQuestions = shuffle(questions);
  } else {
    // For test mode, shuffle and use a random subset of 60 questions
    selectedQuestions = shuffle(questions).slice(0, 60);
  }

  userAnswers = Array(selectedQuestions.length).fill(null);
  currentIndex = 0;
  feedbackGiven = false;
  
  landingPage.classList.add('hidden');
  quizContainer.classList.remove('hidden');

  if (quizMode === 'test') {
    timerDiv.classList.remove('hidden');
    startTimer(TIME_LIMIT);
  } else {
    timerDiv.classList.add('hidden');
  }
  
  renderQuestion();
}

function renderQuestion() {
  feedbackGiven = false;
  const question = selectedQuestions[currentIndex];
  const isLastQuestion = currentIndex === selectedQuestions.length - 1;

  nextButton.innerText = isLastQuestion ? 'Finish' : 'Next';
  questionNumberDiv.innerText = `Question ${currentIndex + 1} of ${selectedQuestions.length}`;
  questionTextDiv.innerText = question.text;
  feedbackDiv.innerText = "";
  
  optionsDiv.innerHTML = "";
  question.options.forEach((option, idx) => {
    const btn = document.createElement("button");
    btn.innerHTML = option;
    btn.className = "w-full py-3 px-4 rounded-lg text-left text-lg font-medium shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 ease-in-out bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200";
    btn.onclick = () => selectAnswer(idx, btn);
    
    if (quizMode === 'test' && userAnswers[currentIndex] === idx) {
        btn.classList.add('selected-answer');
    }
    optionsDiv.appendChild(btn);
  });
}

function selectAnswer(choice) {
  if (quizMode === 'training' && feedbackGiven) return;

  userAnswers[currentIndex] = choice;
  
  const optionButtons = optionsDiv.querySelectorAll('button');
  optionButtons.forEach(btn => btn.classList.remove('selected-answer'));
  optionButtons[choice].classList.add('selected-answer');
}

function prevQuestion() {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
  }
}

function nextQuestion() {
  // If in training mode and feedback has been shown, just move to the next question
  if (quizMode === 'training' && feedbackGiven) {
    if (currentIndex < selectedQuestions.length - 1) {
      currentIndex++;
      renderQuestion();
    } else {
      displayLandingPage(); // End of training, go home
    }
    return;
  }

  // Logic for Training Mode: show feedback now
  if (quizMode === 'training') {
    const question = selectedQuestions[currentIndex];
    const choice = userAnswers[currentIndex];
    
    if (choice === null) {
      alert("Please select an answer before proceeding.");
      return;
    }

    const optionButtons = optionsDiv.querySelectorAll('button');
    optionButtons.forEach(btn => btn.disabled = true);
    
    // Show correct answer
    optionButtons[question.correct].classList.add('correct-answer');
    
    // Show incorrect answer if user was wrong
    if (choice !== question.correct) {
      optionButtons[choice].classList.remove('selected-answer');
      optionButtons[choice].classList.add('incorrect-answer');
      feedbackDiv.innerText = `Greșit. Răspuns corect: ${question.options[question.correct]}`;
      feedbackDiv.className = 'mt-6 text-lg font-bold text-center text-red-600 dark:text-red-400';
    } else {
      feedbackDiv.innerText = "Corect!";
      feedbackDiv.className = 'mt-6 text-lg font-bold text-center text-green-600 dark:text-green-400';
    }
    
    feedbackGiven = true;
    nextButton.innerText = (currentIndex === selectedQuestions.length - 1) ? 'Finish Training' : 'Continue';
    return;
  }

  // Logic for Test Mode
  if (currentIndex < selectedQuestions.length - 1) {
    currentIndex++;
    renderQuestion();
  } else {
    endQuiz();
  }
}

// --- Timer ---
function startTimer(seconds) {
  clearInterval(timerInterval);
  let remainingSeconds = seconds;
  timerDiv.innerText = `Time left: 02:00:00`;
  timerInterval = setInterval(() => {
    remainingSeconds--;
    let hrs = Math.floor(remainingSeconds / 3600);
    let mins = Math.floor((remainingSeconds % 3600) / 60);
    let secs = remainingSeconds % 60;
    timerDiv.innerText = `Time left: ${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    if (remainingSeconds <= 0) {
      endQuiz();
    }
  }, 1000);
}

function endQuiz() {
  clearInterval(timerInterval);
  if (quizMode === 'test') {
    const { score, totalQuestions } = calculateScore();
    saveQuizResult(score, totalQuestions);
    showSummary(score, totalQuestions);
  } else {
    displayLandingPage();
  }
}

function showSummary(score, totalQuestions) {
    quizContainer.classList.add('hidden');
    summaryScreen.classList.remove('hidden');
    const summaryScoreEl = document.getElementById('summary-score');
    const summaryDetailsEl = document.getElementById('summary-details');

    summaryScoreEl.innerText = `Your Score: ${score} out of ${totalQuestions} (${((score / totalQuestions) * 100).toFixed(2)}%)`;
    summaryDetailsEl.innerHTML = '';

    selectedQuestions.forEach((q, index) => {
        const userAnswerIndex = userAnswers[index];
        const isCorrect = userAnswerIndex === q.correct;
        const container = document.createElement('div');
        container.className = `p-4 rounded-lg ${isCorrect ? 'summary-correct' : 'summary-incorrect'}`;
        container.innerHTML = `
            <p class="font-bold">${index + 1}. ${q.text}</p>
            <p class="mt-2">Your answer: <span class="font-semibold">${userAnswerIndex !== null ? q.options[userAnswerIndex] : 'No answer'}</span></p>
            ${!isCorrect ? `<p>Correct answer: <span class="font-semibold">${q.options[q.correct]}</span></p>` : ''}
        `;
        summaryDetailsEl.appendChild(container);
    });
}

// --- Scoring and Storage ---
function calculateScore() {
  let score = 0;
  for (let i = 0; i < selectedQuestions.length; i++) {
    if (userAnswers[i] === selectedQuestions[i].correct) {
      score++;
    }
  }
  return { score: score, totalQuestions: selectedQuestions.length };
}

function saveQuizResult(score, totalQuestions) {
  let quizResults = JSON.parse(localStorage.getItem('quizResults')) || [];
  quizResults.push({
    timestamp: new Date().toISOString(),
    score: score,
    totalQuestions: totalQuestions,
  });
  localStorage.setItem('quizResults', JSON.stringify(quizResults));
}

function calculateAndDisplaySuccessRate() {
  let quizResults = JSON.parse(localStorage.getItem('quizResults')) || [];
  if (quizResults.length === 0) {
    averageSuccessRateDisplay.innerText = "N/A";
    return;
  }
  let totalCorrect = 0;
  let totalAttempted = 0;
  quizResults.forEach(r => {
    totalCorrect += r.score;
    totalAttempted += r.totalQuestions;
  });
  averageSuccessRateDisplay.innerText = totalAttempted > 0 ? `${((totalCorrect / totalAttempted) * 100).toFixed(2)}%` : "N/A";
}