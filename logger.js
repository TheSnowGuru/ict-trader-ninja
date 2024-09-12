const { parameters, globalParameters, initializeDataSource, loadHistoricalData } = require('./utils');
const { tradingIsActive } = require('./config');
const { initializeKeepAlive } = require('./keepAlive');
const { getCurrentPriceNQ, getCurrentPriceSP } = require('./tickHandler');

const SlidingWindowSize = 30;
let slidingWindowEvents = [];

// Function to log events and maintain a sliding window
function logEvent(eventType, parameter, timeframe) {
    const eventMessage = `price_cross_${parameter}_${timeframe}`;
    console.log(eventMessage);

    if (slidingWindowEvents.length >= SlidingWindowSize) {
        slidingWindowEvents.shift();
    }
    slidingWindowEvents.push({ eventType: eventMessage, timestamp: new Date() });
}

// Function to detect Fair Value Gaps (FVG) for multiple timeframes
function detectFVG(price, priceData, timeframe) {
    let fvgDetected = false;
    // Example logic to detect FVG
    // You need to implement the specific criteria for detecting FVG based on priceData for the given timeframe
    // This is just a placeholder
    if (someConditionForFVG(priceData)) { // Replace `someConditionForFVG` with actual FVG detection logic
        fvgDetected = true;
    }
    return fvgDetected;
}

// Function to monitor price crossings with specified parameters and timeframes
async function monitorPriceCrossings(price, parameters, timeframe) {
    for (const parameter of parameters) {
        if (crosses(price, parameter.value)) {
            logEvent("price_cross", parameter.name, timeframe);
        }
    }

    // Monitor cross events for global parameters
    if (crosses(price, globalParameters.weeklyOpen)) {
        logEvent("price_cross", "weeklyOpen", "N/A");
    }
    if (crosses(price, globalParameters.monthlyOpen)) {
        logEvent("price_cross", "monthlyOpen", "N/A");
    }
    if (crosses(price, globalParameters.dailyOpeningPrice)) {
        logEvent("price_cross", "dailyOpeningPrice", "N/A");
    }
    if (crosses(price, globalParameters.dailyPercentChange)) {
        logEvent("price_cross", "dailyPercentChange", "N/A");
    }

    // Monitor for Fair Value Gaps (FVG)
    const timeframes = ["1m", "5m", "15m"];  // Example timeframes
    for (const tf of timeframes) {
        // Assume getHistoricalData is a function that fetches price data for the timeframe
        const priceData = getHistoricalData(price, tf);
        if (detectFVG(price, priceData, tf)) {
            logEvent("FVG_detected", "FVG", tf);
        }
    }

    // Trigger events for big round numbers
    if (isBigRoundNumber(price)) {
        logEvent("big_round_number", price, timeframe);
    }

    // Monitor pivot points
    if (crosses(price, globalParameters.pivotPoints)) {
        logEvent("pivot_point_cross", `${price}_level`, "N/A");
    }
}

// Function to check if the price is a big round number
function isBigRoundNumber(price) {
    return price % 1000 === 0; // Example condition for a big round number
}

// Function to log global parameters
function logGlobalParameters(globalParameters) {
    for (const [key, value] of Object.entries(globalParameters)) {
        console.log(`${key}: ${value}`);
    }
}


// Function to check and log Kill Zones
function checkKillZones() {
    const now = new Date();
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();

    if (7 * 60 + 4 * hours + minutes > 0) logEvent("KillerZone Start", "New York AM", "N/A");
    if (11 * 60 + 60 * hours + minutes > 0) logEvent("KillerZone End", "NY PM/Lunch", "N/A");
    if (13 * 60 + 60 * hours + minutes > 0) logEvent("KillerZone End", "London Close", "N/A");
}

// Main monitoring loop to constantly check trading activity
async function monitorTrading() {
    await initializeDataSource();
    await resumeFromOpenPositions();

    while (tradingIsActive()) {
        const priceNQ = await getCurrentPriceNQ();
        const priceSP = await getCurrentPriceSP();
        const timeframe = await getCurrentTimeframe();

        await monitorPriceCrossings(priceNQ, parameters, timeframe);
        await monitorPriceCrossings(priceSP, parameters, timeframe);

        // Log global parameters
        logGlobalParameters(globalParameters);
        checkKillZones();

        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before checking again
    }
}

// Start the strategy
(async function startStrategy() {
    await initializeKeepAlive(monitorTrading);
})();
