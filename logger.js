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

// Function to monitor price crossings with specified parameters and timeframes
async function monitorPriceCrossings(price, parameters, timeframe) {
    for (const parameter of parameters) {
        if (crosses(price, parameter.value)) {
            logEvent("price_cross", parameter.name, timeframe);
        }
    }

    // Monitor cross events for global parameters
    if (crosses(price, globalParameters.weeklyOpen)) {
        logEvent("price_cross", "weeklyOpen", timeframe);
    }
    if (crosses(price, globalParameters.monthlyOpen)) {
        logEvent("price_cross", "monthlyOpen", timeframe);
    }
    if (crosses(price, globalParameters.dailyOpeningPrice)) {
        logEvent("price_cross", "dailyOpeningPrice", timeframe);
    }

    // Trigger events for big round numbers
    if (isBigRoundNumber(price)) {
        logEvent("big_round_number", price, timeframe);
    }

    // Monitor pivot points
    if (crosses(price, globalParameters.pivotPoints)) {
        logEvent("pivot_point_cross", price, timeframe);
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

// Function to resume from open positions
async function resumeFromOpenPositions() {
    const positions =
