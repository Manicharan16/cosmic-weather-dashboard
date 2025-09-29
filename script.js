const API_KEY = '8f2e4b69e4d45a576fa509457983a01f';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/';

let unit = 'metric';
let isDarkMode = false;
let isLogin = true;

async function fetchWeather(endpoint, lat, lon, units = unit) {
    const url = `${BASE_URL}${endpoint}?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('API request failed');
        return await response.json();
    } catch (error) {
        console.error(error);
        alert('Failed to fetch weather data.');
    }
}

// Autocomplete functions
async function getCitySuggestions(query) {
    if (!query || query.length < 2) return [];
    const url = `${BASE_URL}geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch cities: ' + response.statusText);
        const cities = await response.json();
        console.log('Cities fetched:', cities); // Debug log
        return cities.map(city => ({ name: city.name, country: city.country, lat: city.lat, lon: city.lon }));
    } catch (error) {
        console.error('Error fetching cities:', error);
        return [];
    }
}

function displaySuggestions(suggestions) {
    const container = document.getElementById('suggestion-container');
    if (!container) {
        const div = document.createElement('div');
        div.id = 'suggestion-container';
        div.className = 'suggestion-container';
        document.querySelector('.navbar').appendChild(div);
    }
    const containerDiv = document.getElementById('suggestion-container');
    containerDiv.innerHTML = '';
    suggestions.forEach(city => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = `${city.name}, ${city.country}`;
        div.onclick = () => {
            document.getElementById('city-search').value = city.name;
            containerDiv.style.display = 'none';
            loadWeather(city.lat, city.lon);
        };
        containerDiv.appendChild(div);
    });
    containerDiv.style.display = suggestions.length ? 'block' : 'none';
}

document.getElementById('city-search').addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    if (query) {
        const suggestions = await getCitySuggestions(query);
        displaySuggestions(suggestions);
    } else {
        document.getElementById('suggestion-container').style.display = 'none';
    }
});

document.addEventListener('click', (e) => {
    const container = document.getElementById('suggestion-container');
    if (container && !container.contains(e.target) && e.target.id !== 'city-search') {
        container.style.display = 'none';
    }
});

// Weather functions
function updateCurrentWeather(data) {
    document.getElementById('location').textContent = data.name;
    document.getElementById('temp').textContent = data.main.temp;
    document.getElementById('conditions').textContent = data.weather[0].description;
    document.getElementById('humidity').textContent = data.main.humidity;
    document.getElementById('wind').textContent = data.wind.speed;
    document.getElementById('weather-icon').innerHTML = `<img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="Weather Icon" class="img-fluid">`;

    const condition = data.weather[0].main.toLowerCase();
    if (condition.includes('rain')) addRainEffect();
    else removeRainEffect();

    const sunset = new Date(data.sys.sunset * 1000);
    isDarkMode = new Date() > sunset || document.getElementById('dark-mode').checked;
    toggleTheme();
}

function addRainEffect() {
    const rainCount = 50;
    for (let i = 0; i < rainCount; i++) {
        const rain = document.createElement('div');
        rain.className = 'rain';
        rain.style.left = `${Math.random() * 100}vw`;
        rain.style.animationDuration = `${1 + Math.random() * 2}s`;
        document.body.appendChild(rain);
    }
}

function removeRainEffect() {
    document.querySelectorAll('.rain').forEach(r => r.remove());
}

function updateHourlyForecast(data) {
    const container = document.getElementById('hourly-forecast');
    container.innerHTML = '';
    const hourly = data.list.slice(0, 24);
    hourly.forEach(forecast => {
        const card = document.createElement('div');
        card.className = 'card text-center';
        card.innerHTML = `
            <div class="card-body">
                <p>${new Date(forecast.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png" alt="Icon" width="40">
                <p>${forecast.main.temp} °C</p>
            </div>
        `;
        container.appendChild(card);
    });
}

function toggleAuth() {
    isLogin = !isLogin;
    const label = document.getElementById('auth-label');
    const loginText = document.getElementById('login-text');
    if (isLogin) {
        label.textContent = 'Login';
        loginText.textContent = 'Login';
    } else {
        label.textContent = 'Signup';
        loginText.textContent = 'Signup';
    }
}

function addWeatherParticles(condition) {
    const container = document.getElementById('login-page');
    container.innerHTML = container.innerHTML; // Reset particles
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.top = `${Math.random() * 100}vh`;
        particle.style.width = `${Math.random() * 5 + 2}px`;
        particle.style.height = particle.style.width;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        if (condition.includes('rain')) particle.style.background = 'rgba(173, 216, 230, 0.7)';
        else particle.style.background = 'rgba(255, 255, 255, 0.7)';
        container.appendChild(particle);
    }
}

function updateForecast(data) {
    const container = document.getElementById('forecast-container');
    container.innerHTML = '';
    const daily = data.list.filter(f => f.dt_txt.endsWith('12:00:00')).slice(0, 7);
    daily.forEach(forecast => {
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-3';
        card.innerHTML = `
            <div class="card text-center">
                <div class="card-body">
                    <p>${new Date(forecast.dt * 1000).toLocaleDateString()}</p>
                    <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png" alt="Icon" width="50">
                    <p>High: ${forecast.main.temp_max} °C</p>
                    <p>Low: ${forecast.main.temp_min} °C</p>
                    <p>Rain: ${forecast.pop * 100 || 0}%</p>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

async function getWeatherByLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude: lat, longitude: lon } = position.coords;
            await loadWeather(lat, lon);
        }, () => loadWeather(51.5085, -0.1257));
    }
}

async function getWeatherByCity() {
    const city = document.getElementById('city-search').value.trim();
    console.log('Searching for:', city);
    if (!city) {
        alert('Please enter a city name.');
        return;
    }
    const geoUrl = `${BASE_URL}weather?q=${city}&appid=${API_KEY}`;
    try {
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();
        if (!geoResponse.ok) throw new Error('City not found');
        await loadWeather(geoData.coord.lat, geoData.coord.lon);
        document.getElementById('city-search').value = '';
        document.getElementById('suggestion-container').style.display = 'none';
    } catch (error) {
        alert('City not found.');
    }
}

document.getElementById('city-search').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        getWeatherByCity();
    }
});

async function loadWeather(lat, lon) {
    const currentData = await fetchWeather('weather', lat, lon);
    const forecastData = await fetchWeather('forecast', lat, lon);
    if (currentData) updateCurrentWeather(currentData);
    if (forecastData) {
        updateHourlyForecast(forecastData);
        updateForecast(forecastData);
    }
    updateFavorites();
}

function handleAuth() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const spinner = document.getElementById('spinner');
    const loginText = document.getElementById('login-text');
    if (email && password) {
        spinner.classList.remove('d-none');
        loginText.classList.add('d-none');
        console.log('Logging in with:', email); // Debug log
        setTimeout(() => {
            localStorage.setItem('user', email);
            localStorage.setItem('favorites', JSON.stringify([]));
            fetchWeather('weather', 51.5085, -0.1257).then(data => {
                if (data) addWeatherParticles(data.weather[0].main.toLowerCase());
            }).catch(err => console.error('Particle fetch failed:', err));
            const loginPage = document.getElementById('login-page');
            const dashboard = document.getElementById('dashboard');
            loginPage.classList.add('d-none');
            loginPage.classList.remove('show-login');
            dashboard.classList.remove('d-none');
            getWeatherByLocation().catch(err => console.error('Weather load failed:', err));
            spinner.classList.add('d-none');
            loginText.classList.remove('d-none');
        }, 1000); // 1-second delay
    } else {
        alert('Please fill all fields.');
    }
}

function logout() {
    localStorage.removeItem('user');
    document.getElementById('dashboard').classList.add('d-none');
    document.getElementById('login-page').classList.remove('d-none');
}

function toggleSettings() {
    new bootstrap.Modal(document.getElementById('settingsModal')).show();
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode', isDarkMode);
    document.body.classList.toggle('light-mode', !isDarkMode);
}

function updateUnits() {
    unit = document.querySelector('input[name="unit"]:checked').value;
    getWeatherByLocation();
}

function updateFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const container = document.getElementById('favorites-container');
    container.innerHTML = '';
    favorites.forEach(city => {
        const card = document.createElement('div');
        card.className = 'favorite-card';
        card.textContent = city;
        card.onclick = () => document.getElementById('city-search').value = city;
        container.appendChild(card);
    });
    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn-success';
    addBtn.textContent = '+ Add';
    addBtn.onclick = () => {
        const city = document.getElementById('location').textContent;
        if (city && !favorites.includes(city)) {
            favorites.push(city);
            localStorage.setItem('favorites', JSON.stringify(favorites));
            updateFavorites();
        }
    };
    container.appendChild(addBtn);
}

// Load on startup
document.addEventListener('DOMContentLoaded', () => {
    const loginPage = document.getElementById('login-page');
    const dashboard = document.getElementById('dashboard');
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser.trim() !== '') {
        loginPage.classList.add('d-none');
        loginPage.classList.remove('show-login');
        dashboard.classList.remove('d-none');
        getWeatherByLocation();
    } else {
        loginPage.classList.remove('d-none');
        loginPage.classList.add('show-login');
        dashboard.classList.add('d-none');
        localStorage.removeItem('user'); // Clear invalid or empty user
    }
});