let charts = {}; // cache Chart.js instances for cleanup

async function fetchStepData() {
    try {
        const response = await fetch('./data/hourly.json');
        const data = await response.json();
        return {
            labels: data.steps_per_hour.map(entry => entry.hour),
            steps: data.steps_per_hour.map(entry => entry.steps)
        };
    } catch (error) {
        console.error("Failed to fetch chart data:", error);
        return { labels: [], steps: [] };
    }
}

async function renderChart({ targetId, asImage = false, options = {} }) {
    const { labels, steps } = await fetchStepData();
    const targetEl = document.getElementById(targetId);

    if (!targetEl) {
        console.warn(`Element with ID "${targetId}" not found.`);
        return;
    }


    if (asImage) {
        const container = document.getElementById(targetId);
        container.innerHTML = '';


        const canvas = document.createElement('canvas');
        const containerWidth = container.clientWidth || 900;
        const canvasWidth = containerWidth;
        const canvasHeight = canvasWidth * 0.5;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Steps per Hour',
                    data: steps,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    x: {
                        ticks: { autoSkip: true, maxTicksLimit: 6 },
                        title: { display: true, text: 'Hour of Day' }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 200 },
                        title: { display: true, text: 'Steps' }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });

        // Convert to image
        setTimeout(() => {
            const img = document.createElement('img');
            img.src = canvas.toDataURL('image/png');
            img.alt = 'Steps Chart Preview';
            img.style.width = '100%';
            img.style.height = 'auto';
            container.innerHTML = '';
            container.appendChild(img);
            chart.destroy();
        }, 200);
    }
    else {
        // Live chart on existing canvas
        const canvas = targetEl;
        const ctx = canvas.getContext('2d');

        if (charts[targetId]) charts[targetId].destroy();

        charts[targetId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Steps per Hour',
                    data: steps,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: options.preview ? undefined : { display: true, text: 'Hour of Day' }
                    },
                    y: {
                        display: !options.preview,
                        beginAtZero: true,
                        title: options.preview ? undefined : { display: true, text: 'Steps' }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: !options.preview }
                }
            }
        });
    }
}

function showDetail(id) {
    document.querySelector('.container')?.style.setProperty('display', 'none');
    document.getElementById('detail-' + id)?.style.setProperty('display', 'block');

    if (id === 'steps') {
        renderChart({ targetId: 'hourlyStepsChart', asImage: false });
    }
}

function closeDetail() {
    document.querySelector('.container')?.style.setProperty('display', 'block');
    document.querySelectorAll('.detail-view').forEach(view => {
        view.style.setProperty('display', 'none');
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.detail-view').forEach(view => {
        view.style.display = 'none';
    });

    renderChart({
        targetId: 'stepsChartPreviewWrapper',
        asImage: true,
        options: { preview: true }
    });
});
