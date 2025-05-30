let allQuestionsData = [];
let currentProcessedQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let selectedAnswerSlot = null;
let isAnswered = false;

let participantData = {};
let quizAttemptResults = [];
let sessionId = '';

const numberOfQuestions = 10;
const needToValidateDemographics = true;
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz0cSnH2PjqbwkpZuxwYJO-YyxCVhgBIK6vyO2P1tzuhVNqBKmA1fWlk44aSZjDnBoQnQ/exec';
const MAP_IMAGE_BASE_PATH = 'maps/';

function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

document.addEventListener('DOMContentLoaded', function() {
    sessionId = generateSessionId();
    console.log("Generated Session ID:", sessionId);
    loadQuestionsFile();
    setupFormValidation();
});

async function loadQuestionsFile() {
    try {
        document.getElementById('loadingMessage').style.display = 'block';
        document.getElementById('startContent').style.display = 'none';
        document.getElementById('errorMessage').style.display = 'none';

        const response = await fetch('data/quiz_data.json');

        if (response && response.ok) {
            allQuestionsData = await response.json();
        } else {
            throw new Error(`Błąd ładowania pliku pytań: ${response ? response.statusText : 'Nie można połączyć się z serwerem'}`);
        }

        if (allQuestionsData && allQuestionsData.length > 0) {
            document.getElementById('loadingMessage').style.display = 'none';
            document.getElementById('startContent').style.display = 'block';
            document.getElementById('questionsCount').textContent =
                `Liczba dostępnych pytań w bazie: ${allQuestionsData.length}`;
        } else {
            throw new Error('Nie znaleziono pytań w pliku lub plik jest pusty.');
        }

    } catch (error) {
        console.error('Błąd ładowania pytań:', error);
        document.getElementById('loadingMessage').style.display = 'none';
        document.getElementById('startContent').style.display = 'none';
        document.getElementById('errorMessage').style.display = 'block';
        document.getElementById('errorMessage').innerHTML = `Nie udało się załadować pytań badawczych. Spróbuj później.<br><br>Szczegóły błędu: ${error.message}<br><br><button class="restart-btn" onclick="loadQuestionsFile()">🔄 Spróbuj ponownie</button>`;
    }
}

function setupFormValidation() {
    const form = document.getElementById('demographicsForm');
    const startButton = document.getElementById('startButton');
    const requiredFieldsIds = ['birthYear', 'gender', 'education', 'consent'];

    function validateForm() {
        if (!needToValidateDemographics) {
            startButton.disabled = false;
            return;
        }

        const isValid = requiredFieldsIds.every(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field) {
                console.warn(`Pole formularza o ID '${fieldId}' nie zostało znalezione.`);
                return false;
            }
            if (field.type === 'checkbox') {
                return field.checked;
            }
            return field.value !== null && field.value.trim() !== '';
        });
        startButton.disabled = !isValid;
    }

    requiredFieldsIds.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', validateForm);
            field.addEventListener('change', validateForm);
        }
    });
    validateForm();
}

function goToMetric() {
    if (allQuestionsData.length === 0) {
        alert("Pytania nie zostały jeszcze załadowane. Proszę czekać lub spróbować odświeżyć stronę.");
        return;
    }
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('formScreen').style.display = 'block';
}

function startQuiz() {
    if (allQuestionsData.length < numberOfQuestions) {
        alert(`Dostępnych jest tylko ${allQuestionsData.length} pytań. Potrzeba minimum ${numberOfQuestions} do przeprowadzenia badania.`);
        return;
    }

    collectDemographics();

    currentProcessedQuestions = [];
    const shuffledOriginalQuestions = shuffleArray([...allQuestionsData]);

    for (let i = 0; i < Math.min(numberOfQuestions, shuffledOriginalQuestions.length); i++) {
        const originalQuestion = shuffledOriginalQuestions[i];
        if (originalQuestion.AIResponses && originalQuestion.AIResponses.length > 0 &&
            originalQuestion.HumanResponses && originalQuestion.HumanResponses.length > 0) {

            const aiResponse = originalQuestion.AIResponses[Math.floor(Math.random() * originalQuestion.AIResponses.length)];
            const humanResponse = originalQuestion.HumanResponses[Math.floor(Math.random() * originalQuestion.HumanResponses.length)];

            let answerA, answerB, humanIsA;
            if (Math.random() < 0.5) {
                answerA = aiResponse.responseText;
                answerB = humanResponse.responseText;
                humanIsA = false;
            } else {
                answerA = humanResponse.responseText;
                answerB = aiResponse.responseText;
                humanIsA = true;
            }

            currentProcessedQuestions.push({
                originalID: originalQuestion.ID,
                operation: originalQuestion.Operation,
                mapID: originalQuestion.MapID,
                questionText: originalQuestion.QuestionText,
                selectedAIModelName: aiResponse.modelName,
                selectedAIResponseText: aiResponse.responseText,
                selectedHumanID: humanResponse.humanID,
                selectedHumanResponseText: humanResponse.responseText,
                displayedAnswerA: answerA,
                displayedAnswerB: answerB,
                correctAnswerSlot: humanIsA ? 'A' : 'B'
            });
        } else {
            console.warn(`Pytanie o ID ${originalQuestion.ID} nie ma wystarczającej liczby odpowiedzi AI lub ludzkich i zostało pominięte.`);
        }
    }

    if (currentProcessedQuestions.length < numberOfQuestions) {
        alert(`Nie udało się przygotować wystarczającej liczby (${numberOfQuestions}) pytań z dostępnej puli. Przygotowano ${currentProcessedQuestions.length}. Spróbuj ponownie lub sprawdź plik danych.`);
        document.getElementById('formScreen').style.display = 'none';
        document.getElementById('startScreen').style.display = 'block';
        loadQuestionsFile();
        return;
    }


    currentQuestionIndex = 0;
    score = 0;
    quizAttemptResults = [];

    document.getElementById('formScreen').style.display = 'none';
    document.getElementById('quizScreen').style.display = 'block';
    document.getElementById('resultsScreen').style.display = 'none';


    displayQuestion();
}

function collectDemographics() {
    const birthYearInput = document.getElementById('birthYear');
    const birthYear = birthYearInput.value ? parseInt(birthYearInput.value) : null;
    const currentYear = new Date().getFullYear();
    const age = birthYear ? (currentYear - birthYear) : null;

    participantData = {
        sessionId: sessionId,
        timestampStart: new Date().toISOString(),
        birthYear: birthYear,
        age: age,
        gender: document.getElementById('gender').value,
        education: document.getElementById('education').value,
        consent: document.getElementById('consent').checked
    };
}

function displayQuestion() {
    if (currentQuestionIndex >= currentProcessedQuestions.length) {
        showResults();
        return;
    }
    const question = currentProcessedQuestions[currentQuestionIndex];

    document.getElementById('questionCounter').textContent =
        `Pytanie ${currentQuestionIndex + 1} z ${currentProcessedQuestions.length}`;
    document.getElementById('progressBar').style.width =
        `${((currentQuestionIndex + 1) / currentProcessedQuestions.length) * 100}%`;

    document.getElementById('questionText').textContent = question.questionText;

    const imageContainer = document.getElementById('questionImage');

    if (question.mapID && question.mapID.trim() !== '') {
        const imgElement = document.createElement('img');
        imgElement.alt = `Mapa do pytania: ${question.mapID}`;
        imgElement.onerror = function() {
            this.onerror = function() { this.style.display='none'; console.warn(`Nie można załadować obrazka dla MapID: ${question.mapID} (próbowano .png i .jpg)`); };
            this.src = `${MAP_IMAGE_BASE_PATH}${question.mapID}.jpg`;
        };
        imgElement.src = `${MAP_IMAGE_BASE_PATH}${question.mapID}.png`;
        imageContainer.innerHTML = '';
        imageContainer.appendChild(imgElement);
    } else {
        imageContainer.innerHTML = '';
    }

    const answersContainer = document.getElementById('answers');
    answersContainer.innerHTML = `
        <div class="answer" onclick="selectAnswer('A')" id="answerA">
            <strong>Odpowiedź A:</strong> ${question.displayedAnswerA}
        </div>
        <div class="answer" onclick="selectAnswer('B')" id="answerB">
            <strong>Odpowiedź B:</strong> ${question.displayedAnswerB}
        </div>
    `;

    selectedAnswerSlot = null;
    isAnswered = false;
    document.getElementById('nextBtn').classList.remove('active');
    document.getElementById('nextBtn').disabled = true;
}

function selectAnswer(slot) {
    if (isAnswered) return;

    selectedAnswerSlot = slot;
    const question = currentProcessedQuestions[currentQuestionIndex];
    const isCorrect = (slot === question.correctAnswerSlot);

    const answerData = {
        questionOriginalID: question.originalID,
        operation: question.operation,
        mapID: question.mapID,
        questionText: question.questionText,
        selectedAISource: question.selectedAIModelName,
        selectedAIResponse: question.selectedAIResponseText,
        selectedHumanSource: question.selectedHumanID,
        selectedHumanResponse: question.selectedHumanResponseText,
        displayedAnswerA_text: question.displayedAnswerA,
        displayedAnswerB_text: question.displayedAnswerB,
        slotForAI: question.correctAnswerSlot === 'A' ? 'B' : 'A',
        slotForHuman: question.correctAnswerSlot,
        userSelectedSlot: slot,
        isCorrect: isCorrect,
        questionIndexInQuiz: currentQuestionIndex + 1,
        timestampAnswer: new Date().toISOString()
    };
    quizAttemptResults.push(answerData);

    document.querySelectorAll('.answer').forEach(el => {
        el.classList.remove('selected', 'correct', 'incorrect');
    });

    document.getElementById(`answer${slot}`).classList.add('selected');

    setTimeout(() => {
        document.getElementById(`answer${question.correctAnswerSlot}`).classList.add('correct');

        if (!isCorrect) {
            document.getElementById(`answer${slot}`).classList.add('incorrect');
        } else {
            score++;
        }

        isAnswered = true;
        document.getElementById('nextBtn').classList.add('active');
        document.getElementById('nextBtn').disabled = false;
    }, 500);
}

function nextQuestion() {
    if (!isAnswered) return;

    currentQuestionIndex++;

    if (currentQuestionIndex < currentProcessedQuestions.length) {
        displayQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    const percentage = currentProcessedQuestions.length > 0 ? Math.round((score / currentProcessedQuestions.length) * 100) : 0;

    document.getElementById('quizScreen').style.display = 'none';
    document.getElementById('resultsScreen').style.display = 'block';

    document.getElementById('finalScore').textContent = `${score}/${currentProcessedQuestions.length}`;
    document.getElementById('scoreDetails').innerHTML = `
        <p>Poprawnie rozpoznanych odpowiedzi człowieka: <strong>${score}</strong></p>
        <p>Procent poprawnych odpowiedzi: <strong>${percentage}%</strong></p>
    `;

    saveResultsToSheets();
}

async function saveResultsToSheets() {
    const saveStatusDiv = document.getElementById('saveStatus');
    saveStatusDiv.innerHTML = '<p>Przygotowywanie danych do zapisu...</p>';
    saveStatusDiv.className = 'save-status'; // Reset class

    const dataToSend = quizAttemptResults.map(result => ({
        sessionId: participantData.sessionId,
        timestampStart: participantData.timestampStart,
        birthYear: participantData.birthYear,
        age: participantData.age,
        gender: participantData.gender,
        education: participantData.education,
        questionOriginalID: result.questionOriginalID,
        operation: result.operation,
        mapID: result.mapID,
        selectedAISource: result.selectedAISource,
        selectedAIResponseFragment: result.selectedAIResponse.substring(0, 250),
        selectedHumanSource: result.selectedHumanSource,
        selectedHumanResponseFragment: result.selectedHumanResponse.substring(0, 250),
        slotForAI: result.slotForAI,
        slotForHuman: result.slotForHuman,
        userSelectedSlot: result.userSelectedSlot,
        isCorrect: result.isCorrect,
        questionIndexInQuiz: result.questionIndexInQuiz,
        timestampAnswer: result.timestampAnswer,
        totalQuizQuestions: currentProcessedQuestions.length,
        finalScore: score,
        finalPercentage: currentProcessedQuestions.length > 0 ? Math.round((score / currentProcessedQuestions.length) * 100) : 0,
        completedAt: new Date().toISOString()
    }));

    console.log('Dane do wysłania do Google Sheets:', dataToSend);

    if (GOOGLE_SCRIPT_URL === 'TUTAJ_WSTAW_URL_DO_GOOGLE_APPS_SCRIPT' || GOOGLE_SCRIPT_URL.trim() === '') {
        console.warn('URL do Google Apps Script nie jest skonfigurowany. Dane nie zostaną wysłane.');
        saveStatusDiv.innerHTML = '<p>⚠️ URL Google Sheets nie jest skonfigurowany. Dane wyświetlone w konsoli i zapisane lokalnie (jeśli zaimplementowano).</p>';
        saveStatusDiv.className = 'save-status error';
        saveToLocalStorage({ participant: participantData, results: quizAttemptResults, summary: {finalScore: score, totalQuestions: currentProcessedQuestions.length}}); // Zapis lokalny jako fallback
        return;
    }

    try {
        saveStatusDiv.innerHTML = '<p>Wysyłanie danych...</p>';
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            redirect: 'follow',
            body: JSON.stringify({
                sessionId: participantData.sessionId,
                demographics: participantData,
                quizData: dataToSend
            })
        });

        saveStatusDiv.innerHTML = '<p>✅ Dane zostały wysłane! (status wysyłania przy no-cors może być niepewny)</p>';
        saveStatusDiv.className = 'save-status success';
        console.log('Dane prawdopodobnie wysłane do Google Sheets.');

    } catch (error) {
        console.error('Błąd wysyłania do Google Sheets:', error);
        saveStatusDiv.innerHTML = `<p>❌ Błąd podczas wysyłania danych. Sprawdź konsolę.<br>Dane zapisane lokalnie jako backup.</p>`;
        saveStatusDiv.className = 'save-status error';
        saveToLocalStorage({ participant: participantData, results: quizAttemptResults, summary: {finalScore: score, totalQuestions: currentProcessedQuestions.length}});
    }
}

function saveToLocalStorage(dataToSave) {
    try {
        const existingResults = JSON.parse(localStorage.getItem('aiHumanQuizResultsBackup') || '[]');
        existingResults.push(dataToSave);
        localStorage.setItem('aiHumanQuizResultsBackup', JSON.stringify(existingResults));
        console.log('Dane zapisane lokalnie jako backup w localStorage.');
    } catch (e) {
        console.error('Błąd zapisu lokalnego do localStorage:', e);
    }
}

function exportLocalData() {
    const data = localStorage.getItem('aiHumanQuizResultsBackup');
    if (!data || data === "[]") {
        alert('Brak danych lokalnych do eksportu.');
        return;
    }
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz_results_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('Dane lokalne zostały pobrane jako plik JSON.');
}

function restartQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    selectedAnswerSlot = null;
    isAnswered = false;
    quizAttemptResults = [];
    currentProcessedQuestions = [];
    sessionId = generateSessionId();
    console.log("Generated new Session ID for restart:", sessionId);

    document.getElementById('resultsScreen').style.display = 'none';
    document.getElementById('quizScreen').style.display = 'none';
    document.getElementById('formScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'block';

    setupFormValidation();
    loadQuestionsFile();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

document.addEventListener('keydown', function(event) {
    if (document.getElementById('quizScreen').style.display === 'block') {
        if (!isAnswered) {
            if (event.key.toLowerCase() === 'a') {
                selectAnswer('A');
            } else if (event.key.toLowerCase() === 'b') {
                selectAnswer('B');
            }
        } else {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                nextQuestion();
            }
        }
    }
});