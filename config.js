const dotenv = require('dotenv');
const fs = require('fs');

// Check if .env file exists
if (fs.existsSync('.env')) {
    dotenv.config();
} else {
    console.warn('.env file not found. Using default configuration.');
}

module.exports = {
    tradingIsActive: function() {
        // Logic to determine if trading is active (simplified for this example)
        return process.env.TRADING_ACTIVE === 'true' || true;
    }
};
