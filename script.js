let questions = [];
let selectedQuestions = [];
let currentIndex = 0;
let userAnswers = [];
const TIME_LIMIT = 2 * 60 * 60; // 2 hours in seconds

async function loadQuestions() {
  const response = await fetch("questions.json");
  const data = await response.json();
  questions = data.questions;

  // Shuffle and pick 60
  selectedQuestions = shuffle(questions).slice(0, 60);
  userAnswers = Array(selectedQuestions.length).fill(null);
  renderQuestion();
  startTimer(TIME_LIMIT);
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function renderQuestion() {
  const question = selectedQuestions[currentIndex];
  document.getElementById("question-number").innerText =
    `Question ${currentIndex + 1} of ${selectedQuestions.length}`;
  document.getElementById("question-text").innerText = question.text;

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  question.options.forEach((option, idx) => {
    const btn = document.createElement("button");
    btn.innerText = option;
    btn.onclick = () => selectAnswer(idx);
    if (userAnswers[currentIndex] !== null) {
      btn.disabled = true;
      if (idx === question.correct) btn.style.backgroundColor = "#a0e7a0";
      if (idx === userAnswers[currentIndex] && idx !== question.correct)
        btn.style.backgroundColor = "#f99";
    }
    optionsDiv.appendChild(btn);
  });

  const feedbackDiv = document.getElementById("feedback");
  if (userAnswers[currentIndex] !== null) {
    feedbackDiv.innerText =
      userAnswers[currentIndex] === question.correct
        ? "Correct!"
        : `Wrong. Correct answer: ${question.options[question.correct]}`;
  } else {
    feedbackDiv.innerText = "";
  }
}

function selectAnswer(choice) {
  if (userAnswers[currentIndex] === null) {
    userAnswers[currentIndex] = choice;
    renderQuestion();
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
  }
}

function startTimer(seconds) {
  const timerDiv = document.getElementById("timer");
  const interval = setInterval(() => {
    let hrs = Math.floor(seconds / 3600);
    let mins = Math.floor((seconds % 3600) / 60);
    let secs = seconds % 60;

    timerDiv.innerText = `Time left: ${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    if (seconds-- <= 0) {
      clearInterval(interval);
      timerDiv.innerText = "Time's up!";
      alert("Time's up! The quiz is over.");
      document.querySelectorAll("#options button").forEach(btn => btn.disabled = true);
    }
  }, 1000);
}

loadQuestions();
