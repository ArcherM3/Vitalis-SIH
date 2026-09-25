# VITALIS — AIoT Personal Health Companion

Understand your health. Act smarter.

VITALIS is a wellness/monitoring web application for the supplied hardware:
ESP32, MAX30102 (heart rate + SpO2), MAX30205 (body temperature), AD8232
(electrical cardiac activity), BME280 (ambient temperature), ENS160 (AQI),
and lithium-ion battery.

## Stack
Frontend: React + Vite + Tailwind CSS + Recharts + React Router
Backend: Python + FastAPI + Pydantic + SQLAlchemy + JWT
Database: PostgreSQL
IoT: ESP32 -> MQTT/Mosquitto -> FastAPI -> PostgreSQL -> React

## Run
Frontend demo:
    cd frontend
    npm install
    npm run dev

Full stack:
    docker compose up --build

Frontend: http://localhost:5173
API: http://localhost:8000
Swagger: http://localhost:8000/docs

The frontend contains demo data so the UI works without physical hardware.
See .env.example and iot/esp32/vitalis_esp32.ino for integration details.

Disclaimer: VITALIS is a wellness/monitoring companion, not a medical
diagnostic system.
