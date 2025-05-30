let allQuestions = [];
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let selectedAnswer = null;
let isAnswered = false;

let participantData = {};
let quizResults = [];
let sessionId = '';

const numberOfQuestions = 1;
const needToValidate = false;
const GOOGLE_SCRIPT_URL = 'TUTAJ_WSTAW_URL_DO_GOOGLE_APPS_SCRIPT';

function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

document.addEventListener('DOMContentLoaded', function() {
    sessionId = generateSessionId();
    loadQuestions();
    setupFormValidation();
});

async function loadQuestions() {
    try {
        document.getElementById('loadingMessage').style.display = 'block';
        document.getElementById('startContent').style.display = 'none';
        document.getElementById('errorMessage').style.display = 'none';

        let response;
        try {
            response = await fetch('data/quiz_data.json');
        } catch (e) {
            response = null;
        }

        if (response && response.ok) {
            allQuestions = await response.json();
        } else {
            alert(`Błąd ładowania pytań: ${response ? response.statusText : 'Nie można połączyć się z serwerem'}`);
            throw new Error('Nie można załadować pliku z pytaniami. Spróbuj ponownie później.');
        }

        if (allQuestions && allQuestions.length > 0) {
            document.getElementById('loadingMessage').style.display = 'none';
            document.getElementById('startContent').style.display = 'block';
            document.getElementById('questionsCount').textContent =
                `Liczba dostępnych pytań w bazie: ${allQuestions.length}`;
        } else {
            throw new Error('Nie znaleziono pytań w pliku');
        }

    } catch (error) {
        console.error('Błąd ładowania pytań:', error);
        document.getElementById('loadingMessage').style.display = 'none';
        document.getElementById('errorMessage').style.display = 'block';
    }
}

function setupFormValidation() {
    const form = document.getElementById('demographicsForm');
    const startButton = document.getElementById('startButton');
    const requiredFields = ['birthYear', 'gender', 'education', 'consent'];

    function validateForm() {
        if (!needToValidate) {
            startButton.disabled = false;
            return;
        }

        const isValid = requiredFields.every(fieldId => {
            const field = document.getElementById(fieldId);
            if (field.type === 'checkbox') {
                return field.checked;
            }
            return field.value !== '';
        });

        startButton.disabled = !isValid;
        startButton.disabled = false;
    }

    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        field.addEventListener('change', validateForm);
    });
}

function goToMetric() {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('formScreen').style.display = 'block';
}

function startQuiz() {
    if (allQuestions.length < numberOfQuestions) {
        alert(`Dostępnych jest tylko ${allQuestions.length} pytań. Potrzeba minimum ${numberOfQuestions} do przeprowadzenia badania.`);
        return;
    }

    collectDemographics();

    currentQuestions = shuffleArray([...allQuestions]).slice(0, numberOfQuestions);
    currentQuestionIndex = 0;
    score = 0;
    quizResults = [];

    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('formScreen').style.display = 'none';
    document.getElementById('quizScreen').style.display = 'block';

    displayQuestion();
}

function collectDemographics() {
    const birthYear = parseInt(document.getElementById('birthYear').value);
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    participantData = {
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
        birthYear: birthYear,
        age: age,
        gender: document.getElementById('gender').value,
        education: document.getElementById('education').value,
        consent: document.getElementById('consent').checked
    };
}

function displayQuestion() {
    const question = currentQuestions[currentQuestionIndex];

    document.getElementById('questionCounter').textContent =
        `Pytanie ${currentQuestionIndex + 1} z ${currentQuestions.length}`;
    document.getElementById('progressBar').style.width =
        `${((currentQuestionIndex + 1) / numberOfQuestions) * 100}%`;

    document.getElementById('questionText').textContent = question.Question;

    const imageContainer = document.getElementById('questionImage');
    if (question.Image && question.Image.trim() !== '') {
        imageContainer.innerHTML = `<img src="${question.Image}" alt="Mapa do pytania" onerror="this.style.display='none'">`;
    } else {
        imageContainer.innerHTML = '';
    }

    const answersContainer = document.getElementById('answers');
    answersContainer.innerHTML = `
        <div class="answer" onclick="selectAnswer('A')" id="answerA">
            <strong>Odpowiedź A:</strong> ${question.A}
        </div>
        <div class="answer" onclick="selectAnswer('B')" id="answerB">
            <strong>Odpowiedź B:</strong> ${question.B}
        </div>
    `;

    selectedAnswer = null;
    isAnswered = false;
    document.getElementById('nextBtn').classList.remove('active');
}

function selectAnswer(answer) {
    if (isAnswered) return;

    selectedAnswer = answer;
    const question = currentQuestions[currentQuestionIndex];
    const correctAnswer = question.Human;
    const isCorrect = (answer === correctAnswer);

    const answerData = {
        questionId: question.ID,
        questionText: question.Question,
        selectedAnswer: answer,
        correctAnswer: correctAnswer,
        isCorrect: isCorrect,
        answerA: question.A,
        answerB: question.B,
        questionIndex: currentQuestionIndex + 1,
        timestamp: new Date().toISOString()
    };

    quizResults.push(answerData);

    document.querySelectorAll('.answer').forEach(el => {
        el.classList.remove('selected', 'correct', 'incorrect');
    });

    document.getElementById(`answer${answer}`).classList.add('selected');

    setTimeout(() => {
        document.getElementById(`answer${correctAnswer}`).classList.add('correct');

        if (answer !== correctAnswer) {
            document.getElementById(`answer${answer}`).classList.add('incorrect');
        } else {
            score++;
        }

        isAnswered = true;
        document.getElementById('nextBtn').classList.add('active');
    }, 500);
}

function nextQuestion() {
    if (!isAnswered) return;

    currentQuestionIndex++;

    if (currentQuestionIndex < currentQuestions.length) {
        displayQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    const percentage = Math.round((score / numberOfQuestions) * 100);

    document.getElementById('quizScreen').style.display = 'none';
    document.getElementById('resultsScreen').style.display = 'block';

    document.getElementById('finalScore').textContent = `${score}/${numberOfQuestions}`;

    document.getElementById('scoreDetails').innerHTML = `
        <p>Poprawnie rozpoznanych odpowiedzi człowieka: <strong>${score}</strong></p>
        <p>Procent poprawnych odpowiedzi: <strong>${percentage}%</strong></p>
    `;

    saveResults();
}

function saveResults() {
    const fullResults = {
        participant: participantData,
        results: quizResults,
        summary: {
            totalQuestions: numberOfQuestions,
            correctAnswers: score,
            percentage: Math.round((score / numberOfQuestions) * 100),
            completedAt: new Date().toISOString()
        }
    };

    sendToGoogleSheets(fullResults);
}

// Wysyłanie do Google Sheets
async function sendToGoogleSheets(data) {
    const saveStatusDiv = document.getElementById('saveStatus');

    try {
        if (GOOGLE_SCRIPT_URL === 'TUTAJ_WSTAW_URL_DO_GOOGLE_APPS_SCRIPT') {
            console.log('Dane do zapisania:', data);
            saveStatusDiv.innerHTML = '<p>⚠️ Konfiguracja Google Sheets wymagana. Dane zapisane lokalnie.</p>';
            saveStatusDiv.className = 'save-status error';

            saveToLocalStorage(data);
            return;
        }

        saveStatusDiv.innerHTML = '<p>Wysyłanie danych...</p>';

        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        saveStatusDiv.innerHTML = '<p>✅ Dane zostały pomyślnie zapisane!</p>';
        saveStatusDiv.className = 'save-status success';

        console.log('Dane zapisane.');

    } catch (error) {
        console.error('Błąd wysyłania do Google Sheets:', error);
        saveStatusDiv.innerHTML = '<p>Błąd zapisywania. Dane zapisane lokalnie jako backup.</p>';
        saveStatusDiv.className = 'save-status error';

        saveToLocalStorage(data);
    }
}

function saveToLocalStorage(data) {
    try {
        const existingResults = JSON.parse(localStorage.getItem('aiHumanQuizResults') || '[]');
        existingResults.push(data);
        localStorage.setItem('aiHumanQuizResults', JSON.stringify(existingResults));
        console.log('Dane zapisane lokalnie jako backup');
    } catch (e) {
        console.error('Błąd zapisu lokalnego:', e);
    }
}

function exportLocalData() {
    const data = localStorage.getItem('aiHumanQuizResults');
    if (!data) {
        alert('Brak danych lokalnych');
        return;
    }

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz_results_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

window.exportQuizData = exportLocalData;

function restartQuiz() {
    document.getElementById('resultsScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'block';
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

document.addEventListener('keydown', function(event) {
    if (document.getElementById('quizScreen').style.display !== 'none') {
        if (event.key === 'a' || event.key === 'A') {
            selectAnswer('A');
        } else if (event.key === 'b' || event.key === 'B') {
            selectAnswer('B');
        } else if (event.key === 'Enter' || event.key === ' ') {
            nextQuestion();
        }
    }
});