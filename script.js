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
const prevButton = document.getElementById('prev-button');
const homeButton = document.getElementById('home-button');
const backToHomeButton = document.getElementById('back-to-home');

// Create slider element
const questionSlider = document.createElement('input');
questionSlider.type = 'range';
questionSlider.id = 'question-slider';
questionSlider.className = 'w-full';

const sliderContainer = document.createElement('div');
sliderContainer.id = 'slider-container';
sliderContainer.className = 'w-full mb-6 px-4';
sliderContainer.appendChild(questionSlider);

// Insert after timer in quiz container
timerDiv.insertAdjacentElement('afterend', sliderContainer);

// --- THEME TOGGLE ELEMENTS ---
const moonIcon = document.getElementById('moon-icon');
const sunIcon = document.getElementById('sun-icon');
const htmlElement = document.documentElement;

// --- Global Quiz State ---
let questions = [];
let selectedQuestions = [];
let currentIndex = 0;
let userAnswers = [];
const TIME_LIMIT = 1 * 60 * 60; // 2 hours in seconds
let timerInterval;
let quizMode = 'test'; // 'test' or 'training'
let feedbackGiven = false; // Used in training mode

// --- THEME MANAGEMENT ---
function updateThemeVisuals() {
  const isDarkMode = htmlElement.classList.contains('dark');
  if (isDarkMode) {
    moonIcon.classList.add('hidden');
    sunIcon.classList.remove('hidden');
  } else {
    moonIcon.classList.remove('hidden');
    sunIcon.classList.add('hidden');
  }
}

function toggleDarkMode() {
  htmlElement.classList.toggle('dark');
  localStorage.setItem('darkMode', htmlElement.classList.contains('dark') ? 'enabled' : 'disabled');
  updateThemeVisuals();
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  // Set initial theme based on localStorage
  if (localStorage.getItem('darkMode') === 'enabled') {
    htmlElement.classList.add('dark');
  }
  updateThemeVisuals();

  // Attach event listeners
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
    const passFailCard = document.getElementById('pass-fail-card');
    if (passFailCard) {
      passFailCard.classList.add('hidden');
      passFailCard.innerText = '';
    }
    displayLandingPage();
  });
  prevButton.addEventListener('click', prevQuestion);
  
  // Add slider event listener
  questionSlider.addEventListener('input', function() {
    currentIndex = parseInt(this.value);
    renderQuestion();
  });

  // Load quiz questions
  loadQuestions().then(() => {
    displayLandingPage();
    calculateAndDisplaySuccessRate();
  });
});

// --- Quiz Flow Functions ---
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
  clearInterval(timerInterval);
  landingPage.classList.remove('hidden');
  quizContainer.classList.add('hidden');
  summaryScreen.classList.add('hidden');
  calculateAndDisplaySuccessRate();
}

function startQuiz() {
  if (questions.length === 0) {
    alert("Failed to load questions. Please check the console for errors.");
    return;
  }

  if (quizMode === 'training') {
    selectedQuestions = questions;
  } else {
    selectedQuestions = shuffle(questions).slice(0, 60);
  }

  userAnswers = Array(selectedQuestions.length).fill(null);
  currentIndex = 0;
  feedbackGiven = false;
  landingPage.classList.add('hidden');
  quizContainer.classList.remove('hidden');

  // Configure slider
  questionSlider.min = 0;
  questionSlider.max = selectedQuestions.length - 1;
  questionSlider.value = 0;

  if (quizMode === 'test') {
    timerDiv.classList.remove('hidden');
    homeButton.style.display = 'none';
    startTimer(TIME_LIMIT);
  } else {
    timerDiv.classList.add('hidden');
    homeButton.style.display = 'block';
  }
  renderQuestion();
}

function renderQuestion() {
  if (currentIndex >= selectedQuestions.length) {
    endQuiz();
    return;
  }

  feedbackGiven = false;
  const question = selectedQuestions[currentIndex];
  const isLastQuestion = currentIndex === selectedQuestions.length - 1;

  nextButton.innerText = isLastQuestion ? 'Finish' : 'Next';
  questionNumberDiv.innerText = `Întrebarea ${currentIndex + 1} din ${selectedQuestions.length}`;
  questionTextDiv.innerText = question.text;
  feedbackDiv.innerText = "";
  feedbackDiv.className = "mt-6 text-lg font-bold text-center";

  // Update slider position
  questionSlider.value = currentIndex;

  optionsDiv.innerHTML = "";
  question.options.forEach((option, idx) => {
    const btn = document.createElement("button");
    btn.innerHTML = option;
    btn.className = "w-full py-3 px-4 rounded-lg text-left text-lg font-medium shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 ease-in-out bg-gray-200 hover:bg-gray-300 dark:bg-dark-secondary dark:hover:bg-dark-accent text-gray-800 dark:text-gray-200";
    btn.onclick = () => selectAnswer(idx);

    if (quizMode === 'test' && userAnswers[currentIndex] === idx) {
      btn.classList.add('selected-answer');
    }
    
    // In training mode, show correct/incorrect if already answered
    if (quizMode === 'training' && userAnswers[currentIndex] !== null) {
      btn.disabled = true;
      if (idx === question.correct) {
        btn.classList.add('correct-answer');
      } else if (idx === userAnswers[currentIndex] && idx !== question.correct) {
        btn.classList.add('incorrect-answer');
      }
    }
    
    optionsDiv.appendChild(btn);
  });
  
  // Show feedback if already answered in training mode
  if (quizMode === 'training' && userAnswers[currentIndex] !== null) {
    const optionButtons = optionsDiv.querySelectorAll('button');
    optionButtons.forEach(btn => btn.disabled = true);
    optionButtons[question.correct].classList.add('correct-answer');
    if (userAnswers[currentIndex] !== question.correct) {
      optionButtons[userAnswers[currentIndex]].classList.add('incorrect-answer');
      feedbackDiv.innerText = `Greșit. Răspuns corect: ${question.options[question.correct]}`;
      feedbackDiv.classList.add('text-red-600', 'dark:text-red-400');
    } else {
      feedbackDiv.innerText = "Corect!";
      feedbackDiv.classList.add('text-green-600', 'dark:text-green-400');
    }
    feedbackGiven = true;
    nextButton.innerText = (currentIndex === selectedQuestions.length - 1) ? 'Finish Training' : 'Continue';
  }
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
  if (quizMode === 'training' && feedbackGiven) {
    if (currentIndex < selectedQuestions.length - 1) {
      currentIndex++;
      renderQuestion();
    } else {
      displayLandingPage();
    }
    return;
  }

  if (quizMode === 'training') {
    const question = selectedQuestions[currentIndex];
    const choice = userAnswers[currentIndex];
    if (choice === null) {
      alert("Vă rugăm să selectați un răspuns înainte de a continua.");
      return;
    }
    const optionButtons = optionsDiv.querySelectorAll('button');
    optionButtons.forEach(btn => btn.disabled = true);
    optionButtons[question.correct].classList.add('correct-answer');
    if (choice !== question.correct) {
      optionButtons[choice].classList.remove('selected-answer');
      optionButtons[choice].classList.add('incorrect-answer');
      feedbackDiv.innerText = `Greșit. Răspuns corect: ${question.options[question.correct]}`;
      feedbackDiv.classList.add('text-red-600', 'dark:text-red-400');
    } else {
      feedbackDiv.innerText = "Corect!";
      feedbackDiv.classList.add('text-green-600', 'dark:text-green-400');
    }
    feedbackGiven = true;
    nextButton.innerText = (currentIndex === selectedQuestions.length - 1) ? 'Finish Training' : 'Continue';
    return;
  }

  if (currentIndex < selectedQuestions.length - 1) {
    currentIndex++;
    renderQuestion();
  } else {
    endQuiz();
  }
}

function startTimer(seconds) {
  clearInterval(timerInterval);
  let remainingSeconds = seconds;
  updateTimerDisplay(remainingSeconds);

  timerInterval = setInterval(() => {
    remainingSeconds--;
    updateTimerDisplay(remainingSeconds);

    if (remainingSeconds <= 0) {
      endQuiz();
    }
  }, 1000);
}

function updateTimerDisplay(seconds) {
  const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  timerDiv.innerText = `Timp rămas: ${hrs}:${mins}:${secs}`;
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
  const passFailCard = document.getElementById('pass-fail-card');

  const percentage = (score / totalQuestions) * 100;
  const roundedPercentage = percentage.toFixed(2);

  summaryScoreEl.innerText = `Scorul tău: ${score} din ${totalQuestions} (${roundedPercentage}%)`;

  // Configure Pass/Fail Card
  passFailCard.classList.remove('hidden');
  passFailCard.innerText = percentage >= 60 ? `You passed (${roundedPercentage}%)` : `You failed (${roundedPercentage}%)`;
  passFailCard.className = `text-center text-xl font-bold rounded-lg p-4 my-4 ${percentage >= 60
      ? 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200'
    }`;

  summaryDetailsEl.innerHTML = '';

  selectedQuestions.forEach((q, index) => {
    const userAnswerIndex = userAnswers[index];
    const isCorrect = userAnswerIndex === q.correct;
    const container = document.createElement('div');
    container.className = `p-4 rounded-lg ${isCorrect ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`;
    container.innerHTML = `
      <p class="font-bold">${index + 1}. ${q.text}</p>
      <p class="mt-2">Răspunsul tău: <span class="font-semibold">${userAnswerIndex !== null ? q.options[userAnswerIndex] : 'Niciun răspuns'}</span></p>
      ${!isCorrect ? `<p>Răspuns corect: <span class="font-semibold">${q.options[q.correct]}</span></p>` : ''}
    `;
    summaryDetailsEl.appendChild(container);
  });
}

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