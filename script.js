// Globalne zmienne
let allQuestions = [];
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let selectedAnswer = null;
let isAnswered = false;

// Dane uczestnika i wyniki
let participantData = {};
let quizResults = [];
let sessionId = '';

// Generuj unikalny ID sesji
function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Załaduj pytania przy starcie
document.addEventListener('DOMContentLoaded', function() {
    sessionId = generateSessionId();
    loadQuestions();
    setupFormValidation();
});

// Funkcja ładowania pytań z pliku JSON
async function loadQuestions() {
    try {
        document.getElementById('loadingMessage').style.display = 'block';
        document.getElementById('startContent').style.display = 'none';
        document.getElementById('errorMessage').style.display = 'none';

        // Próba załadowania z pliku questions.json
        let response;
        try {
            response = await fetch('questions.json');
        } catch (e) {
            // Jeśli nie ma pliku, użyj przykładowych danych
            response = null;
        }

        if (response && response.ok) {
            allQuestions = await response.json();
        } else {
            // Przykładowe dane dla demonstracji
            allQuestions = [
                {
                    ID: 1,
                    Question: "Compare the value of the indicator presented on the map for Denmark and Slovenia. In which country is the value of the indicator lower and by how much?",
                    A: "Denmark has lower value by 2.5%",
                    I: "Slovenia has lower value by 1.8%",
                    Human: "A",
                    Image: ""
                },
                {
                    ID: 2,
                    Question: "Compare the value of the indicator presented on the map for Switzerland and Austria. In which country is the value of the indicator higher and by how much?",
                    A: "Switzerland higher by 3.2%",
                    I: "Austria higher by 2.1%",
                    Human: "B",
                    Image: ""
                },
                {
                    ID: 3,
                    Question: "What is the capital of France?",
                    A: "London",
                    I: "Paris",
                    Human: "B",
                    Image: ""
                },
                {
                    ID: 4,
                    Question: "Which planet is closest to the Sun?",
                    A: "Mercury",
                    I: "Venus",
                    Human: "A",
                    Image: ""
                },
                {
                    ID: 5,
                    Question: "What is 2 + 2?",
                    A: "4",
                    I: "5",
                    Human: "A",
                    Image: ""
                },
                {
                    ID: 6,
                    Question: "What is the largest ocean on Earth?",
                    A: "Atlantic Ocean",
                    I: "Pacific Ocean",
                    Human: "B",
                    Image: ""
                },
                {
                    ID: 7,
                    Question: "How many continents are there?",
                    A: "7",
                    I: "6",
                    Human: "A",
                    Image: ""
                },
                {
                    ID: 8,
                    Question: "What is the chemical symbol for gold?",
                    A: "Go",
                    I: "Au",
                    Human: "B",
                    Image: ""
                },
                {
                    ID: 9,
                    Question: "Which year did World War II end?",
                    A: "1945",
                    I: "1944",
                    Human: "A",
                    Image: ""
                },
                {
                    ID: 10,
                    Question: "What is the square root of 64?",
                    A: "8",
                    I: "6",
                    Human: "A",
                    Image: ""
                }
            ];

            console.log('Używam przykładowych danych - dodaj swój plik questions.json z danymi badawczymi');
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

// Walidacja formularza
function setupFormValidation() {
    const form = document.getElementById('demographicsForm');
    const startButton = document.getElementById('startButton');
    const requiredFields = ['birthYear', 'gender', 'education', 'consent'];

    function validateForm() {
        const isValid = requiredFields.every(fieldId => {
            const field = document.getElementById(fieldId);
            if (field.type === 'checkbox') {
                return field.checked;
            }
            return field.value !== '';
        });

        startButton.disabled = !isValid;
    }

    // Dodaj event listenery do wszystkich pól
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        field.addEventListener('change', validateForm);
    });
}

// Zbierz dane demograficzne
function collectDemographics() {
    const birthYear = parseInt(document.getElementById('birthYear').value);
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    participantData = {
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
        birthYear: birthYear,
        age: age, // Obliczony wiek dla analizy
        gender: document.getElementById('gender').value,
        education: document.getElementById('education').value,
        consent: document.getElementById('consent').checked
    };
}

function goToMetric() {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('formScreen').style.display = 'block';
}

// Rozpocznij quiz
function startQuiz() {
    if (allQuestions.length < 5) {
        alert(`Dostępnych jest tylko ${allQuestions.length} pytań. Potrzeba minimum 10 do przeprowadzenia badania.`);
        return;
    }

    // Zbierz dane demograficzne
    collectDemographics();

    // Wylosuj 10 pytań
    currentQuestions = shuffleArray([...allQuestions]).slice(0, 10);
    currentQuestionIndex = 0;
    score = 0;
    quizResults = []; // Reset wyników

    // Przełącz na ekran quizu
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('formScreen').style.display = 'none';
    document.getElementById('quizScreen').style.display = 'block';

    displayQuestion();
}

// Wyświetl aktualne pytanie
function displayQuestion() {
    const question = currentQuestions[currentQuestionIndex];

    // Aktualizuj licznik i pasek postępu
    document.getElementById('questionCounter').textContent =
        `Pytanie ${currentQuestionIndex + 1} z 10`;
    document.getElementById('progressBar').style.width =
        `${((currentQuestionIndex + 1) / 10) * 100}%`;

    // Wyświetl pytanie
    document.getElementById('questionText').textContent = question.Question;

    // Wyświetl obrazek jeśli istnieje
    const imageContainer = document.getElementById('questionImage');
    if (question.Image && question.Image.trim() !== '') {
        imageContainer.innerHTML = `<img src="${question.Image}" alt="Obrazek do pytania" onerror="this.style.display='none'">`;
    } else {
        imageContainer.innerHTML = '';
    }

    // Wyświetl odpowiedzi
    const answersContainer = document.getElementById('answers');
    answersContainer.innerHTML = `
        <div class="answer" onclick="selectAnswer('A')" id="answerA">
            <strong>Odpowiedź A:</strong> ${question.A}
        </div>
        <div class="answer" onclick="selectAnswer('B')" id="answerB">
            <strong>Odpowiedź B:</strong> ${question.I}
        </div>
    `;

    // Reset stanu
    selectedAnswer = null;
    isAnswered = false;
    document.getElementById('nextBtn').classList.remove('active');
}

// Wybierz odpowiedź
function selectAnswer(answer) {
    if (isAnswered) return;

    selectedAnswer = answer;
    const question = currentQuestions[currentQuestionIndex];
    const correctAnswer = question.Human;
    const isCorrect = (answer === correctAnswer);

    // Zapisz odpowiedź
    const answerData = {
        questionId: question.ID,
        questionText: question.Question,
        selectedAnswer: answer,
        correctAnswer: correctAnswer,
        isCorrect: isCorrect,
        answerA: question.A,
        answerB: question.I,
        questionIndex: currentQuestionIndex + 1,
        timestamp: new Date().toISOString()
    };

    quizResults.push(answerData);

    // Usuń poprzednie style
    document.querySelectorAll('.answer').forEach(el => {
        el.classList.remove('selected', 'correct', 'incorrect');
    });

    // Zaznacz wybraną odpowiedź
    document.getElementById(`answer${answer}`).classList.add('selected');

    // Pokaż poprawną odpowiedź po krótkiej chwili
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

// Następne pytanie
function nextQuestion() {
    if (!isAnswered) return;

    currentQuestionIndex++;

    if (currentQuestionIndex < currentQuestions.length) {
        displayQuestion();
    } else {
        showResults();
    }
}

// Pokaż wyniki
function showResults() {
    const percentage = Math.round((score / 10) * 100);

    document.getElementById('quizScreen').style.display = 'none';
    document.getElementById('resultsScreen').style.display = 'block';

    document.getElementById('finalScore').textContent = `${score}/10`;

    let message = '';
    if (percentage >= 90) {
        message = '🏆 Doskonały wynik! Świetnie rozpoznajesz odpowiedzi człowieka!';
    } else if (percentage >= 70) {
        message = '👏 Bardzo dobry wynik! Masz dobry instynkt w rozpoznawaniu ludzkich odpowiedzi.';
    } else if (percentage >= 50) {
        message = '👍 Niezły wynik! Rozpoznawanie odpowiedzi AI vs człowiek to wyzwanie.';
    } else {
        message = '💪 To trudne zadanie! Dziękujemy za udział w badaniu.';
    }

    document.getElementById('scoreDetails').innerHTML = `
        <h3>${message}</h3>
        <p>Poprawnie rozpoznanych odpowiedzi człowieka: <strong>${score}</strong></p>
        <p>Procent poprawnych odpowiedzi: <strong>${percentage}%</strong></p>
        <p style="margin-top: 15px; color: #666; font-size: 0.9em;">
            Twoje odpowiedzi pomagają nam zrozumieć, jak ludzie rozpoznają treści generowane przez AI.
        </p>
    `;

    // Zapisz pełne dane do localStorage lub wyślij na serwer
    saveResults();
}

// Zapisz wyniki
function saveResults() {
    const fullResults = {
        participant: participantData,
        results: quizResults,
        summary: {
            totalQuestions: 10,
            correctAnswers: score,
            percentage: Math.round((score / 10) * 100),
            completedAt: new Date().toISOString()
        }
    };

    // Wyślij dane do Google Sheets
    sendToGoogleSheets(fullResults);
}

// Wysyłanie do Google Sheets
async function sendToGoogleSheets(data) {
    const saveStatusDiv = document.getElementById('saveStatus');

    try {
        // URL do Google Apps Script Web App (będziesz musiał go zastąpić swoim)
        const GOOGLE_SCRIPT_URL = 'TUTAJ_WSTAW_URL_DO_GOOGLE_APPS_SCRIPT';

        // Jeśli nie masz jeszcze URL, zapisz lokalnie jako backup
        if (GOOGLE_SCRIPT_URL === 'TUTAJ_WSTAW_URL_DO_GOOGLE_APPS_SCRIPT') {
            console.log('Dane do zapisania:', data);
            saveStatusDiv.innerHTML = '<p>⚠️ Konfiguracja Google Sheets wymagana. Dane zapisane lokalnie.</p>';
            saveStatusDiv.className = 'save-status error';

            // Backup do localStorage
            saveToLocalStorage(data);
            return;
        }

        saveStatusDiv.innerHTML = '<p>💾 Wysyłanie danych...</p>';

        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Ważne dla Google Apps Script
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        // No-cors oznacza, że nie otrzymamy odpowiedzi, więc zakładamy sukces
        saveStatusDiv.innerHTML = '<p>✅ Dane zostały pomyślnie zapisane!</p>';
        saveStatusDiv.className = 'save-status success';

        console.log('Dane wysłane do Google Sheets');

    } catch (error) {
        console.error('Błąd wysyłania do Google Sheets:', error);
        saveStatusDiv.innerHTML = '<p>❌ Błąd zapisywania. Dane zapisane lokalnie jako backup.</p>';
        saveStatusDiv.className = 'save-status error';

        // Backup do localStorage w przypadku błędu
        saveToLocalStorage(data);
    }
}

// Backup do localStorage
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

// Funkcja do eksportu danych z localStorage (dla administratora)
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

// Dodaj funkcję eksportu do konsoli dla administratora
window.exportQuizData = exportLocalData;

// Restart quizu
function restartQuiz() {
    document.getElementById('resultsScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'block';
}

// Funkcja mieszania tablicy (Fisher-Yates shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Obsługa klawiatury
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