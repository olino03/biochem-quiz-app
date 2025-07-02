let questions = [];
let selectedQuestions = [];
let currentIndex = 0;
let userAnswers = [];
let quizStartTime = 0; // Pentru a stoca ora de începere a testului
const TIME_LIMIT = 2 * 60 * 60; // 2 ore în secunde
let timerInterval; // Pentru a stoca ID-ul intervalului pentru cronometru

// --- Referințe elemente UI ---
const landingPage = document.getElementById('landing-page');
const quizContainer = document.getElementById('quiz-container');
const startQuizButton = document.getElementById('startQuizButton');
const darkModeToggle = document.getElementById('darkModeToggle');
const averageSuccessRateDisplay = document.getElementById('average-success-rate');
const timerDiv = document.getElementById("timer");
const questionNumberDiv = document.getElementById("question-number");
const questionTextDiv = document.getElementById("question-text");
const optionsDiv = document.getElementById("options");
const feedbackDiv = document.getElementById("feedback");

// --- Inițializare ---
document.addEventListener('DOMContentLoaded', () => {
  // Verifică preferința modului întunecat în stocarea locală
  if (localStorage.getItem('darkMode') === 'enabled') {
    document.documentElement.classList.add('dark');
  }

  // Listener de evenimente pentru butonul de comutare mod întunecat
  darkModeToggle.addEventListener('click', toggleDarkMode);

  // Listener de evenimente pentru butonul de pornire test
  startQuizButton.addEventListener('click', startQuiz);

  // Încarcă întrebările și afișează pagina de destinație
  loadQuestions().then(() => {
    displayLandingPage();
    calculateAndDisplaySuccessRate();
  });
});

// --- Funcționalitate mod întunecat ---
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  if (document.documentElement.classList.contains('dark')) {
    localStorage.setItem('darkMode', 'enabled');
  } else {
    localStorage.setItem('darkMode', 'disabled');
  }
}

// --- Control flux test ---
async function loadQuestions() {
  try {
    const response = await fetch("questions.json");
    const data = await response.json();
    questions = data.questions;

    // Amestecă și alege 60 de întrebări
    selectedQuestions = shuffle(questions).slice(0, 60);
    userAnswers = Array(selectedQuestions.length).fill(null); // Inițializează răspunsurile utilizatorului pentru întrebările selectate
  } catch (error) {
    console.error("Eroare la încărcarea întrebărilor:", error);
    // Afișează un mesaj de eroare utilizatorului sau gestionează-l elegant
    alert("Nu s-au putut încărca întrebările testului. Vă rugăm să încercați din nou mai târziu.");
  }
}

function shuffle(arr) {
  // Algoritmul de amestecare Fisher-Yates (Knuth)
  let currentIndex = arr.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]];
  }
  return arr;
}

function displayLandingPage() {
  landingPage.classList.remove('hidden');
  quizContainer.classList.add('hidden');
}

function startQuiz() {
  landingPage.classList.add('hidden');
  quizContainer.classList.remove('hidden');
  currentIndex = 0; // Resetează indexul întrebării curente
  userAnswers = Array(selectedQuestions.length).fill(null); // Resetează răspunsurile utilizatorului pentru un nou test
  renderQuestion();
  quizStartTime = Date.now(); // Înregistrează ora de începere a testului
  startTimer(TIME_LIMIT);
}

function renderQuestion() {
  const question = selectedQuestions[currentIndex];
  questionNumberDiv.innerText = `Întrebarea ${currentIndex + 1} din ${selectedQuestions.length}`;
  questionTextDiv.innerText = question.text;

  // Adaugă clase pentru efectul de fade-in
  questionTextDiv.classList.add('opacity-0', 'translate-y-2'); // Începe invizibil și ușor în jos
  optionsDiv.classList.add('opacity-0', 'translate-y-2');

  // Forțează reflow pentru a asigura rularea tranziției
  void questionTextDiv.offsetWidth;
  void optionsDiv.offsetWidth;

  // Elimină clasele pentru a declanșa tranziția
  questionTextDiv.classList.remove('opacity-0', 'translate-y-2');
  optionsDiv.classList.remove('opacity-0', 'translate-y-2');

  optionsDiv.innerHTML = ""; // Golește opțiunile anterioare

  question.options.forEach((option, idx) => {
    const btn = document.createElement("button");
    btn.innerText = option;
    btn.className = "w-full py-3 px-4 rounded-lg text-left text-lg font-medium shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200 ease-in-out " +
                    "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200";
    btn.onclick = () => selectAnswer(idx);

    // Aplică stiluri bazate pe răspunsul utilizatorului
    if (userAnswers[currentIndex] !== null) {
      btn.disabled = true; // Dezactivează butoanele odată ce un răspuns este selectat pentru întrebare

      if (idx === question.correct) {
        btn.classList.add('correct-answer'); // Verde pentru răspuns corect
      } else if (idx === userAnswers[currentIndex]) {
        btn.classList.add('incorrect-answer'); // Roșu pentru răspunsul incorect al utilizatorului
      }
    }
    optionsDiv.appendChild(btn);
  });

  // Afișează feedback-ul
  if (userAnswers[currentIndex] !== null) {
    feedbackDiv.innerText =
      userAnswers[currentIndex] === question.correct
        ? "Corect!"
        : `Greșit. Răspuns corect: ${question.options[question.correct]}`;
    feedbackDiv.classList.remove('text-green-600', 'text-red-600');
    feedbackDiv.classList.add(userAnswers[currentIndex] === question.correct ? 'text-green-600' : 'text-red-600');
  } else {
    feedbackDiv.innerText = "";
    feedbackDiv.classList.remove('text-green-600', 'text-red-600');
  }
}

function selectAnswer(choice) {
  // Permite selectarea unui răspuns doar dacă nu a fost ales deja unul pentru întrebarea curentă
  if (userAnswers[currentIndex] === null) {
    userAnswers[currentIndex] = choice;
    renderQuestion(); // Re-redă pentru a afișa feedback-ul și a dezactiva butoanele
    saveQuizResult(); // Salvează rezultatul după fiecare răspuns
  }
}

function prevQuestion() {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
  }
}

function nextQuestion() {
  if (currentIndex < selectedQuestions.length - 1) {
    currentIndex++;
    renderQuestion();
  } else {
    // Dacă este ultima întrebare și utilizatorul dă clic pe "Următorul", afișează rezultatele sau încheie testul
    endQuiz();
  }
}

// --- Funcționalitate cronometru ---
function startTimer(seconds) {
  clearInterval(timerInterval); // Golește orice cronometru existent
  let remainingSeconds = seconds;

  timerInterval = setInterval(() => {
    let hrs = Math.floor(remainingSeconds / 3600);
    let mins = Math.floor((remainingSeconds % 3600) / 60);
    let secs = remainingSeconds % 60;

    timerDiv.innerText = `Timp rămas: ${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      timerDiv.innerText = "Timpul a expirat!";
      endQuiz("Timpul a expirat! Testul s-a încheiat.");
    }
    remainingSeconds--;
  }, 1000);
}

function endQuiz(message = "Test finalizat!") {
  clearInterval(timerInterval); // Oprește cronometrul
  // Opțional, afișează un rezumat sau navighează înapoi la pagina de destinație
  alert(message + "\nScorul tău: " + calculateScore() + " din " + selectedQuestions.length);
  displayLandingPage();
  calculateAndDisplaySuccessRate(); // Actualizează rata de succes pe pagina de destinație
}

// --- Calcul scor și rată de succes ---
function calculateScore() {
  let score = 0;
  for (let i = 0; i < selectedQuestions.length; i++) {
    if (userAnswers[i] !== null && userAnswers[i] === selectedQuestions[i].correct) {
      score++;
    }
  }
  return score;
}

function saveQuizResult() {
  const score = calculateScore();
  const totalQuestions = selectedQuestions.length;
  const isCompleted = userAnswers.every(answer => answer !== null); // Verifică dacă toate întrebările au fost răspuns

  let quizResults = JSON.parse(localStorage.getItem('quizResults')) || [];

  // Găsește dacă există un rezultat de test în desfășurare pentru sesiunea curentă
  let currentQuizResultIndex = quizResults.findIndex(result => result.startTime === quizStartTime);

  if (currentQuizResultIndex === -1) {
    // Dacă nu există un test în desfășurare, adaugă unul nou
    quizResults.push({
      startTime: quizStartTime,
      score: score,
      totalQuestions: totalQuestions,
      completed: isCompleted,
      answers: userAnswers // Salvează răspunsurile curente pentru o posibilă revizuire
    });
  } else {
    // Actualizează testul existent în desfășurare
    quizResults[currentQuizResultIndex].score = score;
    quizResults[currentQuizResultIndex].completed = isCompleted;
    quizResults[currentQuizResultIndex].answers = userAnswers;
  }

  localStorage.setItem('quizResults', JSON.stringify(quizResults));
}

function calculateAndDisplaySuccessRate() {
  let quizResults = JSON.parse(localStorage.getItem('quizResults')) || [];

  if (quizResults.length === 0) {
    averageSuccessRateDisplay.innerText = "--%";
    return;
  }

  let totalCorrectAnswers = 0;
  let totalAttemptedQuestions = 0;

  quizResults.forEach(result => {
    // Consideră doar testele finalizate pentru rata medie de succes
    if (result.completed) {
      totalCorrectAnswers += result.score;
      totalAttemptedQuestions += result.totalQuestions;
    }
  });

  if (totalAttemptedQuestions > 0) {
    const successRate = (totalCorrectAnswers / totalAttemptedQuestions) * 100;
    averageSuccessRateDisplay.innerText = `${successRate.toFixed(2)}%`;
  } else {
    averageSuccessRateDisplay.innerText = "--%";
  }
}

// Suprascrie alert-ul implicit pentru a utiliza un modal personalizat pentru o experiență de utilizare mai bună
window.alert = function(message) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl text-center max-w-sm w-full">
      <p class="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100">${message}</p>
      <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
        OK
      </button>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('button').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
};
