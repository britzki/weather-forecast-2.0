// =============================
// CONFIG
// =============================
const THEME_KEY = 'weather_theme';
const apiKey = '8a60b2de14f7a17c7a11706b2cfcd87c';

// =============================
// TEMA (claro/escuro)
// =============================
function applyTheme(theme) {
    const root = document.documentElement;
    root.dataset.theme = theme;

    const btn = document.getElementById('theme_toggle');
    if (btn) {
        btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
}

(function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));

    const btn = document.getElementById('theme_toggle');
    if (btn) {
        btn.addEventListener('click', () => {
            const current = document.documentElement.dataset.theme || 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            localStorage.setItem(THEME_KEY, next);
        });
    }
})();

// =============================
// BUSCA POR CIDADE
// =============================
document.querySelector('#search').addEventListener('submit', async (event) => {
    event.preventDefault();

    const cityName = document.querySelector('#city_name').value;

    if (!cityName) {
        document.querySelector("#weather").classList.remove('show');
        showAlert('Você precisa digitar uma cidade...');
        return;
    }

    fetchWeatherByCity(cityName);
});

async function fetchWeatherByCity(cityName) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURI(cityName)}&appid=${apiKey}&units=metric&lang=pt_br`;

    const results = await fetch(apiUrl);
    const json = await results.json();

    if (json.cod === 200) {
        showInfo({
            city: json.name,
            country: json.sys.country,
            temp: json.main.temp,
            tempMax: json.main.temp_max,
            tempMin: json.main.temp_min,
            description: json.weather[0].description,
            tempIcon: json.weather[0].icon,
            windSpeed: json.wind.speed,
            humidity: json.main.humidity,
        });
    } else {
        document.querySelector("#weather").classList.remove('show');
        showAlert(`
            Não foi possível localizar...
            <br/>
            <img src="src/images/404.svg"/>
        `);
    }
}

// =============================
// GPS (LOCALIZAÇÃO AUTOMÁTICA)
// =============================
const gpsBtn = document.getElementById('gps_btn');

async function fetchWeatherByCoords(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`;
    const res = await fetch(url);
    return res.json();
}

async function useMyLocation() {
    if (!navigator.geolocation) {
        showAlert('Seu navegador não suporta GPS.');
        return;
    }

    showAlert('Obtendo sua localização...');

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const { latitude, longitude } = pos.coords;

            const json = await fetchWeatherByCoords(latitude, longitude);

            if (json.cod === 200) {
                showInfo({
                    city: json.name,
                    country: json.sys.country,
                    temp: json.main.temp,
                    tempMax: json.main.temp_max,
                    tempMin: json.main.temp_min,
                    description: json.weather[0].description,
                    tempIcon: json.weather[0].icon,
                    windSpeed: json.wind.speed,
                    humidity: json.main.humidity,
                });
            } else {
                showAlert('Erro ao carregar clima pela localização.');
            }
        },
        () => {
            showAlert('Permissão de localização negada.');
        }
    );
}

if (gpsBtn) {
    gpsBtn.addEventListener('click', useMyLocation);
}

// Carrega automaticamente ao abrir
window.addEventListener('load', useMyLocation);

// =============================
// MICROFONE (BUSCA POR VOZ)
// =============================
const micBtn = document.getElementById('mic_btn');

function setupVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        if (micBtn) micBtn.disabled = true;
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';

    micBtn.addEventListener('click', () => {
        showAlert('Fale o nome da cidade...');
        recognition.start();
    });

    recognition.addEventListener('result', (event) => {
        const text = event.results[0][0].transcript;
        document.querySelector('#city_name').value = text;

        document.querySelector('#search')
            .dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });

    recognition.addEventListener('error', () => {
        showAlert('Erro ao usar microfone.');
    });
}

setupVoiceSearch();

// =============================
// UI
// =============================
function showInfo(json) {
    showAlert('');
    document.querySelector("#weather").classList.add('show');

    document.querySelector('#title').innerHTML = `${json.city}, ${json.country}`;
    document.querySelector('#temp_value').innerHTML =
        `${json.temp.toFixed(1).toString().replace('.', ',')} <sup>°C</sup>`;
    document.querySelector('#temp_description').innerHTML = json.description;
    document.querySelector('#temp_img')
        .setAttribute('src', `https://openweathermap.org/img/wn/${json.tempIcon}@2x.png`);

    document.querySelector('#temp_max').innerHTML =
        `${json.tempMax.toFixed(1).toString().replace('.', ',')} <sup>°C</sup>`;
    document.querySelector('#temp_min').innerHTML =
        `${json.tempMin.toFixed(1).toString().replace('.', ',')} <sup>°C</sup>`;
    document.querySelector('#humidity').innerHTML = `${json.humidity}%`;
    document.querySelector('#wind').innerHTML = `${json.windSpeed.toFixed(1)} km/h`;
}

function showAlert(msg) {
    document.querySelector('#alert').innerHTML = msg;
}