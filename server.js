// ==========================================
// HEALTHGUARD AI - NODE.JS BACKEND
// SIH PROJECT
// ==========================================

// Import required packages
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// ==========================================
// CREATE EXPRESS APP
// ==========================================

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ==========================================
// MIDDLEWARE
// ==========================================

// Allows frontend to communicate with backend
app.use(cors());

// Allows backend to receive JSON data
app.use(express.json());

// ==========================================
// VARIABLES
// ==========================================

const PORT = 5000;

// Store latest sensor data
//.: added currentSituation tracker and hardware sensor models mapping
let currentSituation = "Normal";

let latestSensorData = {
  heartRate: 78,
  spo2: 98,
  bodyTemperature: 36.7,
  ambientTemperature: 28,
  humidity: 60,
  pressure: 1013.25, // BME280 Barometric Pressure in hPa
  aqi: 45,
  ecg: 72,
  gsr: 3.5, // GSR Galvanic Skin Response (Skin Conductance in µS)
  timestamp: new Date(),
  hardware: {
    esp32: "Connected",
    max30102: "Active",
    max30205: "Active",
    ad8232: "Active",
    bme280: "Active (Temp, Humidity, Pressure)",
    ens160: "Active",
    gsr: "Active (Electrodermal Activity / Stress)",
  },
};

// Current risk information
let currentRisk = {
  level: "LOW",
  score: 10,
  message: "Health parameters are within normal range.",
};

//.: Predefined situations for hardware demo simulation
const DEMO_SITUATIONS = {
  Normal: {
    heartRate: 75,
    spo2: 98,
    bodyTemperature: 36.6,
    ambientTemperature: 27,
    humidity: 55,
    pressure: 1013.2,
    aqi: 35,
    ecg: 72,
    gsr: 3.2,
    situation: "Normal",
  },
  "Heat Stress": {
    heartRate: 110,
    spo2: 96,
    bodyTemperature: 39.2,
    ambientTemperature: 43.5,
    humidity: 78,
    pressure: 1006.5,
    aqi: 65,
    ecg: 95,
    gsr: 8.5,
    situation: "Heat Stress",
  },
  "Cardiac Risk": {
    heartRate: 145,
    spo2: 92,
    bodyTemperature: 37.1,
    ambientTemperature: 28,
    humidity: 50,
    pressure: 1012.0,
    aqi: 40,
    ecg: 142,
    gsr: 12.0,
    situation: "Cardiac Risk",
  },
  "Respiratory Risk": {
    heartRate: 115,
    spo2: 86,
    bodyTemperature: 37.9,
    ambientTemperature: 30,
    humidity: 65,
    pressure: 1004.2,
    aqi: 130,
    ecg: 90,
    gsr: 7.5,
    situation: "Respiratory Risk",
  },
  Pollution: {
    heartRate: 88,
    spo2: 94,
    bodyTemperature: 36.8,
    ambientTemperature: 32,
    humidity: 70,
    pressure: 1009.8,
    aqi: 285,
    ecg: 80,
    gsr: 4.8,
    situation: "Pollution",
  },
  Emergency: {
    heartRate: 165,
    spo2: 82,
    bodyTemperature: 40.2,
    ambientTemperature: 44,
    humidity: 80,
    pressure: 982.0,
    aqi: 310,
    ecg: 160,
    gsr: 18.5,
    situation: "Emergency",
  },
  "Cyclone Warning": {
    heartRate: 118,
    spo2: 94,
    bodyTemperature: 37.2,
    ambientTemperature: 31.5,
    humidity: 94,
    pressure: 968.5,
    aqi: 140,
    ecg: 110,
    gsr: 9.0,
    situation: "Cyclone Warning",
  },
  "High Stress": {
    heartRate: 128,
    spo2: 95,
    bodyTemperature: 37.4,
    ambientTemperature: 29.0,
    humidity: 68,
    pressure: 1008.0,
    aqi: 55,
    ecg: 120,
    gsr: 17.8, // Critical Galvanic Skin Response (Severe Stress Level)
    situation: "High Stress",
  },
};

// ==========================================
// HOME ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message: "HealthGuard AI Backend is running",
    status: "OK",
  });
});

// ==========================================
// BME280 CYCLONE PREDICTION ENGINE
// ==========================================

function calculateCyclonePrediction(data) {
  const pressure = data.pressure !== undefined ? Number(data.pressure) : 1013.25;
  const humidity = data.humidity !== undefined ? Number(data.humidity) : 55;
  const temp = data.ambientTemperature !== undefined ? Number(data.ambientTemperature) : 27;

  let riskScore = 0;
  let status = "NORMAL";
  let title = "Stable Atmospheric Conditions";
  let pressureTrend = "Normal Pressure (~1013 hPa)";
  let description = "Barometric pressure and environmental readings are within standard range. No cyclonic weather threats detected.";

  // Calculate Barometric Pressure Drop severity (Standard atmospheric baseline = 1013.25 hPa)
  if (pressure < 975) {
    riskScore += 85;
    status = "CRITICAL";
    title = "SEVERE CYCLONE / TYPHOON WARNING";
    pressureTrend = `${pressure.toFixed(1)} hPa (Extreme Cyclonic Depression)`;
    description = `CRITICAL ALERT: BME280 detected an extreme atmospheric pressure drop to ${pressure.toFixed(1)} hPa with high humidity (${humidity}%). Indicates severe cyclonic activity, high wind speeds, and imminent violent storm surge.`;
  } else if (pressure < 995) {
    riskScore += 65;
    status = "HIGH";
    title = "TROPICAL CYCLONE ALERT";
    pressureTrend = `${pressure.toFixed(1)} hPa (Steep Barometric Pressure Drop)`;
    description = `ALERT: BME280 measures a steep barometric drop to ${pressure.toFixed(1)} hPa. High probability of tropical cyclone formation or severe squall conditions.`;
  } else if (pressure < 1005) {
    riskScore += 40;
    status = "MODERATE";
    title = "LOW PRESSURE TROUGH";
    pressureTrend = `${pressure.toFixed(1)} hPa (Falling Pressure Trough)`;
    description = `MONITORING: Barometric pressure is falling (${pressure.toFixed(1)} hPa) with rising relative humidity (${humidity}%). Potential for storm development or heavy rain.`;
  } else if (pressure < 1009) {
    riskScore += 20;
    status = "LOW";
    title = "UNSTABLE WEATHER";
    pressureTrend = `${pressure.toFixed(1)} hPa (Slight Pressure Drop)`;
    description = `Atmospheric pressure is slightly below normal. Light rain or wind fluctuations possible.`;
  }

  // Adjust score for humidity & thermal energy (Humidity > 80% & Warm Air fuel cyclonic convection)
  if (humidity > 85 && pressure < 1005) {
    riskScore = Math.min(100, riskScore + 15);
  }
  if (temp > 28 && pressure < 1000) {
    riskScore = Math.min(100, riskScore + 10);
  }

  return {
    score: riskScore,
    status,
    title,
    pressureTrend,
    description,
    metrics: {
      pressure: Number(pressure.toFixed(1)),
      humidity: Number(humidity),
      temperature: Number(temp.toFixed(1)),
    },
  };
}

// ==========================================
// INTEGRATED MULTIMODAL STRESS ENGINE
// (Combines GSR, Heart Rate, Body Temp, Surrounding Temp, SpO2, and Humidity)
// ==========================================

function calculateCompositeStress(data) {
  const gsr = data.gsr !== undefined ? Number(data.gsr) : 3.5;
  const hr = data.heartRate !== undefined ? Number(data.heartRate) : 75;
  const bodyTemp = data.bodyTemperature !== undefined ? Number(data.bodyTemperature) : 36.6;
  const ambientTemp = data.ambientTemperature !== undefined ? Number(data.ambientTemperature) : 27;
  const spo2 = data.spo2 !== undefined ? Number(data.spo2) : 98;
  const humidity = data.humidity !== undefined ? Number(data.humidity) : 55;

  // 1. GSR Electrodermal Arousal Score (35% weight)
  const gsrScore = Math.min(100, Math.max(0, (gsr - 2.0) * 5.5));

  // 2. Heart Rate Cardiac Arousal Score (25% weight)
  const hrScore = Math.min(100, Math.max(0, (hr - 70) * 1.2));

  // 3. Systemic Body Temp Score (15% weight)
  const bodyTempScore = Math.min(100, Math.max(0, (bodyTemp - 36.6) * 25));

  // 4. SpO2 Hypoxia Stress Score (15% weight)
  const spo2Score = Math.min(100, Math.max(0, (98 - spo2) * 5));

  // 5. Environmental Heat Index (Ambient Temp + Humidity) Score (10% weight)
  const ambientTempScore = Math.min(100, Math.max(0, (ambientTemp - 27) * 4));
  const humidityScore = Math.min(100, Math.max(0, (humidity - 50) * 1.5));
  const envScore = ambientTempScore * 0.6 + humidityScore * 0.4;

  // Final Integrated Stress Index (0 - 100%)
  const rawStress = 0.35 * gsrScore + 0.25 * hrScore + 0.15 * bodyTempScore + 0.15 * spo2Score + 0.10 * envScore;
  const score = Math.min(100, Math.max(5, Math.round(rawStress)));

  let level = "LOW STRESS";
  let status = "NORMAL";
  let description = "All physiological and environmental indicators reflect a calm, balanced baseline state.";

  if (score >= 75) {
    level = "CRITICAL STRESS CRISIS";
    status = "CRITICAL";
    description = `ACUTE OVERLOAD: High GSR (${gsr.toFixed(1)} µS), elevated heart rate (${hr} BPM), and environmental/thermal factors indicate severe sympathetic nervous system arousal.`;
  } else if (score >= 50) {
    level = "HIGH STRESS";
    status = "HIGH";
    description = `HIGH STRAIN: Elevated skin conductance (${gsr.toFixed(1)} µS) combined with physiological vitals indicates significant physical or mental stress.`;
  } else if (score >= 25) {
    level = "MODERATE STRESS";
    status = "MODERATE";
    description = `MODERATE AROUSAL: Mild physiological or thermal strain detected across GSR, heart rate, and surrounding environment.`;
  }

  return {
    score,
    level,
    status,
    description,
    factors: {
      gsr: { value: Number(gsr.toFixed(1)), unit: "µS", contribution: Math.round(gsrScore) },
      heartRate: { value: hr, unit: "BPM", contribution: Math.round(hrScore) },
      bodyTemp: { value: Number(bodyTemp.toFixed(1)), unit: "°C", contribution: Math.round(bodyTempScore) },
      ambientTemp: { value: Number(ambientTemp.toFixed(1)), unit: "°C", contribution: Math.round(ambientTempScore) },
      spo2: { value: spo2, unit: "%", contribution: Math.round(spo2Score) },
      humidity: { value: humidity, unit: "%", contribution: Math.round(humidityScore) },
    },
  };
}

// ==========================================
// GET LATEST SENSOR DATA
// ==========================================

app.get("/api/sensors/latest", (req, res) => {
  const cyclone = calculateCyclonePrediction(latestSensorData);
  const stress = calculateCompositeStress(latestSensorData);
  res.json({
    success: true,
    data: latestSensorData,
    risk: currentRisk,
    cyclone: cyclone,
    stress: stress,
    situation: currentSituation,
  });
});

//.: GET available demo situations
app.get("/api/demo/situations", (req, res) => {
  res.json({
    success: true,
    situations: Object.keys(DEMO_SITUATIONS),
    currentSituation: currentSituation,
  });
});

//.: POST endpoint to switch demo situation
app.post("/api/demo/situation", (req, res) => {
  const { situation } = req.body;
  if (DEMO_SITUATIONS[situation]) {
    currentSituation = situation;
    const base = DEMO_SITUATIONS[situation];
    latestSensorData = {
      ...latestSensorData,
      ...base,
      timestamp: new Date(),
    };
    currentRisk = calculateRisk(latestSensorData);
    const cyclone = calculateCyclonePrediction(latestSensorData);
    const stress = calculateCompositeStress(latestSensorData);
    io.emit("sensorUpdate", {
      sensors: latestSensorData,
      risk: currentRisk,
      cyclone: cyclone,
      stress: stress,
      situation: currentSituation,
    });
    return res.json({
      success: true,
      message: `Situation changed to ${situation}`,
      data: latestSensorData,
      risk: currentRisk,
      cyclone: cyclone,
      stress: stress,
      situation: currentSituation,
    });
  }
  res.status(400).json({ success: false, message: "Invalid situation name" });
});

// ==========================================
// RECEIVE SENSOR DATA FROM ESP32 OR MANUAL HARDWARE DISPLAY
// ==========================================

app.post("/api/sensors", (req, res) => {
  const data = req.body;

  //.: Allow hardware override and update latest sensor values
  if (data.situation) {
    currentSituation = data.situation;
  } else {
    currentSituation = "Custom Hardware Input";
  }

  latestSensorData = {
    ...latestSensorData,
    heartRate:
      data.heartRate !== undefined
        ? Number(data.heartRate)
        : latestSensorData.heartRate,
    spo2: data.spo2 !== undefined ? Number(data.spo2) : latestSensorData.spo2,
    bodyTemperature:
      data.bodyTemperature !== undefined
        ? Number(data.bodyTemperature)
        : latestSensorData.bodyTemperature,
    ambientTemperature:
      data.ambientTemperature !== undefined
        ? Number(data.ambientTemperature)
        : latestSensorData.ambientTemperature,
    humidity:
      data.humidity !== undefined
        ? Number(data.humidity)
        : latestSensorData.humidity,
    pressure:
      data.pressure !== undefined
        ? Number(data.pressure)
        : latestSensorData.pressure,
    aqi: data.aqi !== undefined ? Number(data.aqi) : latestSensorData.aqi,
    ecg: data.ecg !== undefined ? Number(data.ecg) : latestSensorData.ecg,
    gsr: data.gsr !== undefined ? Number(data.gsr) : latestSensorData.gsr,
    timestamp: new Date(),
  };

  // Calculate risk, cyclone prediction, and integrated stress level
  currentRisk = calculateRisk(latestSensorData);
  const cyclone = calculateCyclonePrediction(latestSensorData);
  const stress = calculateCompositeStress(latestSensorData);

  // Send updated data to every connected frontend
  io.emit("sensorUpdate", {
    sensors: latestSensorData,
    risk: currentRisk,
    cyclone: cyclone,
    stress: stress,
    situation: currentSituation,
  });

  res.json({
    success: true,
    message: "Sensor data received",
    data: latestSensorData,
    risk: currentRisk,
    cyclone: cyclone,
    stress: stress,
    situation: currentSituation,
  });
});

// ==========================================
// RISK CALCULATION
// ==========================================

function calculateRisk(data) {
  let score = 0;
  let customMsg = [];

  // ------------------------------
  // HEART RATE & ECG (MAX30102 / AD8232)
  // ------------------------------
  if (data.heartRate > 140) {
    score += 35;
    customMsg.push("Severe Tachycardia / Cardiac Stress");
  } else if (data.heartRate > 120) {
    score += 30;
    customMsg.push("Elevated Heart Rate");
  } else if (data.heartRate > 100) {
    score += 15;
  }

  // ------------------------------
  // SPO2 (MAX30102)
  // ------------------------------
  if (data.spo2 < 88) {
    score += 45;
    customMsg.push("Critical Hypoxia (Low SpO2)");
  } else if (data.spo2 < 92) {
    score += 30;
    customMsg.push("Low Oxygen Saturation");
  } else if (data.spo2 < 95) {
    score += 15;
  }

  // ------------------------------
  // BODY TEMPERATURE (MAX30205)
  // ------------------------------
  if (data.bodyTemperature > 39.5) {
    score += 35;
    customMsg.push("High Fever / Heat Hyperpyrexia");
  } else if (data.bodyTemperature > 38.5) {
    score += 20;
    customMsg.push("Elevated Body Temp");
  }

  // ------------------------------
  // AMBIENT TEMP (BME280)
  // ------------------------------
  if (data.ambientTemperature > 40) {
    score += 25;
    customMsg.push("Extreme Environmental Heat Stress");
  }

  // ------------------------------
  // BME280 CYCLONE & BAROMETRIC PRESSURE DROP
  // ------------------------------
  const cyclone = calculateCyclonePrediction(data);
  if (cyclone.score >= 70) {
    score += 40;
    customMsg.push(`Severe Cyclone Alert (Pressure: ${data.pressure || 968} hPa)`);
  } else if (cyclone.score >= 40) {
    score += 20;
    customMsg.push(`Low Pressure Trough (${data.pressure || 1002} hPa)`);
  }

  // ------------------------------
  // GSR SENSOR (Galvanic Skin Response - Stress Level)
  // ------------------------------
  const gsrVal = data.gsr !== undefined ? Number(data.gsr) : 3.5;
  if (gsrVal > 15.0) {
    score += 35;
    customMsg.push(`Critical Stress Crisis (GSR: ${gsrVal.toFixed(1)} µS)`);
  } else if (gsrVal > 10.0) {
    score += 20;
    customMsg.push(`Elevated Stress Level (GSR: ${gsrVal.toFixed(1)} µS)`);
  }

  // ------------------------------
  // AIR QUALITY (ENS160)
  // ------------------------------
  if (data.aqi > 250) {
    score += 35;
    customMsg.push("Hazardous Air Pollution Index");
  } else if (data.aqi > 150) {
    score += 25;
    customMsg.push("Poor Air Quality");
  } else if (data.aqi > 100) {
    score += 15;
  }

  // ------------------------------
  // DETERMINE RISK LEVEL
  // ------------------------------
  let level;
  let message;

  if (score >= 60) {
    level = "HIGH";
    message =
      customMsg.length > 0
        ? `CRITICAL RISK: ${customMsg.join(" • ")}`
        : "Multiple abnormal parameters detected. Immediate attention recommended.";
  } else if (score >= 30) {
    level = "MODERATE";
    message =
      customMsg.length > 0
        ? `WARNING: ${customMsg.join(" • ")}`
        : "Some health or environmental parameters require monitoring.";
  } else {
    level = "LOW";
    message = "Health parameters are within normal range.";
  }

  return {
    level: level,
    score: score,
    message: message,
  };
}

// ==========================================
// GET CURRENT RISK & CYCLONE PREDICTION
// ==========================================

app.get("/api/risk/current", (req, res) => {
  const cyclone = calculateCyclonePrediction(latestSensorData);
  res.json({
    success: true,
    risk: currentRisk,
    cyclone: cyclone,
    situation: currentSituation,
  });
});

// ==========================================
// DEMO DATA GENERATOR
// ==========================================

let demoMode = true;

function generateDemoData() {
  const jitter = (val, maxDelta = 2, isFloat = false) => {
    const delta = Math.random() * maxDelta * 2 - maxDelta;
    let res = val + delta;
    if (isFloat) return Number(res.toFixed(1));
    return Math.round(res);
  };

  latestSensorData = {
    ...latestSensorData,
    heartRate: Math.max(
      50,
      Math.min(190, jitter(latestSensorData.heartRate, 2)),
    ),
    spo2: Math.max(70, Math.min(100, jitter(latestSensorData.spo2, 0.5))),
    bodyTemperature: Math.max(
      35,
      Math.min(42, jitter(latestSensorData.bodyTemperature, 0.1, true)),
    ),
    ambientTemperature: Math.max(
      15,
      Math.min(50, jitter(latestSensorData.ambientTemperature, 0.2, true)),
    ),
    humidity: Math.max(20, Math.min(98, jitter(latestSensorData.humidity, 1))),
    pressure: Math.max(
      950,
      Math.min(1040, jitter(latestSensorData.pressure || 1013.25, 0.8, true)),
    ),
    aqi: Math.max(10, Math.min(500, jitter(latestSensorData.aqi, 2))),
    ecg: Math.max(50, Math.min(190, jitter(latestSensorData.ecg, 3))),
    gsr: Math.max(1.0, Math.min(25.0, jitter(latestSensorData.gsr || 3.5, 0.3, true))),
    timestamp: new Date(),
  };

  currentRisk = calculateRisk(latestSensorData);
  const cyclone = calculateCyclonePrediction(latestSensorData);
  const stress = calculateCompositeStress(latestSensorData);

  // Send data to frontend
  io.emit("sensorUpdate", {
    sensors: latestSensorData,
    risk: currentRisk,
    cyclone: cyclone,
    stress: stress,
    situation: currentSituation,
  });
}

// ==========================================
// START DEMO SIMULATION
// ==========================================

if (demoMode) {
  setInterval(() => {
    generateDemoData();
  }, 2000);
}

// ==========================================
// SOCKET.IO CONNECTION
// ==========================================

io.on("connection", (socket) => {
  console.log("Frontend connected:", socket.id);

  const cyclone = calculateCyclonePrediction(latestSensorData);
  const stress = calculateCompositeStress(latestSensorData);

  // Send current data immediately
  socket.emit("sensorUpdate", {
    sensors: latestSensorData,
    risk: currentRisk,
    cyclone: cyclone,
    stress: stress,
    situation: currentSituation,
  });

  //.: Socket listener for frontend setting situation
  socket.on("setSituation", (sit) => {
    if (DEMO_SITUATIONS[sit]) {
      currentSituation = sit;
      latestSensorData = {
        ...latestSensorData,
        ...DEMO_SITUATIONS[sit],
        timestamp: new Date(),
      };
      currentRisk = calculateRisk(latestSensorData);
      const cycl = calculateCyclonePrediction(latestSensorData);
      const str = calculateCompositeStress(latestSensorData);
      io.emit("sensorUpdate", {
        sensors: latestSensorData,
        risk: currentRisk,
        cyclone: cycl,
        stress: str,
        situation: currentSituation,
      });
    }
  });

  //.: Socket listener for manual hardware sensor changes
  socket.on("manualSensorUpdate", (updatedSensors) => {
    currentSituation = updatedSensors.situation || "Custom Hardware Input";
    latestSensorData = {
      ...latestSensorData,
      ...updatedSensors,
      timestamp: new Date(),
    };
    currentRisk = calculateRisk(latestSensorData);
    const cycl = calculateCyclonePrediction(latestSensorData);
    const str = calculateCompositeStress(latestSensorData);
    io.emit("sensorUpdate", {
      sensors: latestSensorData,
      risk: currentRisk,
      cyclone: cycl,
      stress: str,
      situation: currentSituation,
    });
  });

  // When frontend disconnects
  socket.on("disconnect", () => {
    console.log("Frontend disconnected:", socket.id);
  });
});

// ==========================================
// START SERVER
// ==========================================

server.listen(PORT, () => {
  console.log("--------------------------------------");
  console.log("HealthGuard AI Backend");
  console.log("--------------------------------------");
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Demo sensor simulation: ON");
  console.log("BME280 Cyclone Prediction Engine: ONLINE");
  console.log("Multimodal Stress Engine (HR, BodyTemp, SurroundingTemp, SpO2, Humidity, GSR): ONLINE");
  console.log("--------------------------------------");
});

