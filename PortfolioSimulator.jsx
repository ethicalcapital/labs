        const { useState, useEffect, useRef, useMemo, useCallback } = React;

        // Configuration Constants
        const CONFIG = {
            DEFAULT_PORTFOLIO: 1000000,
            MIN_PORTFOLIO: 10000,
            MAX_PORTFOLIO: 100000000,
            DEFAULT_SIMULATIONS: 2000,
            MIN_SIMULATIONS: 100,
            MAX_SIMULATIONS: 10000,
            DEFAULT_YEARS: 30,
            MIN_YEARS: 5,
            MAX_YEARS: 50,
            REBALANCING_COSTS: {
                annual: 0.001,
                quarterly: 0.003,
                monthly: 0.006
            },
            CHART_COLORS: {
                growth: '#10b981',
                income: '#3b82f6',
                diversification: '#8b5cf6',
                success: '#22c55e',
                warning: '#f59e0b',
                danger: '#ef4444'
            }
        };

        // Investment Strategy Definitions
        const STRATEGIES = {
            growth: {
                name: 'Growth',
                description: 'High quality concentrated portfolio',
                expectedReturn: 9.5,
                volatility: 18,
                color: CONFIG.CHART_COLORS.growth,
                details: 'Concentrated holdings in high-quality growth companies. Maximum long-term returns but higher short-term volatility.',
                examples: 'Large-cap growth stocks, technology leaders, innovative companies'
            },
            income: {
                name: 'Income',
                description: 'Dividend & income focus',
                expectedReturn: 6.5,
                volatility: 10,
                color: CONFIG.CHART_COLORS.income,
                details: 'Dividend-paying stocks and fixed income. Provides stability and regular income.',
                examples: 'Dividend aristocrats, REITs, investment-grade bonds'
            },
            diversification: {
                name: 'Diversification',
                description: 'Broad market exposure',
                expectedReturn: 7.5,
                volatility: 12,
                color: CONFIG.CHART_COLORS.diversification,
                details: 'Diversified across sectors and asset classes. Reduces concentration risk.',
                examples: 'Index funds, sector ETFs, international exposure'
            }
        };

        // Preset allocations
        const ALLOCATION_PRESETS = {
            aggressive: {
                name: 'Long Horizon',
                description: '15+ years to goal',
                growth: 100,
                income: 0,
                diversification: 0
            },
            growth_focused: {
                name: 'Growth Focused',
                description: '10-15 years to goal',
                growth: 70,
                income: 10,
                diversification: 20
            },
            balanced: {
                name: 'Balanced',
                description: '5-10 years to goal',
                growth: 40,
                income: 20,
                diversification: 40
            },
            conservative: {
                name: 'Conservative',
                description: 'Near retirement',
                growth: 20,
                income: 40,
                diversification: 40
            },
            preservation: {
                name: 'Preservation',
                description: 'In retirement',
                growth: 10,
                income: 60,
                diversification: 30
            }
        };

        const QUICK_PORTFOLIO_VALUES = [10000, 100000, 1000000];

        const ACCOUNT_TYPE_PRESETS = {
            balanced: {
                label: 'Balanced (40/40/20)',
                values: { taxable: 40, taxDeferred: 40, roth: 20 }
            },
            taxEfficient: {
                label: 'Tax Efficient (30/50/20)',
                values: { taxable: 30, taxDeferred: 50, roth: 20 }
            },
            growthTaxable: {
                label: 'Growth / Taxable Heavy (60/25/15)',
                values: { taxable: 60, taxDeferred: 25, roth: 15 }
            },
            rothFocused: {
                label: 'Roth Focused (20/30/50)',
                values: { taxable: 20, taxDeferred: 30, roth: 50 }
            },
            custom: {
                label: 'Custom',
                values: null
            }
        };

        const matchAccountPreset = (mix) => {
            for (const [key, preset] of Object.entries(ACCOUNT_TYPE_PRESETS)) {
                if (key === 'custom') continue;
                const values = preset.values;
                if (
                    values.taxable === mix.taxable &&
                    values.taxDeferred === mix.taxDeferred &&
                    values.roth === mix.roth
                ) {
                    return key;
                }
            }
            return 'custom';
        };

        const formatCurrency = (value) => `$${Number(value || 0).toLocaleString('en-US')}`;

        const DEFAULT_WITHDRAWAL_PERIODS = [
            { startYear: 11, endYear: 20, annualAmount: 60000, label: 'Early Retirement (Age 60-69)' },
            { startYear: 21, endYear: 40, annualAmount: 80000, label: 'Full Retirement (Age 70+)' }
        ];

        // Stress test scenarios
        const STRESS_SCENARIOS = {
            financial_crisis: {
                name: '2008 Financial Crisis',
                description: 'Severe market downturn',
                returns: [-37, -5, 26, 15, 2]
            },
            dot_com: {
                name: 'Dot-Com Bubble',
                description: 'Tech bubble burst',
                returns: [-9, -11, -22, 28, 10]
            },
            stagflation: {
                name: '1970s Stagflation',
                description: 'High inflation, low growth',
                returns: [-14, -26, 37, 23, -7],
                inflation: 7
            }
        };

        function PortfolioSimulator() {
            // Mode state
            const [isNerdMode, setIsNerdMode] = useState(false);
            const [showDisclaimer, setShowDisclaimer] = useState(true);
            
            // Core inputs with validation
            const [portfolio, setPortfolio] = useState(CONFIG.DEFAULT_PORTFOLIO);
            const [currentIncome, setCurrentIncome] = useState(100000);
            const [savingsRate, setSavingsRate] = useState(15); // Percentage of income saved (can be negative)
            const [savingsYears, setSavingsYears] = useState(10); // Years until retirement/withdrawal starts
            const [riskTolerance, setRiskTolerance] = useState('balanced');
            
            // Account type breakdown for tax-aware withdrawals
            const [accountPreset, setAccountPreset] = useState('balanced');
            const [showAccountDetails, setShowAccountDetails] = useState(false);
            const [accountTypes, setAccountTypes] = useState(() => ACCOUNT_TYPE_PRESETS.balanced.values);
            
            // Tax assumptions
            const [retirementTaxBracket, setRetirementTaxBracket] = useState(12); // Expected retirement bracket
            const [socialSecurityIncome, setSocialSecurityIncome] = useState(0);
            const [standardDeduction, setStandardDeduction] = useState(14600); // 2024 single filer
            
            // Strategy allocation
            const [strategyMix, setStrategyMix] = useState({ 
                growth: 40, 
                income: 20, 
                diversification: 40 
            });
            
            // Withdrawal configuration - now starts after accumulation phase
            const [withdrawalPeriods, setWithdrawalPeriods] = useState(() => DEFAULT_WITHDRAWAL_PERIODS.map(period => ({ ...period })));
            
            // Visual preferences
            const [visualMode, setVisualMode] = useState('paths'); // 'paths', 'buckets', 'waterfall'
            
            // Progressive engagement tracking
            // Advanced settings
            const [inflationRate, setInflationRate] = useState(2.5);
            const [simulations, setSimulations] = useState(CONFIG.DEFAULT_SIMULATIONS);
            const [rebalanceFrequency, setRebalanceFrequency] = useState('quarterly');
            const [showPercentiles, setShowPercentiles] = useState(true);
            const correlationMatrix = useMemo(() => ({
                growthIncome: 0.6,
                growthDiversification: 0.8,
                incomeDiversification: 0.7
            }), []);
            const [includeTaxes, setIncludeTaxes] = useState(false);
            const [taxRate, setTaxRate] = useState(25);
            const [stressScenario, setStressScenario] = useState(null);
            
            // Results
            const [results, setResults] = useState(null);
            const [isCalculating, setIsCalculating] = useState(false);
            
            // Chart refs
            const pathsChartRef = useRef(null);
            const pathsChartInstance = useRef(null);

            // Load saved configuration on mount
            useEffect(() => {
                const saved = localStorage.getItem('portfolioConfig');
                if (saved) {
                    try {
                        const config = JSON.parse(saved);
                        setPortfolio(config.portfolio ?? CONFIG.DEFAULT_PORTFOLIO);
                        setCurrentIncome(config.currentIncome ?? 100000);
                        setSavingsRate(config.savingsRate ?? 15);
                        setSavingsYears(config.savingsYears ?? 10);

                        if (config.strategyMix) {
                            setStrategyMix({
                                growth: config.strategyMix.growth ?? 40,
                                income: config.strategyMix.income ?? 20,
                                diversification: config.strategyMix.diversification ?? 40
                            });
                        }

                        if (config.accountTypes) {
                            const savedTypes = {
                                taxable: config.accountTypes.taxable ?? 40,
                                taxDeferred: config.accountTypes.taxDeferred ?? 40,
                                roth: config.accountTypes.roth ?? 20
                            };
                            setAccountTypes(savedTypes);
                            setAccountPreset(config.accountPreset ?? matchAccountPreset(savedTypes));
                        } else if (config.accountPreset) {
                            setAccountPreset(config.accountPreset);
                        }
                        if (typeof config.showAccountDetails === 'boolean') {
                            setShowAccountDetails(config.showAccountDetails);
                        }

                        if (Array.isArray(config.withdrawalPeriods)) {
                            setWithdrawalPeriods(config.withdrawalPeriods.map(period => ({
                                startYear: period.startYear ?? 1,
                                endYear: period.endYear ?? (period.startYear ?? 1),
                                annualAmount: period.annualAmount ?? 0,
                                label: period.label ?? ''
                            })));
                        }

                        if (typeof config.retirementTaxBracket === 'number') {
                            setRetirementTaxBracket(config.retirementTaxBracket);
                        }
                        if (typeof config.socialSecurityIncome === 'number') {
                            setSocialSecurityIncome(config.socialSecurityIncome);
                        }
                        if (typeof config.standardDeduction === 'number') {
                            setStandardDeduction(config.standardDeduction);
                        }
                        if (typeof config.includeTaxes === 'boolean') {
                            setIncludeTaxes(config.includeTaxes);
                        }
                        if (typeof config.taxRate === 'number') {
                            setTaxRate(config.taxRate);
                        }
                        if (typeof config.showPercentiles === 'boolean') {
                            setShowPercentiles(config.showPercentiles);
                        }
                        if (config.stressScenario) {
                            setStressScenario(config.stressScenario);
                        }
                        setInflationRate(config.inflationRate ?? 2.5);
                        setSimulations(config.simulations ?? CONFIG.DEFAULT_SIMULATIONS);
                    } catch (e) {
                        console.error('Failed to load saved config:', e);
                    }
                }
            }, []);

            useEffect(() => {
                if (accountPreset === 'custom') {
                    return;
                }
                const preset = ACCOUNT_TYPE_PRESETS[accountPreset];
                if (!preset || !preset.values) {
                    return;
                }
                const nextValues = preset.values;
                setAccountTypes((prev) => {
                    if (
                        prev.taxable === nextValues.taxable &&
                        prev.taxDeferred === nextValues.taxDeferred &&
                        prev.roth === nextValues.roth
                    ) {
                        return prev;
                    }
                    return { ...nextValues };
                });
            }, [accountPreset]);

            useEffect(() => {
                if (isNerdMode) {
                    setShowAccountDetails(true);
                }
            }, [isNerdMode]);

            // Save configuration when it changes
            useEffect(() => {
                const config = {
                    portfolio,
                    currentIncome,
                    savingsRate,
                    savingsYears,
                    strategyMix,
                    accountTypes,
                    withdrawalPeriods,
                    retirementTaxBracket,
                    socialSecurityIncome,
                    standardDeduction,
                    includeTaxes,
                    taxRate,
                    showPercentiles,
                    accountPreset,
                    showAccountDetails,
                    stressScenario,
                    inflationRate,
                    simulations
                };
                localStorage.setItem('portfolioConfig', JSON.stringify(config));
            }, [portfolio, currentIncome, savingsRate, savingsYears, strategyMix, accountTypes, withdrawalPeriods, retirementTaxBracket, socialSecurityIncome, standardDeduction, includeTaxes, taxRate, showPercentiles, accountPreset, showAccountDetails, stressScenario, inflationRate, simulations]);

            // Calculate simulation years based on withdrawal periods
            const getSimulationYears = useCallback(() => {
                return Math.max(...withdrawalPeriods.map(p => p.endYear), CONFIG.DEFAULT_YEARS);
            }, [withdrawalPeriods]);

            // Calculate effective portfolio parameters with proper correlation
            const getEffectiveParameters = useCallback((mixOverride) => {
                const mix = mixOverride ?? strategyMix;
                const total = mix.growth + mix.income + mix.diversification;
                const normalized = total !== 100 ? {
                    growth: (mix.growth / total) * 100,
                    income: (mix.income / total) * 100,
                    diversification: (mix.diversification / total) * 100
                } : mix;
                
                // Weighted average return
                const weightedReturn = 
                    (STRATEGIES.growth.expectedReturn * normalized.growth +
                     STRATEGIES.income.expectedReturn * normalized.income +
                     STRATEGIES.diversification.expectedReturn * normalized.diversification) / 100;
                
                // Calculate volatility with correlation matrix
                const weights = [normalized.growth / 100, normalized.income / 100, normalized.diversification / 100];
                const vols = [STRATEGIES.growth.volatility, STRATEGIES.income.volatility, STRATEGIES.diversification.volatility];
                
                // Portfolio variance calculation with correlation
                let portfolioVariance = 0;
                portfolioVariance += Math.pow(weights[0] * vols[0], 2); // Growth variance
                portfolioVariance += Math.pow(weights[1] * vols[1], 2); // Income variance  
                portfolioVariance += Math.pow(weights[2] * vols[2], 2); // Diversification variance
                portfolioVariance += 2 * weights[0] * weights[1] * vols[0] * vols[1] * correlationMatrix.growthIncome;
                portfolioVariance += 2 * weights[0] * weights[2] * vols[0] * vols[2] * correlationMatrix.growthDiversification;
                portfolioVariance += 2 * weights[1] * weights[2] * vols[1] * vols[2] * correlationMatrix.incomeDiversification;
                
                const effectiveVolatility = Math.sqrt(portfolioVariance);
                
                // Apply rebalancing costs
                const rebalancingCost = CONFIG.REBALANCING_COSTS[rebalanceFrequency] || 0;
                const netReturn = weightedReturn - rebalancingCost * 100;
                
                return {
                    expectedReturn: netReturn,
                    volatility: effectiveVolatility,
                    normalized
                };
            }, [strategyMix, correlationMatrix, rebalanceFrequency]);

            // Generate market returns with realistic features
            const generateMarketReturns = useCallback((years, params) => {
                const returns = [];
                let momentum = 0;
                
                // Apply stress scenario if selected
                if (stressScenario && STRESS_SCENARIOS[stressScenario]) {
                    const scenario = STRESS_SCENARIOS[stressScenario];
                    for (let i = 0; i < Math.min(scenario.returns.length, years); i++) {
                        returns.push(scenario.returns[i]);
                    }
                }
                
                // Generate remaining years
                for (let i = returns.length; i < years; i++) {
                    // Generate base random return
                    const u1 = Math.random();
                    const u2 = Math.random();
                    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                    
                    // Momentum with faster decay
                    momentum = momentum * 0.15 + z0 * 0.85;
                    
                    let annualReturn = params.expectedReturn + momentum * params.volatility;
                    
                    // Sequence of returns risk for early years
                    if (i < 5) {
                        const sequenceMultiplier = 1 + (0.2 * Math.random());
                        if (annualReturn < params.expectedReturn) {
                            annualReturn *= sequenceMultiplier;
                        }
                    }
                    
                    // Fat tails - occasional extreme events
                    if (Math.random() < 0.02) { // 2% chance of extreme event
                        annualReturn *= Math.random() < 0.5 ? 0.5 : 1.5;
                    }
                    
                    returns.push(annualReturn);
                }
                
                return returns;
            }, [stressScenario]);

            // Get withdrawal for year with tax consideration
            const getWithdrawalForYear = useCallback((year, portfolioValue) => {
                for (const period of withdrawalPeriods) {
                    if (year >= period.startYear && year <= period.endYear) {
                        const inflationAdjusted = period.annualAmount * Math.pow(1 + inflationRate / 100, year - 1);
                        
                        // Apply tax if enabled
                        if (includeTaxes) {
                            const grossWithdrawal = inflationAdjusted / (1 - taxRate / 100);
                            return Math.min(grossWithdrawal, portfolioValue);
                        }
                        
                        return Math.min(inflationAdjusted, portfolioValue);
                    }
                }
                return 0;
            }, [withdrawalPeriods, inflationRate, includeTaxes, taxRate]);

            const getAnnualCashFlow = useCallback((year, portfolioValue) => {
                if (year <= savingsYears) {
                    const inflationMultiplier = Math.pow(1 + inflationRate / 100, year - 1);
                    const incomeThisYear = currentIncome * inflationMultiplier;
                    return incomeThisYear * (savingsRate / 100);
                }

                const withdrawal = getWithdrawalForYear(year, portfolioValue);
                return withdrawal > 0 ? -withdrawal : 0;
            }, [savingsYears, inflationRate, currentIncome, savingsRate, getWithdrawalForYear]);

            // Run simulation for specific mix
            const runSimulationForMix = useCallback((mix) => {
                const params = getEffectiveParameters(mix);
                const normalizedMix = params.normalized;
                
                const years = getSimulationYears();
                
                const allPaths = [];
                const finalValues = [];
                let successCount = 0;
                let depletionYears = [];
                
                const rollingReturns = Array(years).fill(0).map(() => []);
                
                for (let sim = 0; sim < simulations; sim++) {
                    const marketReturns = generateMarketReturns(years, params);
                    const portfolioPath = [portfolio];
                    const cashFlowPath = [];
                    let currentValue = portfolio;
                    let depleted = false;
                    let depletionYear = null;
                    
                    for (let year = 1; year <= years; year++) {
                        const cashFlow = getAnnualCashFlow(year, currentValue);
                        cashFlowPath.push(cashFlow);
                        
                        // Apply cash flow (positive = savings, negative = withdrawal)
                        currentValue += cashFlow;
                        
                        // Apply market return
                        const returnRate = marketReturns[year - 1] / 100;
                        currentValue *= (1 + returnRate);
                        
                        rollingReturns[year - 1].push(returnRate);
                        
                        if (currentValue <= 0 && !depleted) {
                            depleted = true;
                            depletionYear = year;
                            currentValue = 0;
                        }
                        
                        portfolioPath.push(currentValue);
                    }
                    
                    allPaths.push({
                        path: portfolioPath,
                        cashFlows: cashFlowPath,
                        returns: marketReturns,
                        finalValue: currentValue,
                        depleted,
                        depletionYear
                    });
                    
                    finalValues.push(currentValue);
                    if (!depleted) successCount++;
                    if (depletionYear) depletionYears.push(depletionYear);
                }
                
                // Calculate year-by-year volatility
                const realizedVolatility = rollingReturns.map(yearReturns => {
                    if (yearReturns.length === 0) return 0;
                    const mean = yearReturns.reduce((a, b) => a + b, 0) / yearReturns.length;
                    const variance = yearReturns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / yearReturns.length;
                    return Math.sqrt(variance) * 100;
                });
                
                // Calculate percentiles
                const sortedPaths = [...allPaths].sort((a, b) => b.finalValue - a.finalValue);
                const percentileIndices = {
                    95: Math.floor(simulations * 0.05),
                    75: Math.floor(simulations * 0.25),
                    50: Math.floor(simulations * 0.50),
                    25: Math.floor(simulations * 0.75),
                    5: Math.floor(simulations * 0.95)
                };
                
                const percentilePaths = {};
                Object.entries(percentileIndices).forEach(([p, idx]) => {
                    percentilePaths[p] = sortedPaths[Math.min(idx, sortedPaths.length - 1)];
                });
                
                // Calculate outcome metrics
                finalValues.sort((a, b) => a - b);
                const percentile90 = finalValues[Math.floor(finalValues.length * 0.9)];
                const percentile10 = finalValues[Math.floor(finalValues.length * 0.1)];
                const outcomeRange = percentile90 - percentile10;
                const relativePredictability = outcomeRange > 0 ? 1 - (outcomeRange / portfolio) : 1;
                
                // Calculate total cash flows (savings and withdrawals)
                const totalSaved = allPaths[0]?.cashFlows
                    .filter((cf, i) => i < savingsYears)
                    .reduce((a, b) => a + Math.max(0, b), 0) || 0;
                const totalWithdrawn = allPaths[0]?.cashFlows
                    .filter((cf, i) => i >= savingsYears)
                    .reduce((a, b) => a + Math.abs(Math.min(0, b)), 0) || 0;
                
                return {
                    allPaths,
                    percentilePaths,
                    successRate: (successCount / simulations) * 100,
                    medianFinal: finalValues[Math.floor(finalValues.length / 2)],
                    percentile10,
                    percentile90,
                    outcomeRange,
                    relativePredictability,
                    averageDepletionYear: depletionYears.length > 0 
                        ? depletionYears.reduce((a, b) => a + b, 0) / depletionYears.length
                        : null,
                    finalValues,
                    realizedVolatility,
                    years,
                    effectiveReturn: params.expectedReturn,
                    effectiveVolatility: params.volatility,
                    mix: normalizedMix,
                    totalSaved,
                    totalWithdrawn,
                    peakValue: Math.max(...allPaths.map(p => Math.max(...p.path)))
                };
            }, [portfolio, simulations, savingsYears, getSimulationYears, generateMarketReturns, getAnnualCashFlow, getEffectiveParameters]);

            // Main simulation runner
            const runSimulation = useCallback(async () => {
                setIsCalculating(true);

                const waitForNextFrame = () => new Promise((resolve) => {
                    if (typeof requestAnimationFrame === 'function') {
                        requestAnimationFrame(() => resolve());
                    } else {
                        setTimeout(resolve, 0);
                    }
                });

                try {
                    await waitForNextFrame();

                    const mainResults = runSimulationForMix(strategyMix);
                    setResults(mainResults);
                } finally {
                    setIsCalculating(false);
                }
            }, [strategyMix, runSimulationForMix]);

            // Update allocation from preset
            const applyPreset = useCallback((presetKey) => {
                const preset = ALLOCATION_PRESETS[presetKey];
                setStrategyMix({
                    growth: preset.growth,
                    income: preset.income,
                    diversification: preset.diversification
                });
                setRiskTolerance(presetKey);
            }, []);

            // Update allocation from slider
            const updateAllocationFromSlider = useCallback((value) => {
                if (value <= 20) {
                    setStrategyMix({ growth: 10, income: 60, diversification: 30 });
                } else if (value <= 40) {
                    setStrategyMix({ growth: 20, income: 40, diversification: 40 });
                } else if (value <= 60) {
                    setStrategyMix({ growth: 40, income: 20, diversification: 40 });
                } else if (value <= 80) {
                    setStrategyMix({ growth: 70, income: 10, diversification: 20 });
                } else {
                    setStrategyMix({ growth: 100, income: 0, diversification: 0 });
                }
            }, []);

            // Calculate slider value from mix
            const getSliderValue = useCallback(() => {
                const growthPct = strategyMix.growth;
                if (growthPct >= 100) return 100;
                if (growthPct >= 70) return 80;
                if (growthPct >= 40) return 60;
                if (growthPct >= 20) return 40;
                return 20;
            }, [strategyMix.growth]);

            // Update main paths chart
            useEffect(() => {
                if (results && pathsChartRef.current) {
                    const ctx = pathsChartRef.current.getContext('2d');
                    
                    if (pathsChartInstance.current) {
                        pathsChartInstance.current.destroy();
                    }
                    
                    const years = Array.from({ length: results.years + 1 }, (_, i) => i);
                    const datasets = [];
                    
                    // Add sample paths
                    const sampleSize = Math.min(50, results.allPaths.length);
                    const step = Math.floor(results.allPaths.length / sampleSize);
                    
                    for (let i = 0; i < sampleSize; i++) {
                        const path = results.allPaths[i * step];
                        const opacity = 0.03;
                        datasets.push({
                            data: path.path,
                            borderColor: path.depleted 
                                ? `rgba(239, 68, 68, ${opacity})` 
                                : `rgba(59, 130, 246, ${opacity})`,
                            borderWidth: 0.5,
                            pointRadius: 0,
                            fill: false,
                            tension: 0.1
                        });
                    }
                    
                    // Add percentile paths
                    if (showPercentiles) {
                        const percentileColors = {
                            95: CONFIG.CHART_COLORS.success,
                            75: CONFIG.CHART_COLORS.income,
                            50: CONFIG.CHART_COLORS.warning,
                            25: '#fb923c',
                            5: CONFIG.CHART_COLORS.danger
                        };
                        
                        Object.entries(results.percentilePaths).forEach(([percentile, pathData]) => {
                            datasets.push({
                                label: `${percentile}th Percentile`,
                                data: pathData.path,
                                borderColor: percentileColors[percentile],
                                borderWidth: percentile === '50' ? 3 : 2,
                                pointRadius: 0,
                                fill: false,
                                tension: 0.2
                            });
                        });
                    }
                    
                    pathsChartInstance.current = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: years,
                            datasets: datasets
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            interaction: {
                                mode: 'index',
                                intersect: false
                            },
                            plugins: {
                                title: {
                                    display: true,
                                    text: `Portfolio Paths - ${strategyMix.growth}% Growth, ${strategyMix.income}% Income, ${strategyMix.diversification}% Diversified`,
                                    font: { size: 14 }
                                },
                                legend: {
                                    display: showPercentiles,
                                    position: 'top',
                                    labels: {
                                        filter: (item) => item.text !== undefined
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        callback: (value) => `$${(value / 1000000).toFixed(1)}M`
                                    },
                                    title: {
                                        display: true,
                                        text: 'Portfolio Value'
                                    }
                                },
                                x: {
                                    title: {
                                        display: true,
                                        text: 'Years'
                                    }
                                }
                            }
                        }
                    });
                }
            }, [results, showPercentiles, strategyMix]);

            // Withdrawal period management
            const addWithdrawalPeriod = useCallback(() => {
                const lastPeriod = withdrawalPeriods[withdrawalPeriods.length - 1];
                const newStart = lastPeriod ? lastPeriod.endYear + 1 : savingsYears + 1;
                setWithdrawalPeriods([
                    ...withdrawalPeriods,
                    { 
                        startYear: newStart, 
                        endYear: newStart + 9, 
                        annualAmount: 60000, 
                        label: `Period ${withdrawalPeriods.length + 1}` 
                    }
                ]);
            }, [withdrawalPeriods, savingsYears]);

            const removeWithdrawalPeriod = useCallback((index) => {
                if (withdrawalPeriods.length > 1) {
                    setWithdrawalPeriods(withdrawalPeriods.filter((_, i) => i !== index));
                }
            }, [withdrawalPeriods]);

            const updateWithdrawalPeriod = useCallback((index, field, value) => {
                const updated = [...withdrawalPeriods];
                updated[index][field] = field === 'annualAmount' ? Number(value) : 
                                        (field === 'label' ? value : Number(value));
                setWithdrawalPeriods(updated);
            }, [withdrawalPeriods]);

            const InfoTooltip = ({ text, example }) => (
                <div className="tooltip inline-block ml-2">
                    <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help inline" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="tooltiptext">
                        {text}
                        {example && (
                            <span className="block mt-2 text-xs italic">
                                Example: {example}
                            </span>
                        )}
                    </span>
                </div>
            );

            const DisclaimerModal = () => (
                <div className="disclaimer-modal">
                    <div className="disclaimer-content">
                        <h2 className="text-xl font-bold mb-4">Important Disclaimer</h2>
                        <div className="text-sm text-gray-600 space-y-3">
                            <p>
                                This tool provides hypothetical illustrations based on Monte Carlo simulations. 
                                Results are not guarantees of future performance.
                            </p>
                            <p>
                                <strong>Key Limitations:</strong>
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Past performance does not guarantee future results</li>
                                <li>Actual returns will vary and may be negative</li>
                                <li>Model assumptions may not reflect actual market conditions</li>
                                <li>Tax implications are simplified or excluded</li>
                                <li>Does not account for all fees and expenses</li>
                            </ul>
                            <p>
                                <strong>Not Personal Advice:</strong> This tool is for educational purposes only. 
                                Consult with a qualified financial advisor before making investment decisions.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowDisclaimer(false)}
                            className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                        >
                            I Understand
                        </button>
                    </div>
                </div>
            );

            return (
                <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-4 sm:py-8 px-4">
                    {showDisclaimer && <DisclaimerModal />}
                    
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Portfolio Strategy Simulator</h1>
                                    <p className="mt-2 text-sm sm:text-base text-gray-600">
                                        Model how combining strategies affects risk and predictability
                                    </p>
                                {!isNerdMode && !showAccountDetails && (
                                    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div>
                                                <h2 className="text-lg sm:text-xl font-semibold">Account mix</h2>
                                                <p className="text-xs text-gray-500">Currently using the {(ACCOUNT_TYPE_PRESETS[accountPreset] ? ACCOUNT_TYPE_PRESETS[accountPreset].label : 'Custom')} preset. Adjust the balance between taxable, tax-deferred, and Roth accounts if needed.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowAccountDetails(true)}
                                                className="labs-button labs-button--outline text-sm"
                                            >
                                                Adjust account types
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Account Types for Tax Planning */}
                                {(isNerdMode || showAccountDetails) && (
                                    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                                            <h2 className="text-lg sm:text-xl font-semibold">Account Types</h2>
                                            {!isNerdMode && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAccountDetails(false)}
                                                    className="labs-button labs-button--outline text-sm"
                                                >
                                                    Done adjusting
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mb-4">Different account types have different tax treatments. Choose a preset or switch to custom to fine-tune the mix.</p>

                                        <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Start with a preset
                                            </label>
                                            <select
                                                value={accountPreset}
                                                onChange={(e) => {
                                                    const nextPreset = e.target.value;
                                                    setAccountPreset(nextPreset);
                                                    if (nextPreset === 'custom') {
                                                        setShowAccountDetails(true);
                                                    }
                                                }}
                                                className="block w-full border-gray-300 rounded-md shadow-sm p-2 border text-sm"
                                            >
                                                {Object.entries(ACCOUNT_TYPE_PRESETS).map(([key, preset]) => (
                                                    <option key={key} value={key}>
                                                        {preset.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {accountPreset !== 'custom' ? (
                                            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                                                <p className="font-semibold text-gray-900">Current mix</p>
                                                <ul className="mt-2 space-y-1">
                                                    <li>Taxable: {ACCOUNT_TYPE_PRESETS[accountPreset].values.taxable}%</li>
                                                    <li>Tax-Deferred: {ACCOUNT_TYPE_PRESETS[accountPreset].values.taxDeferred}%</li>
                                                    <li>Roth: {ACCOUNT_TYPE_PRESETS[accountPreset].values.roth}%</li>
                                                </ul>
                                                <p className="mt-3 text-xs text-gray-500">Select <strong>Custom</strong> to enter your own allocation.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-sm font-medium text-green-700">Taxable (Brokerage)</span>
                                                        <span className="text-sm font-bold">{accountTypes.taxable}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={accountTypes.taxable}
                                                        onChange={(e) => {
                                                            setAccountPreset('custom');
                                                            setAccountTypes({
                                                                ...accountTypes,
                                                                taxable: Number(e.target.value)
                                                            });
                                                            setShowAccountDetails(true);
                                                        }}
                                                        className="w-full"
                                                        style={{
                                                            background: `linear-gradient(to right, #10b981 0%, #10b981 ${accountTypes.taxable}%, #e5e7eb ${accountTypes.taxable}%, #e5e7eb 100%)`
                                                        }}
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Lower long-term capital gains rates.</p>
                                                </div>

                                                <div>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-sm font-medium text-amber-700">Tax-Deferred (401k/IRA)</span>
                                                        <span className="text-sm font-bold">{accountTypes.taxDeferred}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={accountTypes.taxDeferred}
                                                        onChange={(e) => {
                                                            setAccountPreset('custom');
                                                            setAccountTypes({
                                                                ...accountTypes,
                                                                taxDeferred: Number(e.target.value)
                                                            });
                                                            setShowAccountDetails(true);
                                                        }}
                                                        className="w-full"
                                                        style={{
                                                            background: `linear-gradient(to right, #d97706 0%, #d97706 ${accountTypes.taxDeferred}%, #e5e7eb ${accountTypes.taxDeferred}%, #e5e7eb 100%)`
                                                        }}
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Taxed as ordinary income when withdrawn.</p>
                                                </div>

                                                <div>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-sm font-medium text-blue-700">Roth (Tax-Free)</span>
                                                        <span className="text-sm font-bold">{accountTypes.roth}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={accountTypes.roth}
                                                        onChange={(e) => {
                                                            setAccountPreset('custom');
                                                            setAccountTypes({
                                                                ...accountTypes,
                                                                roth: Number(e.target.value)
                                                            });
                                                            setShowAccountDetails(true);
                                                        }}
                                                        className="w-full"
                                                        style={{
                                                            background: `linear-gradient(to right, #2563eb 0%, #2563eb ${accountTypes.roth}%, #e5e7eb ${accountTypes.roth}%, #e5e7eb 100%)`
                                                        }}
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Qualified withdrawals remain tax-free.</p>
                                                </div>

                                                {accountTypes.taxable + accountTypes.taxDeferred + accountTypes.roth !== 100 && (
                                                    <p className="text-xs text-red-600">
                                                        Total: {accountTypes.taxable + accountTypes.taxDeferred + accountTypes.roth}% (will be normalized to 100%)
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        </div>

                                        {!isNerdMode && (
                                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                                <p className="text-xs text-blue-700">
                                                    <strong>Tax-Smart Withdrawal Order:</strong> We'll optimize withdrawals to minimize lifetime taxes using the TDD strategy - filling your standard deduction first, then taxable accounts, preserving Roth for last.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="flex items-center space-x-3">
                                    <span className={`font-medium text-sm ${!isNerdMode ? 'text-blue-600' : 'text-gray-500'}`}>
                                        Simple
                                    </span>
                                    <label className="mode-toggle">
                                        <input 
                                            type="checkbox" 
                                            checked={isNerdMode}
                                            onChange={(e) => setIsNerdMode(e.target.checked)}
                                        />
                                        <span className="slider"></span>
                                    </label>
                                    <span className={`font-medium text-sm ${isNerdMode ? 'text-blue-600' : 'text-gray-500'}`}>
                                        Advanced
                                    </span>
                                </div>
                            </section>
                        </div>

                        <div className="space-y-8">
                            {/* Configuration Form */}
                            <section className="space-y-6">
                                {/* Portfolio Setup */}
                                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                                    <h2 className="text-lg sm:text-xl font-semibold mb-4">Portfolio Setup</h2>
                                    
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Current Portfolio Value
                                                <InfoTooltip text="Total investable assets you want to model today" />
                                            </label>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {QUICK_PORTFOLIO_VALUES.map((value) => (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        onClick={() => setPortfolio(value)}
                                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                                                            portfolio === value
                                                                ? 'bg-blue-600 text-white border-blue-600'
                                                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                                                        }`}
                                                    >
                                                        {formatCurrency(value)}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="mt-3 relative">
                                                <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                <input
                                                    type="number"
                                                    value={portfolio}
                                                    onChange={(e) => setPortfolio(Math.max(CONFIG.MIN_PORTFOLIO, Math.min(CONFIG.MAX_PORTFOLIO, Number(e.target.value))))}
                                                    className="pl-8 block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                                                    min={CONFIG.MIN_PORTFOLIO}
                                                    max={CONFIG.MAX_PORTFOLIO}
                                                />
                                                <p className="mt-1 text-xs text-gray-500">Quick select an amount or enter a custom portfolio value.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Annual Household Income
                                                    <InfoTooltip text="Used to estimate ongoing savings during the accumulation phase." />
                                                </label>
                                                <div className="mt-2 relative">
                                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                    <input
                                                        type="number"
                                                        value={currentIncome}
                                                        onChange={(e) => setCurrentIncome(Math.max(0, Number(e.target.value)))}
                                                        className="pl-8 block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                                                        min={0}
                                                    />
                                                    <p className="mt-1 text-xs text-gray-500">Default assumes {formatCurrency(100000)} in annual income.</p>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Savings Rate (% of income)
                                                </label>
                                                <input
                                                    type="range"
                                                    min="-20"
                                                    max="50"
                                                    step="1"
                                                    value={savingsRate}
                                                    onChange={(e) => setSavingsRate(Number(e.target.value))}
                                                    className="w-full"
                                                />
                                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                    <span>{savingsRate}%</span>
                                                    <span>Annual savings ≈ {formatCurrency(Math.max(savingsRate, 0) * currentIncome / 100)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Years Until Withdrawals Begin
                                                    <InfoTooltip text="After this many years the simulator shifts from saving to drawing down." />
                                                </label>
                                                <input
                                                    type="number"
                                                    value={savingsYears}
                                                    onChange={(e) => setSavingsYears(Math.max(0, Number(e.target.value)))}
                                                    className="mt-2 w-full border-gray-300 rounded-md shadow-sm p-2 border"
                                                    min={0}
                                                    max={60}
                                                />
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                                                <p>
                                                    In simple mode we assume a retirement withdrawal plan after year {savingsYears + 1}. Switch to Advanced mode to craft custom withdrawal periods, tax handling, and stress scenarios.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Strategy Mix */}
                                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                                    <h2 className="text-lg sm:text-xl font-semibold mb-4">
                                        Strategy Mix
                                        <InfoTooltip text="Combine strategies to balance growth and stability. More diversification = more predictable outcomes." />
                                    </h2>

                                    {!isNerdMode ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                                    Risk Level
                                                </label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    step="20"
                                                    value={getSliderValue()}
                                                    onChange={(e) => updateAllocationFromSlider(Number(e.target.value))}
                                                    className="strategy-slider w-full"
                                                />
                                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                    <span>Conservative</span>
                                                    <span>Balanced</span>
                                                    <span>Aggressive</span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Quick presets:
                                                </label>
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(ALLOCATION_PRESETS).map(([key, preset]) => (
                                                        <button
                                                            key={key}
                                                            onClick={() => applyPreset(key)}
                                                            className={`preset-chip px-3 py-1 text-xs rounded-full border ${
                                                                riskTolerance === key 
                                                                    ? 'bg-blue-600 text-white border-blue-600' 
                                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                                                            }`}
                                                        >
                                                            {preset.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <div className="space-y-2">
                                                    {Object.entries(STRATEGIES).map(([key, strategy]) => (
                                                        <div key={key} className="flex justify-between items-center">
                                                            <span className="text-sm font-medium" style={{ color: strategy.color }}>
                                                                {strategy.name}
                                                            </span>
                                                            <span className="text-sm font-bold">{strategyMix[key]}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-3 pt-3 border-t">
                                                    <div className="flex justify-between text-xs text-gray-600">
                                                        <span>Expected Return:</span>
                                                        <span className="font-semibold">
                                                            {getEffectiveParameters().expectedReturn.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-gray-600">
                                                        <span>Volatility:</span>
                                                        <span className="font-semibold">
                                                            {getEffectiveParameters().volatility.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {Object.entries(STRATEGIES).map(([key, strategy]) => (
                                                <div key={key}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-sm font-medium" style={{ color: strategy.color }}>
                                                            {strategy.name}
                                                        </span>
                                                        <span className="text-sm">{strategyMix[key]}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={strategyMix[key]}
                                                        onChange={(e) => setStrategyMix({
                                                            ...strategyMix,
                                                            [key]: Number(e.target.value)
                                                        })}
                                                        className="w-full"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">{strategy.examples}</p>
                                                </div>
                                            ))}
                                            
                                            <div className="pt-3 border-t">
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-600">Expected Return:</span>
                                                        <div className="font-bold text-lg">
                                                            {getEffectiveParameters().expectedReturn.toFixed(1)}%
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Volatility:</span>
                                                        <div className="font-bold text-lg">
                                                            {getEffectiveParameters().volatility.toFixed(1)}%
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Withdrawal Schedule */}
                                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                                    <h2 className="text-lg sm:text-xl font-semibold mb-4">
                                        Retirement Withdrawal Plan
                                        <InfoTooltip text="Define withdrawal amounts for different periods after retirement" />
                                    </h2>
                                    
                                    {savingsYears > 0 && (
                                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                            <p className="text-xs text-blue-700">
                                                Withdrawals will begin in year {savingsYears + 1}, after your savings phase
                                            </p>
                                        </div>
                                    )}
                                    
                                    <div className="space-y-3">
                                        {withdrawalPeriods.map((period, index) => (
                                            <div key={index} className="withdrawal-period">
                                                <div className="flex items-center justify-between mb-2">
                                                    <input
                                                        type="text"
                                                        value={period.label}
                                                        onChange={(e) => updateWithdrawalPeriod(index, 'label', e.target.value)}
                                                        className="font-medium text-sm bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                                                    />
                                                    {withdrawalPeriods.length > 1 && (
                                                        <button
                                                            onClick={() => removeWithdrawalPeriod(index)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            ×
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <label className="text-xs text-gray-500">From Year</label>
                                                        <input
                                                            type="number"
                                                            value={period.startYear}
                                                            onChange={(e) => updateWithdrawalPeriod(index, 'startYear', Math.max(savingsYears + 1, Number(e.target.value)))}
                                                            className="w-full p-1 border rounded text-sm"
                                                            min={savingsYears + 1}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500">To Year</label>
                                                        <input
                                                            type="number"
                                                            value={period.endYear}
                                                            onChange={(e) => updateWithdrawalPeriod(index, 'endYear', Math.max(period.startYear, Number(e.target.value)))}
                                                            className="w-full p-1 border rounded text-sm"
                                                            min={period.startYear}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500">Annual $</label>
                                                        <input
                                                            type="number"
                                                            value={period.annualAmount}
                                                            onChange={(e) => updateWithdrawalPeriod(index, 'annualAmount', e.target.value)}
                                                            className="w-full p-1 border rounded text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        <button
                                            onClick={addWithdrawalPeriod}
                                            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 text-sm"
                                        >
                                            + Add Period
                                        </button>
                                    </div>
                                </div>

                                {/* Advanced Settings */}
                                {isNerdMode && (
                                    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                                        <h2 className="text-lg sm:text-xl font-semibold mb-4">Advanced Settings</h2>
                                        
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Simulations
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={simulations}
                                                        onChange={(e) => setSimulations(Math.max(CONFIG.MIN_SIMULATIONS, Math.min(CONFIG.MAX_SIMULATIONS, Number(e.target.value))))}
                                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border text-sm"
                                                        min={CONFIG.MIN_SIMULATIONS}
                                                        max={CONFIG.MAX_SIMULATIONS}
                                                        step="500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Inflation (%)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={inflationRate}
                                                        onChange={(e) => setInflationRate(Number(e.target.value))}
                                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border text-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Rebalancing Frequency
                                                </label>
                                                <select
                                                    value={rebalanceFrequency}
                                                    onChange={(e) => setRebalanceFrequency(e.target.value)}
                                                    className="block w-full border-gray-300 rounded-md shadow-sm p-2 border text-sm"
                                                >
                                                    <option value="annual">Annual (0.1% cost)</option>
                                                    <option value="quarterly">Quarterly (0.3% cost)</option>
                                                    <option value="monthly">Monthly (0.6% cost)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Stress Test Scenario
                                                </label>
                                                <select
                                                    value={stressScenario || ''}
                                                    onChange={(e) => setStressScenario(e.target.value || null)}
                                                    className="block w-full border-gray-300 rounded-md shadow-sm p-2 border text-sm"
                                                >
                                                    <option value="">None</option>
                                                    {Object.entries(STRESS_SCENARIOS).map(([key, scenario]) => (
                                                        <option key={key} value={key}>
                                                            {scenario.name} - {scenario.description}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={includeTaxes}
                                                        onChange={(e) => setIncludeTaxes(e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">
                                                        Include Tax Impact
                                                    </span>
                                                </label>
                                                {includeTaxes && (
                                                    <input
                                                        type="number"
                                                        value={taxRate}
                                                        onChange={(e) => setTaxRate(Number(e.target.value))}
                                                        className="mt-2 block w-full border-gray-300 rounded-md shadow-sm p-2 border text-sm"
                                                        placeholder="Tax Rate %"
                                                    />
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Retirement Tax Bracket (%)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="50"
                                                        value={retirementTaxBracket}
                                                        onChange={(e) => setRetirementTaxBracket(Math.max(0, Number(e.target.value)))}
                                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Social Security Income ($)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1000"
                                                        value={socialSecurityIncome}
                                                        onChange={(e) => setSocialSecurityIncome(Math.max(0, Number(e.target.value)))}
                                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Standard Deduction ($)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="100"
                                                        value={standardDeduction}
                                                        onChange={(e) => setStandardDeduction(Math.max(0, Number(e.target.value)))}
                                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border text-sm"
                                                    />
                                                </div>
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 sm:pt-6">
                                                    <input
                                                        type="checkbox"
                                                        checked={showPercentiles}
                                                        onChange={(e) => setShowPercentiles(e.target.checked)}
                                                        className="rounded border-gray-300"
                                                    />
                                                    <span>Show percentile bands on charts</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Run Button */}
                                <button
                                    onClick={runSimulation}
                                    disabled={isCalculating}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 font-medium transition-all shadow-lg"
                                >
                                    {isCalculating ? `Running ${simulations.toLocaleString()} Simulations...` : `Run ${simulations.toLocaleString()} Simulations`}
                                </button>
                            </section>

                            {/* Results Panel */}
                            <section className="space-y-4 sm:space-y-6">
                                {results ? (
                                    <>
                                        {/* Visual Mode Toggle */}
                                        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-lg font-semibold">Visualization Style</h3>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setVisualMode('paths')}
                                                        className={`px-3 py-1 rounded text-sm ${visualMode === 'paths' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                                                    >
                                                        Paths
                                                    </button>
                                                    <button
                                                        onClick={() => setVisualMode('buckets')}
                                                        className={`px-3 py-1 rounded text-sm ${visualMode === 'buckets' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                                                    >
                                                        Buckets
                                                    </button>
                                                    <button
                                                        onClick={() => setVisualMode('waterfall')}
                                                        className={`px-3 py-1 rounded text-sm ${visualMode === 'waterfall' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                                                    >
                                                        Tax Flow
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {/* Bucket Visualization */}
                                            {visualMode === 'buckets' && (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className="text-center">
                                                            <div className="h-32 bg-gradient-to-t from-green-600 to-green-400 rounded-lg relative overflow-hidden">
                                                                <div className="absolute bottom-0 w-full bg-green-700 transition-all duration-500"
                                                                     style={{ height: `${accountTypes.taxable}%` }}>
                                                                </div>
                                                                <div className="absolute inset-0 flex items-center justify-center text-white font-bold">
                                                                    {accountTypes.taxable}%
                                                                </div>
                                                            </div>
                                                            <p className="text-xs mt-2 font-medium text-green-700">Taxable</p>
                                                            <p className="text-xs text-gray-500">Lower tax on gains</p>
                                                        </div>
                                                        
                                                        <div className="text-center">
                                                            <div className="h-32 bg-gradient-to-t from-amber-600 to-amber-400 rounded-lg relative overflow-hidden">
                                                                <div className="absolute bottom-0 w-full bg-amber-700 transition-all duration-500"
                                                                     style={{ height: `${accountTypes.taxDeferred}%` }}>
                                                                </div>
                                                                <div className="absolute inset-0 flex items-center justify-center text-white font-bold">
                                                                    {accountTypes.taxDeferred}%
                                                                </div>
                                                            </div>
                                                            <p className="text-xs mt-2 font-medium text-amber-700">Tax-Deferred</p>
                                                            <p className="text-xs text-gray-500">"Tax dirt" - pay later</p>
                                                        </div>
                                                        
                                                        <div className="text-center">
                                                            <div className="h-32 bg-gradient-to-t from-blue-600 to-blue-400 rounded-lg relative overflow-hidden">
                                                                <div className="absolute bottom-0 w-full bg-blue-700 transition-all duration-500"
                                                                     style={{ height: `${accountTypes.roth}%` }}>
                                                                </div>
                                                                <div className="absolute inset-0 flex items-center justify-center text-white font-bold">
                                                                    {accountTypes.roth}%
                                                                </div>
                                                            </div>
                                                            <p className="text-xs mt-2 font-medium text-blue-700">Roth</p>
                                                            <p className="text-xs text-gray-500">"Tax-free sky"</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="p-3 bg-gray-50 rounded-lg">
                                                        <p className="text-xs text-gray-600">
                                                            <strong>Smart Withdrawal Sequence:</strong> Fill standard deduction ({standardDeduction.toLocaleString()}) with tax-deferred first, 
                                                            then tap taxable accounts, preserving tax-free Roth growth. This TDD strategy can save 24-49% in lifetime taxes.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Tax Waterfall */}
                                            {visualMode === 'waterfall' && results && (
                                                <div className="space-y-3">
                                                    <div className="relative">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm font-medium">Withdrawal Sources (Year 15)</span>
                                                            <span className="text-sm text-gray-500">Tax Impact</span>
                                                        </div>
                                                        
                                                        <div className="space-y-2">
                                                            <div className="flex items-center">
                                                                <div className="w-24 text-xs">Std Deduction</div>
                                                                <div className="flex-1 h-8 bg-green-100 rounded flex items-center px-2">
                                                                    <span className="text-xs">$14,600 tax-free</span>
                                                                </div>
                                                                <div className="w-16 text-right text-xs text-green-600">$0</div>
                                                            </div>
                                                            
                                                            <div className="flex items-center">
                                                                <div className="w-24 text-xs">Tax-Deferred</div>
                                                                <div className="flex-1 h-8 bg-amber-100 rounded flex items-center px-2">
                                                                    <span className="text-xs">$25,400 @ {retirementTaxBracket}%</span>
                                                                </div>
                                                                <div className="w-16 text-right text-xs text-amber-600">
                                                                    ${(25400 * retirementTaxBracket / 100).toFixed(0)}
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex items-center">
                                                                <div className="w-24 text-xs">Taxable</div>
                                                                <div className="flex-1 h-8 bg-blue-100 rounded flex items-center px-2">
                                                                    <span className="text-xs">$20,000 @ 15% LTCG</span>
                                                                </div>
                                                                <div className="w-16 text-right text-xs text-blue-600">$3,000</div>
                                                            </div>
                                                            
                                                            {socialSecurityIncome > 0 && (
                                                                <div className="flex items-center">
                                                                    <div className="w-24 text-xs">Soc Security</div>
                                                                    <div className="flex-1 h-8 bg-purple-100 rounded flex items-center px-2">
                                                                        <span className="text-xs">${socialSecurityIncome.toLocaleString()} (85% taxable)</span>
                                                                    </div>
                                                                    <div className="w-16 text-right text-xs text-purple-600">
                                                                        ${(socialSecurityIncome * 0.85 * retirementTaxBracket / 100).toFixed(0)}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="mt-3 pt-3 border-t flex justify-between">
                                                            <span className="text-sm font-medium">Total Withdrawal</span>
                                                            <span className="text-sm font-bold">${(60000).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-600">Effective Tax</span>
                                                            <span className="text-sm text-red-600">
                                                                ${((25400 * retirementTaxBracket / 100) + 3000).toLocaleString()} 
                                                                ({(((25400 * retirementTaxBracket / 100) + 3000) / 60000 * 100).toFixed(1)}%)
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                                            <h2 className="text-lg sm:text-xl font-semibold mb-4">Results Overview</h2>
                                            
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
                                                <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 rounded-lg">
                                                    <div className="text-xl sm:text-2xl font-bold text-green-700">
                                                        {results.successRate.toFixed(1)}%
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-green-600">Success Rate</div>
                                                </div>
                                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 rounded-lg">
                                                    <div className="text-xl sm:text-2xl font-bold text-blue-700">
                                                        ${(results.medianFinal / 1000000).toFixed(2)}M
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-blue-600">Median Final</div>
                                                </div>
                                                {results.totalSaved > 0 && (
                                                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-3 sm:p-4 rounded-lg">
                                                        <div className="text-xl sm:text-2xl font-bold text-indigo-700">
                                                            ${(results.totalSaved / 1000000).toFixed(1)}M
                                                        </div>
                                                        <div className="text-xs sm:text-sm text-indigo-600">Total Saved</div>
                                                    </div>
                                                )}
                                                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 sm:p-4 rounded-lg">
                                                    <div className="text-xl sm:text-2xl font-bold text-amber-700">
                                                        ${(results.totalWithdrawn / 1000000).toFixed(1)}M
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-amber-600">Total Withdrawn</div>
                                                </div>
                                                {results.peakValue && (
                                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-4 rounded-lg">
                                                        <div className="text-xl sm:text-2xl font-bold text-purple-700">
                                                            ${(results.peakValue / 1000000).toFixed(1)}M
                                                        </div>
                                                        <div className="text-xs sm:text-sm text-purple-600">Peak Value</div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Key Insight */}
                                            <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                                                <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Analysis</h3>
                                                <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                                                    {savingsYears > 0 
                                                        ? `With ${savingsYears} years of saving at ${savingsRate}% (${(currentIncome * savingsRate / 100 / 1000).toFixed(0)}k/year), your portfolio could grow significantly before retirement. ` 
                                                        : ''}
                                                    {strategyMix.growth >= 80 
                                                        ? `Your ${strategyMix.growth}% Growth allocation maximizes returns (${results.effectiveReturn.toFixed(1)}%) during accumulation but adds volatility.`
                                                        : strategyMix.growth >= 50
                                                        ? `Your balanced ${strategyMix.growth}% Growth allocation provides ${results.effectiveReturn.toFixed(1)}% returns with ${results.effectiveVolatility.toFixed(1)}% volatility.`
                                                        : `Conservative ${strategyMix.growth}% Growth allocation emphasizes stability with ${results.effectiveVolatility.toFixed(1)}% volatility.`}
                                                    {savingsRate < 0 && ` Warning: Negative savings rate means you're depleting capital even before retirement.`}
                                                    {stressScenario && ` (Including ${STRESS_SCENARIOS[stressScenario].name} scenario)`}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Main Chart */}
                                        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                                            <div style={{ height: '400px' }}>
                                                <canvas ref={pathsChartRef}></canvas>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-white rounded-xl shadow-lg p-8 sm:p-12 text-center">
                                        <div className="max-w-lg mx-auto">
                                            <svg className="mx-auto h-12 sm:h-16 w-12 sm:w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">Ready to Simulate</h3>
                                            <p className="text-sm sm:text-base text-gray-500 mb-4">
                                                Configure your portfolio strategy and run {simulations.toLocaleString()} simulations
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Simple Footer */}
                        <div className="mt-6 bg-white rounded-lg shadow p-4">
                            <div className="text-center text-xs text-gray-500">
                                <p className="mb-3">
                                    This tool provides hypothetical illustrations only. Past performance does not guarantee future results. 
                                    Please consult with a qualified financial advisor before making investment decisions.
                                </p>
                                <div className="flex justify-center gap-4">
                                    <a
                                        href="https://ethicic.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-700"
                                    >
                                        Ethical Capital
                                    </a>
                                    <span className="text-gray-400">•</span>
                                    <a
                                        href="https://buttondown.com/ethicic"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-700"
                                    >
                                        Newsletter
                                    </a>
                                    <span className="text-gray-400">•</span>
                                    <a
                                        href="https://forms.lessannoyingcrm.com/view/4050759343360583472689106586874"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-700"
                                    >
                                        Contact
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            );
        }

        ReactDOM.render(<PortfolioSimulator />, document.getElementById('root'));
