// Function to simulate real-time data feed
function getRealTimeData() {
    // This is a placeholder. In a real scenario, this would connect to a live data source
    return {
        price: Math.random() * 1000 + 14000, // Simulated price between 14000 and 15000
        timestamp: new Date().toISOString()
    };
}

module.exports = {
    getRealTimeData
};
