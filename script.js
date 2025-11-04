// Global variable to store chart instance
let portfolioChart = null;

document.getElementById('fireForm').addEventListener('submit', function(e) {
    e.preventDefault();
    calculateFIRE();
});

function calculateFIRE() {
    // Get input values
    const annualExpenses = parseFloat(document.getElementById('annualExpenses').value);
    const currentSavings = parseFloat(document.getElementById('currentSavings').value);
    const annualSavings = parseFloat(document.getElementById('annualSavings').value);
    const returnRate = parseFloat(document.getElementById('returnRate').value) / 100;
    const withdrawalRate = parseFloat(document.getElementById('withdrawalRate').value) / 100;

    // Calculate FIRE number (amount needed to retire)
    const fireNumber = annualExpenses / withdrawalRate;

    // Calculate years to FIRE using compound interest formula
    const yearsToFire = calculateYearsToGoal(currentSavings, annualSavings, fireNumber, returnRate);

    // Calculate FIRE date
    const currentYear = new Date().getFullYear();
    const fireYear = currentYear + Math.ceil(yearsToFire);
    const fireDate = new Date();
    fireDate.setFullYear(fireYear);

    // Calculate monthly passive income at FIRE
    const monthlyIncome = (fireNumber * withdrawalRate) / 12;

    // Calculate progress percentage
    const progressPercent = Math.min((currentSavings / fireNumber) * 100, 100);

    // Generate year-by-year portfolio data for chart
    const portfolioData = generatePortfolioProjection(
        currentSavings,
        annualSavings,
        fireNumber,
        returnRate,
        yearsToFire
    );

    // Display results
    displayResults({
        fireNumber,
        yearsToFire,
        fireDate,
        monthlyIncome,
        progressPercent,
        portfolioData
    });
}

function calculateYearsToGoal(currentAmount, annualContribution, goal, returnRate) {
    // If already at or above goal
    if (currentAmount >= goal) {
        return 0;
    }

    // If no annual contribution and current amount is less than goal
    if (annualContribution <= 0) {
        // Calculate using only investment growth
        if (returnRate <= 0) {
            return Infinity;
        }
        return Math.log(goal / currentAmount) / Math.log(1 + returnRate);
    }

    // Future Value of Annuity formula rearranged to solve for time
    // FV = PV(1+r)^n + PMT * [((1+r)^n - 1) / r]
    // Solving for n when FV = goal

    let years = 0;
    let balance = currentAmount;

    // Simulate year by year (more accurate for practical purposes)
    while (balance < goal && years < 100) {
        balance = balance * (1 + returnRate) + annualContribution;
        years++;
    }

    // If it takes more than 100 years, something is wrong with the inputs
    if (years >= 100) {
        return Infinity;
    }

    // Refine with a more precise calculation for fractional year
    if (years > 0) {
        const prevBalance = (balance - annualContribution) / (1 + returnRate);
        const yearFraction = (goal - prevBalance) / (balance - prevBalance);
        return years - 1 + yearFraction;
    }

    return years;
}

function generatePortfolioProjection(currentAmount, annualContribution, goal, returnRate, yearsToFire) {
    const years = [];
    const portfolioValues = [];
    const currentYear = new Date().getFullYear();

    let balance = currentAmount;
    const maxYears = Math.min(Math.ceil(yearsToFire) + 1, 50); // Cap at 50 years for display

    // Add current year (year 0)
    years.push(currentYear);
    portfolioValues.push(currentAmount);

    // Calculate portfolio value for each future year
    for (let year = 1; year <= maxYears; year++) {
        balance = balance * (1 + returnRate) + annualContribution;

        // Don't let it go too far beyond the goal
        if (balance >= goal && year > yearsToFire) {
            break;
        }

        years.push(currentYear + year);
        portfolioValues.push(balance);
    }

    return {
        years,
        portfolioValues,
        fireTarget: goal
    };
}

function displayResults(results) {
    // Show results section
    document.getElementById('results').classList.remove('hidden');

    // Format and display values
    document.getElementById('fireNumber').textContent = formatCurrency(results.fireNumber);

    const yearsText = results.yearsToFire === Infinity
        ? 'Not achievable with current inputs'
        : results.yearsToFire.toFixed(1) + ' years';
    document.getElementById('yearsToFire').textContent = yearsText;

    const fireDateText = results.yearsToFire === Infinity
        ? '-'
        : results.fireDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    document.getElementById('fireDate').textContent = fireDateText;

    document.getElementById('monthlyIncome').textContent = formatCurrency(results.monthlyIncome);

    document.getElementById('progressPercent').textContent = results.progressPercent.toFixed(1) + '%';
    document.getElementById('progressFill').style.width = results.progressPercent + '%';

    // Render portfolio growth chart
    renderPortfolioChart(results.portfolioData);

    // Smooth scroll to results
    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderPortfolioChart(data) {
    const ctx = document.getElementById('portfolioChart').getContext('2d');

    // Destroy existing chart if it exists
    if (portfolioChart) {
        portfolioChart.destroy();
    }

    // Create FIRE target line data (horizontal line at FIRE number)
    const fireTargetLine = data.years.map(() => data.fireTarget);

    // Create the chart
    portfolioChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.years,
            datasets: [
                {
                    label: 'Portfolio Value',
                    data: data.portfolioValues,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                },
                {
                    label: 'FIRE Target',
                    data: fireTargetLine,
                    borderColor: '#f56565',
                    backgroundColor: 'rgba(245, 101, 101, 0.05)',
                    borderWidth: 2,
                    borderDash: [10, 5],
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            }).format(context.parsed.y);
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Year',
                        font: {
                            size: 13,
                            weight: '600'
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Portfolio Value ($)',
                        font: {
                            size: 13,
                            weight: '600'
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000).toFixed(0) + 'k';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Add input validation and formatting
document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', function() {
        // Remove negative values
        if (this.value < 0) {
            this.value = 0;
        }
    });
});
