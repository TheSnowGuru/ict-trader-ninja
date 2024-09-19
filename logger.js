const { parameters, getGlobalParameters, getCurrentTimeframe, crosses } = require('./utils');
const { tradingIsActive } = require('./config');
const { initializeKeepAlive } = require('./keepAlive');
const { getRealTimeData, getHistoricalDataFromRealTime } = require('./realTimeDataFeed');
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');

let globalParameters = {};

const args = process.argv.slice(2);
const isCsvMode = args.includes('-csv');

// This script can be run directly with Node
if (require.main === module) {
    (async () => {
        globalParameters = await getGlobalParameters();
        if (isCsvMode) {
            const inputCsvPath = path.join(__dirname, 'data', 'input.csv');
            const outputCsvPath = path.join(__dirname, 'data', 'output.csv');
            await processCSV(inputCsvPath, outputCsvPath);
        } else {
            await initializeKeepAlive(monitorTrading);
        }
    })();
}
const SlidingWindowSize = 30;
let slidingWindowEvents = [];

// Function to log events and maintain a sliding window
function logEvent(eventType, parameter, timeframe) {
    const eventMessage = `${eventType}_${parameter}_${timeframe}`;
    const timestamp = new Date().toISOString();
    const eventName = parameter;

    console.log(`${timestamp}, ${eventName}, ${eventType}, ${eventMessage}`);

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
    if (globalParameters.dailyOpeningPrice && crosses(price, globalParameters.dailyOpeningPrice)) {
        logEvent("price_cross", "dailyOpeningPrice", "N/A");
    }
    if (globalParameters.dailyPercentChange && crosses(price, globalParameters.dailyPercentChange)) {
        logEvent("price_cross", "dailyPercentChange", "N/A");
    }

    // Monitor for Fair Value Gaps (FVG)
    const timeframes = ["1m", "5m", "15m"];  // Example timeframes
    for (const tf of timeframes) {
        const priceData = await getHistoricalData(price, tf);
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
        logEvent("pivot_point_cross", `level_${price}`, "N/A");
    }
}

// Function to check if the price is a big round number
function isBigRoundNumber(price) {
    return price % 1000 === 0; // Example condition for a big round number
}

// Function to get historical data
async function getHistoricalData(price, timeframe) {
    if (isCsvMode) {
        return getHistoricalDataFromCSV(timeframe);
    } else {
        return getHistoricalDataFromRealTime(timeframe);
    }
}

// Function to get historical data from CSV
function getHistoricalDataFromCSV(timeframe) {
    // Assuming the CSV data is stored in a global variable or accessible somehow
    // This is a placeholder implementation
    return results.slice(0, 100).map(row => ({
        timestamp: row.timestamp,
        price: parseFloat(row.midprice)
    }));
}

// Function to log global parameters
async function logGlobalParameters() {
    const globalParameters = await getGlobalParameters();
    for (const [key, value] of Object.entries(globalParameters)) {
        console.log(`${key}: ${value}`);
    }
}

// Function to log events from CSV and calculate future prices
async function logEventsFromCSV(csvFilePath, outputCsvPath) {
    const results = [];
    const csvWriter = createCsvWriter({
        path: outputCsvPath,
        header: [
            {id: 'timestamp', title: 'TIMESTAMP'},
            {id: 'price', title: 'PRICE'},
            {id: 'eventName', title: 'EVENT_NAME'},
            {id: 'priceAfter15m', title: 'PRICE_AFTER_15M'},
            {id: 'priceAfter60m', title: 'PRICE_AFTER_60M'},
            {id: 'priceAfter4H', title: 'PRICE_AFTER_4H'},
            {id: 'priceAfter24H', title: 'PRICE_AFTER_24H'}
        ]
    });

    return new Promise((resolve, reject) => {
        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (data) => {
                console.log(data);
                results.push(data);
            })
            .on('end', async () => {
                const processedResults = results.map((row, index) => {
                    return {
                        timestamp: row.timestamp,
                        price: parseFloat(row.price),
                        eventName: row.eventName,
                        priceAfter15m: index + 15 < results.length ? results[index + 15].price : 'N/A',
                        priceAfter60m: index + 60 < results.length ? results[index + 60].price : 'N/A',
                        priceAfter4H: index + 240 < results.length ? results[index + 240].price : 'N/A',
                        priceAfter24H: index + 1440 < results.length ? results[index + 1440].price : 'N/A'
                    };
                });

                try {
                    await csvWriter.writeRecords(processedResults);
                    console.log('CSV file was written successfully');
                    resolve();
                } catch (error) {
                    console.error('Error writing CSV file:', error);
                    reject(error);
                }
            });
    });
}


// Function to check and log Kill Zones
function checkKillZones() {
    const now = new Date();
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();

    if (7 * 60 + 4 * hours + minutes > 0) logEvent("killzoneNYstart", "New York AM", "N/A");
    if (11 * 60 + 60 * hours + minutes > 0) logEvent("killzoneNYlunch", "NY PM/Lunch", "N/A");
    if (13 * 60 + 60 * hours + minutes > 0) logEvent("killzoneLondonClose", "London Close", "N/A");
}

// Main monitoring loop to constantly check trading activity
async function monitorTrading() {
    while (tradingIsActive()) {
        const { price, timestamp } = getRealTimeData();
        const timeframe = getCurrentTimeframe();

        await monitorPriceCrossings(price, parameters, timeframe);

        // Log global parameters
        await logGlobalParameters();
        checkKillZones();

        // Log the event
        logEvent("price_update", price, timeframe);

        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before checking again
    }
}

// Start the strategy
(async function startStrategy() {
    await initializeKeepAlive(monitorTrading);
})();
async function processCSV(inputCsvPath, outputCsvPath) {
    const results = [];
    const csvWriter = createCsvWriter({
        path: outputCsvPath,
        header: [
            {id: 'timestamp', title: 'TIMESTAMP'},
            {id: 'midprice', title: 'MIDPRICE'},
            {id: 'eventName', title: 'EVENT_NAME'}
        ]
    });

    return new Promise((resolve, reject) => {
        fs.createReadStream(inputCsvPath)
            .pipe(csv())
            .on('data', (data) => {
                const eventName = `price_update_${data.midprice}`;
                logEvent("price_update", data.midprice, "CSV");
                results.push({
                    timestamp: data.timestamp,
                    midprice: parseFloat(data.midprice),
                    eventName: eventName
                });
            })
            .on('end', async () => {
                try {
                    await csvWriter.writeRecords(results);
                    console.log('CSV processing completed. Output written to:', outputCsvPath);
                    resolve();
                } catch (error) {
                    console.error('Error writing CSV file:', error);
                    reject(error);
                }
            });
    });
}
