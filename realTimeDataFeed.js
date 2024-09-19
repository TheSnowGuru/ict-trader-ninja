const historicalData = [];

// Function to simulate real-time data feed
function getRealTimeData() {
    const data = {
        price: Math.random() * 1000 + 14000, // Simulated price between 14000 and 15000
        timestamp: new Date().toISOString()
    };
    
    // Add the new data point to the historical data
    historicalData.push(data);
    
    // Keep only the last 200 data points
    if (historicalData.length > 200) {
        historicalData.shift();
    }
    
    return data;
}

// Function to get historical data from real-time feed
function getHistoricalDataFromRealTime(timeframe) {
    // For simplicity, we're ignoring the timeframe parameter here
    // In a real implementation, you'd filter the data based on the timeframe
    return historicalData.slice(-100);
}

module.exports = {
    getRealTimeData,
    getHistoricalDataFromRealTime
};
