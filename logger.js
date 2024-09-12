const { parameters, getCurrentPrice, getCurrentTimeframe } = require('./utils');
const { tradingIsActive } = require('./config');

// Function to log events
function logEvent(eventType, parameter, timeframe) {
    const eventMessage = `price_cross_${parameter}_${timeframe}`;
    console.log(eventMessage);
}

// Function to monitor price crossings with specified parameters and timeframes
function monitorPriceCrossings(price, parameters, timeframe) {
    parameters.forEach(parameter => {
        if (crosses(price, parameter.value)) {  // Assuming crosses is a function that checks for a crossing event
            logEvent("price_cross", parameter.name, timeframe);
        }
    });
}

// Main monitoring loop to constantly check trading activity
async function monitorTrading() {
    while (tradingIsActive()) {
        const price = await getCurrentPrice();
        const timeframe = getCurrentTimeframe();

        monitorPriceCrossings(price, parameters, timeframe);
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before checking again
    }
}

monitorTrading();
