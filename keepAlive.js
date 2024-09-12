const { getCurrentPrice, getCurrentTimeframe, getOpenPositions } = require('./utils');
const { tradingIsActive } = require('./config');

async function initializeKeepAlive(monitorTrading) {
    try {
        await monitorTrading();
    } catch (error) {
        console.error('Strategy stopped unexpectedly:', error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before restarting
        await resumeFromOpenPositions();
        initializeKeepAlive(monitorTrading);
    }
}

// Function to resume from open positions
async function resumeFromOpenPositions() {
    const positions = await getOpenPositions();
    positions.forEach(position => {
        logEvent("open_position", position.symbol, position.timeframe);
    });
}

module.exports = {
    initializeKeepAlive
};
