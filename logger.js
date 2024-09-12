const { parameters, globalParameters, getCurrentPrice, getCurrentTimeframe, getCumulativeDelta, getDeltaSP500vsNASDAQ, getOpenPositions } = require('./utils');
const { tradingIsActive } = require('./config');
const { initializeKeepAlive } = require('./keepAlive');

const SlidingWindowSize = 30;
let slidingWindowEvents = [];

// Function to log events and maintain sliding window
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
        if (crosses(price, parameter.value)) {  // Assuming crosses is a function that checks for a crossing event
            logEvent("price_cross", parameter.name, timeframe);
        }
    }
}

// Function to log global parameters
function logGlobalParameters(globalParameters) {
    for (const [key, value] of Object.entries(globalParameters)) {
        console.log(`${key}: ${value}`);
    }
}

// Function to monitor cumulative delta
async function monitorCumulativeDelta() {
    const cumulativeDelta = await getCumulativeDelta();
    if (cumulativeDelta.divergence) {
        logEvent("cumulative_delta_divergence", "cumulative_delta", "N/A");
    } else {
        logEvent("price_cross_cumulative_delta", "cumulative_delta", "N/A");
    }
}

// Function to monitor delta between S&P and NASDAQ
async function monitorDeltaSP500vsNASDAQ() {
    const delta = await getDeltaSP500vsNASDAQ();
    logEvent("delta_sp500_vs_nasdaq", `${delta.value}`, "N/A");
}

// Function to resume from open positions
async function resumeFromOpenPositions() {
    const positions = await getOpenPositions();
    positions.forEach(position => {
        logEvent("open_position", position.symbol, position.timeframe);
    });
}

// Main monitoring loop to constantly check trading activity
async function monitorTrading() {
    while (tradingIsActive()) {
        const price = await getCurrentPrice();
        const timeframe = getCurrentTimeframe();

        await monitorPriceCrossings(price, parameters, timeframe);
        await monitorCumulativeDelta();
        await monitorDeltaSP500vsNASDAQ();
        
        // Log global parameters
        logGlobalParameters(globalParameters);

        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before checking again
    }
}

(async function startStrategy() {
    await resumeFromOpenPositions();
    await initializeKeepAlive(monitorTrading);
})();
