#region Using declarations
using System;
using NinjaTrader.Cbi;
using NinjaTrader.Gui.Tools;
using NinjaTrader.NinjaScript.StrategyAnalyzer;
using NinjaTrader.NinjaScript.Strategies;
using NinjaTrader.Data;
using NinjaTrader.NinjaScript.StrategyAnalyzerColumn;
using NinjaTrader.NinjaScript.StrategyGenerator;
#endregion

// Define the namespace for NinjaTrader strategies
namespace NinjaTrader.NinjaScript.Strategies
{
    public class VwapPriceCrossStrategy : Strategy
    {
        // Parameters: customizable values for the strategy
        private double disMax = 1.5;  // Maximum distance (dis) for a sell signal
        private double disMin = -1.5; // Minimum distance (dis) for a buy signal
        private double dis;           // Calculated distance between the price and VWAP
        private double vwapValue;     // Current VWAP value from the indicator
        private bool buySignal = false;  // Flag for buy signal state
        private bool sellSignal = false; // Flag for sell signal state

        // VWAP indicator instance
        private VWAP vwapIndicator;

        // OnStateChange method: Called when the state of the strategy changes
        protected override void OnStateChange()
        {
            // Set default properties when initializing the strategy
            if (State == State.SetDefaults)
            {
                Description = @"Strategy that trades based on the distance between price and VWAP.";
                Name = "VwapPriceCrossStrategy";  // Name of the strategy
                Calculate = Calculate.OnEachTick; // Update strategy on each tick
                IsExitOnSessionCloseStrategy = true; // Exit positions at session close
                ExitOnSessionCloseSeconds = 30; // Exit 30 seconds before session ends
                IsFillLimitOnTouch = false;  // Do not fill limit orders when touched
                MaximumBarsLookBack = MaximumBarsLookBack.TwoHundredFiftySix; // Look back limit for bars
                StartBehavior = StartBehavior.WaitUntilFlat; // Start behavior (flat state)

                // Add VWAP indicator to the strategy (calculated on close prices)
                AddVWAP(Close, 1, 1);
            }
            else if (State == State.DataLoaded)
            {
                // Initialize the VWAP indicator once data is loaded
                vwapIndicator = VWAP(Close, 1, 1);
            }
        }

        // OnBarUpdate method: Called every time a new bar is added (or tick in this case)
        protected override void OnBarUpdate()
        {
            // Ensure enough bars have been loaded for trading
            if (CurrentBar < BarsRequiredToTrade)
                return;

            // Get current VWAP value from the indicator
            vwapValue = vwapIndicator[0];

            // Calculate the distance (dis) between the current price and the VWAP
            dis = Close[0
