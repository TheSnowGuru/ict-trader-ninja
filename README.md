# ICT Event Logger for Trading NASDAQ & S&P

This repository contains a JavaScript implementation of an event logger for trading the NASDAQ and S&P markets using ICT (Inner Circle Trader) principles. The logger monitors significant trading events, such as price crossings over various indicators, and logs them for further analysis.

## Features

- Monitors price crossings over multiple indicators including **EMA, VWAP, Fibonacci levels, support, resistance levels,** etc.
- Logs significant trading events with detailed parameter and timeframe information.
- Can be easily configured for different trading parameters and timeframes.
- Works in real-time to capture and log trading events as they occur.
- Integrated with MetaApi for real-time price retrieval.
- Monitors cumulative delta and delta between S&P and NASDAQ for added confirmation.
- Logs **global parameters including current price, price change, distance from VWAP, highs, lows, open, close, Fibonacci levels, equilibrium levels, recent swing highs and lows.**
- Implements a sliding window to keep track of the last 30 events.
- Includes a **keep-alive mechanism to restar**t the strategy and resume from open positions in case of any breakdown.

## Getting Started

### Prerequisites

- Node.js installed on your system
- MetaApi account credentials
- Basic understanding of JavaScript and trading principles

### Installation

1. Clone the repository
   ```sh
   git clone https://github.com/thesnowguru/ict-event-logger.git
   cd ict-event-logger
