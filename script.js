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

    // Display results
    displayResults({
        fireNumber,
        yearsToFire,
        fireDate,
        monthlyIncome,
        progressPercent
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

    // Smooth scroll to results
    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
